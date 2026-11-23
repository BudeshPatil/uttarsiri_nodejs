export const COUPON_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

export const COUPON_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const COUPON_MESSAGES = {
  COUPON_CREATED: 'Coupon created successfully',
  COUPON_UPDATED: 'Coupon updated successfully',
  COUPON_DELETED: 'Coupon deleted successfully',
  COUPONS_FETCHED: 'Coupons fetched successfully',
  COUPON_FETCHED: 'Coupon fetched successfully',
  COUPON_APPLIED: 'Coupon applied successfully',
  COUPON_REMOVED: 'Coupon removed',
  COUPON_NOT_FOUND: 'Coupon not found',
  COUPON_INVALID: 'Coupon is invalid',
  COUPON_EXPIRED: 'Coupon has expired',
  COUPON_USAGE_EXCEEDED: 'Coupon usage limit reached',
  COUPON_MIN_ORDER: 'Order does not meet the minimum amount for this coupon',
  COUPON_CODE_EXISTS: 'Coupon code already exists',
};

export default { COUPON_TYPES, COUPON_STATUS, COUPON_MESSAGES };
