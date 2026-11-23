import couponRepository from '../repositories/coupon.repository.js';
import orderRepository from '../repositories/order.repository.js';
import { COUPON_MESSAGES, COUPON_STATUS } from '../constants/coupon.constants.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createCoupon = async (payload, userId) => {
  const existing = await couponRepository.getByCode(payload.code);
  if (existing) {
    throw new AppError(COUPON_MESSAGES.COUPON_CODE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }
  return couponRepository.createCoupon(payload, userId);
};

export const listCoupons = async (query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const result = await couponRepository.listCoupons({ ...query, limit, skip });
  return {
    coupons: result.items,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: result.items.length,
      total: result.total,
    }),
  };
};

export const getCoupon = async (couponId) => {
  const coupon = await couponRepository.getById(couponId);
  if (!coupon) {
    throw new AppError(COUPON_MESSAGES.COUPON_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return coupon;
};

export const updateCoupon = async (couponId, payload) => {
  const coupon = await couponRepository.getById(couponId);
  if (!coupon) {
    throw new AppError(COUPON_MESSAGES.COUPON_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (payload.code && payload.code.toUpperCase() !== coupon.code) {
    const duplicate = await couponRepository.getByCode(payload.code);
    if (duplicate) {
      throw new AppError(COUPON_MESSAGES.COUPON_CODE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    payload.code = String(payload.code).trim().toUpperCase();
  }
  return couponRepository.updateCoupon(couponId, payload);
};

export const deleteCoupon = async (couponId) => {
  const coupon = await couponRepository.getById(couponId);
  if (!coupon) {
    throw new AppError(COUPON_MESSAGES.COUPON_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  await couponRepository.softDelete(couponId);
  return { message: COUPON_MESSAGES.COUPON_DELETED };
};

export const validateCouponForUser = async (code, userId, subtotal = 0) => {
  const coupon = await couponRepository.getByCode(code);
  if (!coupon || coupon.status !== COUPON_STATUS.ACTIVE) {
    throw new AppError(COUPON_MESSAGES.COUPON_INVALID, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    throw new AppError(COUPON_MESSAGES.COUPON_INVALID, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    throw new AppError(COUPON_MESSAGES.COUPON_EXPIRED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    throw new AppError(
      COUPON_MESSAGES.COUPON_USAGE_EXCEEDED,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.BUSINESS_VALIDATION_ERROR,
    );
  }

  if (Number(subtotal) < Number(coupon.minimum_order_amount || 0)) {
    throw new AppError(COUPON_MESSAGES.COUPON_MIN_ORDER, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  if (userId && coupon.per_user_limit) {
    const prior = await orderRepository.listByCustomer(userId, { limit: 100, skip: 0 });
    const usedByUser = prior.items.filter(
      (order) => order.coupon_code === coupon.code && order.order_status !== 'cancelled',
    ).length;
    if (usedByUser >= coupon.per_user_limit) {
      throw new AppError(
        COUPON_MESSAGES.COUPON_USAGE_EXCEEDED,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.BUSINESS_VALIDATION_ERROR,
      );
    }
  }

  return coupon;
};

export default {
  createCoupon,
  listCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCouponForUser,
};
