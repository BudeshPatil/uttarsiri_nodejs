import couponService from '../services/coupon.service.js';
import { successResponse } from '../utils/response.util.js';
import { COUPON_MESSAGES } from '../constants/coupon.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';

export const create = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body, req.user.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, COUPON_MESSAGES.COUPON_CREATED, { coupon });
  } catch (error) {
    return next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await couponService.listCoupons(req.query);
    return successResponse(res, HTTP_STATUS.OK, COUPON_MESSAGES.COUPONS_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const coupon = await couponService.getCoupon(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, COUPON_MESSAGES.COUPON_FETCHED, { coupon });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    return successResponse(res, HTTP_STATUS.OK, COUPON_MESSAGES.COUPON_UPDATED, { coupon });
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await couponService.deleteCoupon(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    return next(error);
  }
};

export default { create, list, getOne, update, remove };
