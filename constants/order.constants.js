export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_METHODS = {
  COD: 'cod',
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
};

export const DELIVERY_OPTIONS = {
  STANDARD: 'standard',
  EXPRESS: 'express',
};

export const ORDER_MESSAGES = {
  ORDER_CREATED: 'Order placed successfully',
  ORDERS_FETCHED: 'Orders fetched successfully',
  ORDER_FETCHED: 'Order fetched successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  ORDER_NOT_FOUND: 'Order not found',
  CART_EMPTY: 'Cart is empty',
  INSUFFICIENT_STOCK: 'Insufficient stock for one or more items',
  INVALID_ADDRESS: 'Delivery address is required',
  INVALID_COUPON: 'Coupon is invalid or expired',
  DUPLICATE_ORDER: 'Duplicate order request detected',
  CANCEL_NOT_ALLOWED: 'This order cannot be cancelled',
  QUOTE_CALCULATED: 'Checkout quote calculated',
};

/** Pricing rules calculated only on the backend. */
export const PRICING = {
  TAX_RATE: 0.05,
  STANDARD_DELIVERY: 40,
  EXPRESS_DELIVERY: 80,
  FREE_DELIVERY_MIN_SUBTOTAL: 499,
};

export const CANCELABLE_STATUSES = [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED];

export default {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DELIVERY_OPTIONS,
  ORDER_MESSAGES,
  PRICING,
  CANCELABLE_STATUSES,
};
