import { DELIVERY_OPTIONS, PRICING } from '../constants/order.constants.js';
import { COUPON_TYPES } from '../constants/coupon.constants.js';

export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const calculateDeliveryCharges = (subtotal, deliveryOption = DELIVERY_OPTIONS.STANDARD) => {
  const amount = Number(subtotal) || 0;
  if (deliveryOption === DELIVERY_OPTIONS.EXPRESS) {
    return PRICING.EXPRESS_DELIVERY;
  }
  if (amount >= PRICING.FREE_DELIVERY_MIN_SUBTOTAL) {
    return 0;
  }
  return PRICING.STANDARD_DELIVERY;
};

export const calculateTax = (taxableAmount) => roundMoney(Math.max(0, Number(taxableAmount) || 0) * PRICING.TAX_RATE);

export const calculateCouponDiscount = (subtotal, coupon) => {
  if (!coupon) return 0;
  const base = Math.max(0, Number(subtotal) || 0);
  if (base < Number(coupon.minimum_order_amount || 0)) return 0;

  let discount = 0;
  if (coupon.discount_type === COUPON_TYPES.FIXED) {
    discount = Number(coupon.discount_value) || 0;
  } else {
    discount = (base * (Number(coupon.discount_value) || 0)) / 100;
    if (coupon.max_discount_amount != null) {
      discount = Math.min(discount, Number(coupon.max_discount_amount));
    }
  }

  return roundMoney(Math.min(discount, base));
};

export const calculateCheckoutTotals = ({
  lineItems = [],
  coupon = null,
  deliveryOption = DELIVERY_OPTIONS.STANDARD,
}) => {
  const subtotal = roundMoney(
    lineItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0),
  );
  const discount = calculateCouponDiscount(subtotal, coupon);
  const delivery_charges = calculateDeliveryCharges(subtotal - discount, deliveryOption);
  const taxable = Math.max(0, subtotal - discount);
  const tax = calculateTax(taxable);
  const total = roundMoney(taxable + delivery_charges + tax);

  return {
    subtotal,
    discount,
    delivery_charges,
    tax,
    tax_rate: PRICING.TAX_RATE,
    total,
  };
};

export default {
  roundMoney,
  calculateDeliveryCharges,
  calculateTax,
  calculateCouponDiscount,
  calculateCheckoutTotals,
};
