import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCheckoutTotals,
  calculateCouponDiscount,
  calculateDeliveryCharges,
} from '../utils/pricing.util.js';
import { COUPON_TYPES } from '../constants/coupon.constants.js';
import { DELIVERY_OPTIONS } from '../constants/order.constants.js';

test('percentage coupon discount respects max cap', () => {
  const discount = calculateCouponDiscount(1000, {
    discount_type: COUPON_TYPES.PERCENTAGE,
    discount_value: 20,
    max_discount_amount: 100,
    minimum_order_amount: 0,
  });
  assert.equal(discount, 100);
});

test('fixed coupon cannot exceed subtotal', () => {
  const discount = calculateCouponDiscount(80, {
    discount_type: COUPON_TYPES.FIXED,
    discount_value: 120,
    minimum_order_amount: 0,
  });
  assert.equal(discount, 80);
});

test('invalid coupon below minimum returns zero discount', () => {
  const discount = calculateCouponDiscount(100, {
    discount_type: COUPON_TYPES.FIXED,
    discount_value: 20,
    minimum_order_amount: 500,
  });
  assert.equal(discount, 0);
});

test('free standard delivery above threshold', () => {
  assert.equal(calculateDeliveryCharges(500, DELIVERY_OPTIONS.STANDARD), 0);
  assert.equal(calculateDeliveryCharges(100, DELIVERY_OPTIONS.STANDARD), 40);
  assert.equal(calculateDeliveryCharges(1000, DELIVERY_OPTIONS.EXPRESS), 80);
});

test('checkout totals calculate tax and final amount on backend', () => {
  const totals = calculateCheckoutTotals({
    lineItems: [
      { line_total: 200 },
      { line_total: 300 },
    ],
    coupon: {
      discount_type: COUPON_TYPES.PERCENTAGE,
      discount_value: 10,
      minimum_order_amount: 0,
    },
    deliveryOption: DELIVERY_OPTIONS.STANDARD,
  });

  // Delivery is based on post-discount amount (450 < free-delivery threshold 499).
  assert.equal(totals.subtotal, 500);
  assert.equal(totals.discount, 50);
  assert.equal(totals.delivery_charges, 40);
  assert.equal(totals.tax, 22.5);
  assert.equal(totals.total, 512.5);
});
