import orderRepository from '../repositories/order.repository.js';
import paymentRepository from '../repositories/payment.repository.js';
import razorpayConfig, { isRazorpayConfigured } from '../config/razorpay.config.js';
import {
  getRazorpayClient,
  toPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../utils/razorpay.util.js';
import {
  ONLINE_PAYMENT_METHODS,
  PAYMENT_GATEWAY,
  PAYMENT_MESSAGES,
  PAYMENT_TX_STATUS,
} from '../constants/payment.constants.js';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../constants/order.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

const auditEvent = (event_type, source, note = '', payload = null, event_id = null) => ({
  event_id,
  event_type,
  source,
  note,
  payload,
  created_at: new Date().toISOString(),
});

const isOnlineMethod = (method) => ONLINE_PAYMENT_METHODS.includes(method);

export const getPaymentConfig = () => {
  const onlineEnabled = isRazorpayConfigured();
  const methods = [];
  if (razorpayConfig.codEnabled) methods.push(PAYMENT_METHODS.COD);
  if (onlineEnabled) methods.push(...ONLINE_PAYMENT_METHODS);

  return {
    currency: razorpayConfig.currency,
    cod_enabled: razorpayConfig.codEnabled,
    online_enabled: onlineEnabled,
    razorpay_key_id: onlineEnabled ? razorpayConfig.keyId : null,
    payment_methods: methods,
  };
};

export const assertPaymentMethodAllowed = (paymentMethod) => {
  const config = getPaymentConfig();
  if (!config.payment_methods.includes(paymentMethod)) {
    if (paymentMethod === PAYMENT_METHODS.COD) {
      throw new AppError(PAYMENT_MESSAGES.COD_DISABLED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }
    throw new AppError(
      PAYMENT_MESSAGES.RAZORPAY_NOT_CONFIGURED,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.BUSINESS_VALIDATION_ERROR,
    );
  }
};

const buildCheckoutPayload = (payment, order, customer) => ({
  payment_id: payment.payment_id,
  order_id: order.order_id,
  order_number: order.order_number,
  amount: payment.amount,
  amount_paise: payment.amount_paise,
  currency: payment.currency,
  key_id: razorpayConfig.keyId,
  razorpay_order_id: payment.razorpay_order_id,
  payment_method: payment.payment_method,
  status: payment.status,
  customer: {
    name: customer?.name || order.customer_name || '',
    email: customer?.email || order.customer_email || '',
    contact: customer?.phone || order.customer_phone || '',
  },
  notes: {
    order_id: order.order_id,
    order_number: order.order_number,
  },
  prefill_method: payment.payment_method,
});

/**
 * Create (or reuse) a Razorpay order for an unpaid storefront order.
 * Amount is always taken from the backend order total — never from the client.
 */
export const createPaymentOrder = async (userId, orderId, { payment_method, idempotency_key } = {}) => {
  const order = await orderRepository.getById(orderId);
  if (!order || order.customer_id !== userId) {
    throw new AppError(PAYMENT_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (order.order_status === ORDER_STATUS.CANCELLED) {
    throw new AppError('Cannot pay for a cancelled order', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  if (order.payment_status === PAYMENT_STATUS.PAID) {
    throw new AppError(PAYMENT_MESSAGES.ALREADY_PAID, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }

  const method = payment_method || order.payment_method;
  if (!isOnlineMethod(method)) {
    throw new AppError('Selected payment method does not require online checkout', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  assertPaymentMethodAllowed(method);

  if (idempotency_key) {
    const byKey = await paymentRepository.getByIdempotencyKey(userId, idempotency_key);
    if (byKey) {
      return buildCheckoutPayload(byKey, order, null);
    }
  }

  const existing = await paymentRepository.getByOrderId(orderId);
  if (existing) {
    if (existing.status === PAYMENT_TX_STATUS.PAID) {
      throw new AppError(PAYMENT_MESSAGES.ALREADY_PAID, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    if (
      existing.razorpay_order_id &&
      [PAYMENT_TX_STATUS.CREATED, PAYMENT_TX_STATUS.PENDING, PAYMENT_TX_STATUS.AUTHORIZED].includes(existing.status)
    ) {
      return buildCheckoutPayload(existing, order, null);
    }
  }

  const amountPaise = toPaise(order.total);
  if (amountPaise < 100) {
    throw new AppError('Order amount is too low for online payment', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const razorpay = getRazorpayClient();
  const rzOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: razorpayConfig.currency,
    receipt: order.order_number.slice(0, 40),
    notes: {
      order_id: order.order_id,
      order_number: order.order_number,
      customer_id: userId,
    },
  });

  let payment = existing;
  if (payment) {
    payment = await paymentRepository.updatePayment(payment.payment_id, {
      payment_method: method,
      amount: order.total,
      amount_paise: amountPaise,
      currency: razorpayConfig.currency,
      status: PAYMENT_TX_STATUS.CREATED,
      razorpay_order_id: rzOrder.id,
      failure_reason: null,
      idempotency_key: idempotency_key || payment.idempotency_key,
    });
    await paymentRepository.appendAuditEvent(
      payment.payment_id,
      auditEvent('razorpay_order_recreated', 'api', 'Razorpay order created', { razorpay_order_id: rzOrder.id }),
    );
  } else {
    payment = await paymentRepository.createPayment({
      order_id: order.order_id,
      order_number: order.order_number,
      customer_id: userId,
      gateway: PAYMENT_GATEWAY.RAZORPAY,
      payment_method: method,
      amount: order.total,
      amount_paise: amountPaise,
      currency: razorpayConfig.currency,
      status: PAYMENT_TX_STATUS.CREATED,
      razorpay_order_id: rzOrder.id,
      idempotency_key: idempotency_key || null,
      audit_log: [
        auditEvent('razorpay_order_created', 'api', 'Razorpay order created', { razorpay_order_id: rzOrder.id }),
      ],
    });
  }

  await orderRepository.updateOrder(order.order_id, {
    payment_method: method,
    payment_status: PAYMENT_STATUS.PENDING,
  });

  await createAuditLog({
    userId,
    action: 'PAYMENT_CREATE',
    module: 'PAYMENT',
    newData: { payment_id: payment.payment_id, order_id: order.order_id, razorpay_order_id: rzOrder.id },
  }).catch(() => {});

  return buildCheckoutPayload(payment, order, null);
};

/**
 * Verify browser checkout signature and mark order paid (idempotent).
 */
export const verifyPayment = async (userId, payload = {}) => {
  const {
    order_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = payload;

  if (!verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
    throw new AppError(PAYMENT_MESSAGES.INVALID_SIGNATURE, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const order = await orderRepository.getById(order_id);
  if (!order || order.customer_id !== userId) {
    throw new AppError(PAYMENT_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  let payment = await paymentRepository.getByRazorpayOrderId(razorpay_order_id);
  if (!payment) payment = await paymentRepository.getByOrderId(order_id);
  if (!payment || payment.order_id !== order_id) {
    throw new AppError(PAYMENT_MESSAGES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (payment.status === PAYMENT_TX_STATUS.PAID || order.payment_status === PAYMENT_STATUS.PAID) {
    return {
      order,
      payment,
      already_processed: true,
      message: PAYMENT_MESSAGES.ALREADY_PAID,
    };
  }

  if (payment.amount_paise !== toPaise(order.total)) {
    throw new AppError(PAYMENT_MESSAGES.AMOUNT_MISMATCH, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const eventId = `verify:${razorpay_payment_id}`;
  const updated = await paymentRepository.markEventProcessed(payment.payment_id, eventId, {
    status: PAYMENT_TX_STATUS.PAID,
    razorpay_payment_id,
    razorpay_signature,
    failure_reason: null,
  });

  if (!updated) {
    const latest = await paymentRepository.getById(payment.payment_id);
    const latestOrder = await orderRepository.getById(order_id);
    return {
      order: latestOrder,
      payment: latest,
      already_processed: true,
      message: PAYMENT_MESSAGES.DUPLICATE_EVENT,
    };
  }

  await paymentRepository.appendAuditEvent(
    payment.payment_id,
    auditEvent('payment_verified', 'checkout', 'Client checkout signature verified', {
      razorpay_payment_id,
    }, eventId),
  );

  const updatedOrder = await orderRepository.updateOrder(order_id, {
    payment_status: PAYMENT_STATUS.PAID,
    order_status: order.order_status === ORDER_STATUS.PLACED ? ORDER_STATUS.CONFIRMED : order.order_status,
  });

  await createAuditLog({
    userId,
    action: 'PAYMENT_VERIFY',
    module: 'PAYMENT',
    newData: { payment_id: payment.payment_id, order_id, razorpay_payment_id },
  }).catch(() => {});

  return {
    order: updatedOrder,
    payment: await paymentRepository.getById(payment.payment_id),
    already_processed: false,
    message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
  };
};

export const markPaymentFailed = async (userId, { order_id, reason } = {}) => {
  const order = await orderRepository.getById(order_id);
  if (!order || order.customer_id !== userId) {
    throw new AppError(PAYMENT_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (order.payment_status === PAYMENT_STATUS.PAID) {
    return { order, already_processed: true };
  }

  const payment = await paymentRepository.getByOrderId(order_id);
  if (payment && payment.status !== PAYMENT_TX_STATUS.PAID) {
    await paymentRepository.updatePayment(payment.payment_id, {
      status: PAYMENT_TX_STATUS.FAILED,
      failure_reason: reason || 'Payment failed or cancelled by customer',
    });
    await paymentRepository.appendAuditEvent(
      payment.payment_id,
      auditEvent('payment_failed', 'checkout', reason || 'Payment failed'),
    );
  }

  const updatedOrder = await orderRepository.updateOrder(order_id, {
    payment_status: PAYMENT_STATUS.FAILED,
  });

  return { order: updatedOrder, already_processed: false };
};

const applyCapturedPayment = async (payment, entity, eventId, source) => {
  if (payment.status === PAYMENT_TX_STATUS.PAID) {
    return { duplicate: true };
  }

  const order = await orderRepository.getById(payment.order_id);
  if (!order) return { duplicate: false, skipped: true };

  if (Number(entity.amount) && Number(entity.amount) !== payment.amount_paise) {
    logger.warn('Webhook amount mismatch', {
      payment_id: payment.payment_id,
      expected: payment.amount_paise,
      got: entity.amount,
    });
    throw new AppError(PAYMENT_MESSAGES.AMOUNT_MISMATCH, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const updated = await paymentRepository.markEventProcessed(payment.payment_id, eventId, {
    status: PAYMENT_TX_STATUS.PAID,
    razorpay_payment_id: entity.id || payment.razorpay_payment_id,
    failure_reason: null,
  });

  if (!updated) return { duplicate: true };

  await paymentRepository.appendAuditEvent(
    payment.payment_id,
    auditEvent('payment_captured', source, 'Payment captured via webhook/verify', entity, eventId),
  );

  if (order.payment_status !== PAYMENT_STATUS.PAID) {
    await orderRepository.updateOrder(order.order_id, {
      payment_status: PAYMENT_STATUS.PAID,
      order_status: order.order_status === ORDER_STATUS.PLACED ? ORDER_STATUS.CONFIRMED : order.order_status,
    });
  }

  await createAuditLog({
    userId: payment.customer_id,
    action: 'PAYMENT_CAPTURED',
    module: 'PAYMENT',
    newData: { payment_id: payment.payment_id, order_id: order.order_id, event_id: eventId },
  }).catch(() => {});

  return { duplicate: false };
};

const applyFailedPayment = async (payment, entity, eventId, source) => {
  if ([PAYMENT_TX_STATUS.PAID, PAYMENT_TX_STATUS.REFUNDED].includes(payment.status)) {
    return { duplicate: true };
  }

  const updated = await paymentRepository.markEventProcessed(payment.payment_id, eventId, {
    status: PAYMENT_TX_STATUS.FAILED,
    razorpay_payment_id: entity.id || payment.razorpay_payment_id,
    failure_reason: entity.error_description || entity.error_code || 'Payment failed',
  });
  if (!updated) return { duplicate: true };

  await paymentRepository.appendAuditEvent(
    payment.payment_id,
    auditEvent('payment_failed', source, 'Payment failed', entity, eventId),
  );

  const order = await orderRepository.getById(payment.order_id);
  if (order && order.payment_status !== PAYMENT_STATUS.PAID) {
    await orderRepository.updateOrder(order.order_id, { payment_status: PAYMENT_STATUS.FAILED });
  }

  return { duplicate: false };
};

const applyRefundEvent = async (payment, entity, eventId, source) => {
  const refundAmountPaise = Number(entity.amount) || payment.amount_paise;
  const fullyRefunded = refundAmountPaise >= payment.amount_paise;
  const status = fullyRefunded ? PAYMENT_TX_STATUS.REFUNDED : PAYMENT_TX_STATUS.PARTIALLY_REFUNDED;

  const updated = await paymentRepository.markEventProcessed(payment.payment_id, eventId, {
    status,
    refund_id: entity.id || payment.refund_id,
    refund_amount: Math.round(refundAmountPaise) / 100,
  });
  if (!updated) return { duplicate: true };

  await paymentRepository.appendAuditEvent(
    payment.payment_id,
    auditEvent('refund_processed', source, 'Refund processed', entity, eventId),
  );

  if (fullyRefunded) {
    await orderRepository.updateOrder(payment.order_id, { payment_status: PAYMENT_STATUS.REFUNDED });
  }

  await createAuditLog({
    userId: payment.customer_id,
    action: 'PAYMENT_REFUND',
    module: 'PAYMENT',
    newData: { payment_id: payment.payment_id, refund_id: entity.id, event_id: eventId },
  }).catch(() => {});

  return { duplicate: false };
};

export const handleWebhook = async (rawBody, signature) => {
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new AppError(PAYMENT_MESSAGES.INVALID_SIGNATURE, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  let event;
  try {
    event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new AppError('Invalid webhook payload', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const eventId = event.event_id || event.id || `${event.event}:${event.created_at || Date.now()}`;
  const entity = event?.payload?.payment?.entity
    || event?.payload?.refund?.entity
    || event?.payload?.order?.entity
    || {};

  const razorpayOrderId = entity.order_id || entity.id;
  const razorpayPaymentId = event?.payload?.payment?.entity?.id || entity.payment_id || null;

  let payment = null;
  if (razorpayPaymentId) {
    payment = await paymentRepository.getByRazorpayPaymentId(razorpayPaymentId);
  }
  if (!payment && razorpayOrderId) {
    payment = await paymentRepository.getByRazorpayOrderId(razorpayOrderId);
  }
  if (!payment && entity.notes?.order_id) {
    payment = await paymentRepository.getByOrderId(entity.notes.order_id);
  }

  if (!payment) {
    logger.warn('Webhook for unknown payment', { event: event.event, eventId });
    return { processed: false, reason: 'payment_not_found', event_id: eventId };
  }

  if (payment.processed_event_ids?.includes(eventId)) {
    return { processed: false, reason: 'duplicate', event_id: eventId, message: PAYMENT_MESSAGES.DUPLICATE_EVENT };
  }

  const eventName = String(event.event || '');
  let result = { duplicate: false };

  if (eventName === 'payment.captured' || eventName === 'order.paid') {
    result = await applyCapturedPayment(payment, entity, eventId, 'webhook');
  } else if (eventName === 'payment.failed') {
    result = await applyFailedPayment(payment, entity, eventId, 'webhook');
  } else if (eventName === 'payment.authorized') {
    const updated = await paymentRepository.markEventProcessed(payment.payment_id, eventId, {
      status: PAYMENT_TX_STATUS.AUTHORIZED,
      razorpay_payment_id: entity.id || payment.razorpay_payment_id,
    });
    if (updated) {
      await paymentRepository.appendAuditEvent(
        payment.payment_id,
        auditEvent('payment_authorized', 'webhook', 'Payment authorized', entity, eventId),
      );
    }
    result = { duplicate: !updated };
  } else if (eventName.startsWith('refund.')) {
    result = await applyRefundEvent(payment, entity, eventId, 'webhook');
  } else {
    await paymentRepository.appendAuditEvent(
      payment.payment_id,
      auditEvent(eventName || 'webhook_ignored', 'webhook', 'Unhandled webhook event', event, eventId),
    );
    await paymentRepository.markEventProcessed(payment.payment_id, eventId, {});
  }

  return {
    processed: !result.duplicate,
    duplicate: Boolean(result.duplicate),
    event_id: eventId,
    payment_id: payment.payment_id,
    message: result.duplicate ? PAYMENT_MESSAGES.DUPLICATE_EVENT : PAYMENT_MESSAGES.WEBHOOK_PROCESSED,
  };
};

/**
 * Initiate a Razorpay refund for a paid order. Admin or internal cancel flow.
 */
export const refundPayment = async (actorUserId, { order_id, payment_id, amount, reason } = {}) => {
  let payment = null;
  if (payment_id) payment = await paymentRepository.getById(payment_id);
  if (!payment && order_id) payment = await paymentRepository.getByOrderId(order_id);

  if (!payment) {
    throw new AppError(PAYMENT_MESSAGES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (payment.status !== PAYMENT_TX_STATUS.PAID && payment.status !== PAYMENT_TX_STATUS.PARTIALLY_REFUNDED) {
    throw new AppError(PAYMENT_MESSAGES.REFUND_NOT_ALLOWED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }
  if (!payment.razorpay_payment_id) {
    throw new AppError(PAYMENT_MESSAGES.REFUND_NOT_ALLOWED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const refundPaise = amount != null ? toPaise(amount) : payment.amount_paise - toPaise(payment.refund_amount || 0);
  if (refundPaise <= 0) {
    throw new AppError(PAYMENT_MESSAGES.REFUND_NOT_ALLOWED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const razorpay = getRazorpayClient();
  const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
    amount: refundPaise,
    notes: {
      order_id: payment.order_id,
      reason: reason || 'Refund requested',
      actor_user_id: actorUserId,
    },
  });

  const newRefundTotal = (Number(payment.refund_amount) || 0) + refundPaise / 100;
  const fullyRefunded = toPaise(newRefundTotal) >= payment.amount_paise;

  await paymentRepository.updatePayment(payment.payment_id, {
    status: fullyRefunded ? PAYMENT_TX_STATUS.REFUNDED : PAYMENT_TX_STATUS.PARTIALLY_REFUNDED,
    refund_id: refund.id,
    refund_amount: newRefundTotal,
  });
  await paymentRepository.appendAuditEvent(
    payment.payment_id,
    auditEvent('refund_initiated', 'api', reason || 'Refund initiated', refund),
  );

  if (fullyRefunded) {
    await orderRepository.updateOrder(payment.order_id, { payment_status: PAYMENT_STATUS.REFUNDED });
  }

  await createAuditLog({
    userId: actorUserId,
    action: 'PAYMENT_REFUND_INITIATE',
    module: 'PAYMENT',
    newData: { payment_id: payment.payment_id, refund_id: refund.id, amount: refundPaise / 100 },
  }).catch(() => {});

  return {
    payment: await paymentRepository.getById(payment.payment_id),
    refund,
    message: PAYMENT_MESSAGES.REFUND_INITIATED,
  };
};

export const getPaymentByOrder = async (userId, orderId, { isAdmin = false } = {}) => {
  const order = await orderRepository.getById(orderId);
  if (!order) {
    throw new AppError(PAYMENT_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (!isAdmin && order.customer_id !== userId) {
    throw new AppError(PAYMENT_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  const payment = await paymentRepository.getByOrderId(orderId);
  return { order, payment };
};

export default {
  getPaymentConfig,
  assertPaymentMethodAllowed,
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  handleWebhook,
  refundPayment,
  getPaymentByOrder,
  isOnlineMethod,
};
