import paymentService from '../services/payment.service.js';
import { successResponse } from '../utils/response.util.js';
import { PAYMENT_MESSAGES } from '../constants/payment.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';

export const getConfig = async (req, res, next) => {
  try {
    const config = paymentService.getPaymentConfig();
    return successResponse(res, HTTP_STATUS.OK, PAYMENT_MESSAGES.CONFIG_FETCHED, { config });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const payment = await paymentService.createPaymentOrder(req.user.user_id, req.body.order_id, {
      payment_method: req.body.payment_method,
      idempotency_key: req.body.idempotency_key || req.headers['idempotency-key'],
    });
    return successResponse(res, HTTP_STATUS.CREATED, PAYMENT_MESSAGES.ORDER_CREATED, { payment });
  } catch (error) {
    return next(error);
  }
};

export const verify = async (req, res, next) => {
  try {
    const result = await paymentService.verifyPayment(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message, result);
  } catch (error) {
    return next(error);
  }
};

export const fail = async (req, res, next) => {
  try {
    const result = await paymentService.markPaymentFailed(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.OK, PAYMENT_MESSAGES.PAYMENT_FAILED, result);
  } catch (error) {
    return next(error);
  }
};

export const webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})));
    const result = await paymentService.handleWebhook(rawBody, signature);
    return successResponse(res, HTTP_STATUS.OK, result.message || PAYMENT_MESSAGES.WEBHOOK_PROCESSED, result);
  } catch (error) {
    return next(error);
  }
};

export const refund = async (req, res, next) => {
  try {
    const result = await paymentService.refundPayment(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message, result);
  } catch (error) {
    return next(error);
  }
};

export const getByOrder = async (req, res, next) => {
  try {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role_code);
    const result = await paymentService.getPaymentByOrder(req.user.user_id, req.params.orderId, { isAdmin });
    return successResponse(res, HTTP_STATUS.OK, PAYMENT_MESSAGES.CONFIG_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export default { getConfig, create, verify, fail, webhook, refund, getByOrder };
