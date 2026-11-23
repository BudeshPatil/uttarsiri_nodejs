export const PAYMENT_TX_STATUS = {
  CREATED: 'created',
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

export const PAYMENT_GATEWAY = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
};

export const ONLINE_PAYMENT_METHODS = ['upi', 'card', 'netbanking'];

export const PAYMENT_MESSAGES = {
  CONFIG_FETCHED: 'Payment configuration fetched',
  ORDER_CREATED: 'Payment order created',
  PAYMENT_VERIFIED: 'Payment verified successfully',
  PAYMENT_FAILED: 'Payment failed',
  WEBHOOK_PROCESSED: 'Webhook processed',
  REFUND_INITIATED: 'Refund initiated',
  REFUND_PROCESSED: 'Refund processed',
  PAYMENT_NOT_FOUND: 'Payment not found',
  ORDER_NOT_FOUND: 'Order not found for payment',
  INVALID_SIGNATURE: 'Invalid payment signature',
  ALREADY_PAID: 'Payment already processed',
  DUPLICATE_EVENT: 'Duplicate payment event ignored',
  COD_DISABLED: 'Cash on delivery is not available',
  RAZORPAY_NOT_CONFIGURED: 'Online payments are not configured',
  REFUND_NOT_ALLOWED: 'Refund is not allowed for this payment',
  AMOUNT_MISMATCH: 'Payment amount does not match order total',
};

export default {
  PAYMENT_TX_STATUS,
  PAYMENT_GATEWAY,
  ONLINE_PAYMENT_METHODS,
  PAYMENT_MESSAGES,
};
