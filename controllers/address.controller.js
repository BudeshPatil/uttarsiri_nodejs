import addressService from '../services/address.service.js';
import { successResponse } from '../utils/response.util.js';
import { ADDRESS_MESSAGES } from '../constants/address.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const list = async (req, res, next) => {
  try {
    const result = await addressService.listAddresses(req.user.user_id);
    return successResponse(res, HTTP_STATUS.OK, ADDRESS_MESSAGES.ADDRESSES_FETCHED, result);
  } catch (error) {
    logger.error('address list failed', { error: error.message });
    return next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const address = await addressService.getAddress(req.user.user_id, req.params.id);
    return successResponse(res, HTTP_STATUS.OK, ADDRESS_MESSAGES.ADDRESS_FETCHED, { address });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const address = await addressService.createAddress(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.CREATED, ADDRESS_MESSAGES.ADDRESS_CREATED, { address });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const address = await addressService.updateAddress(req.user.user_id, req.params.id, req.body);
    return successResponse(res, HTTP_STATUS.OK, ADDRESS_MESSAGES.ADDRESS_UPDATED, { address });
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await addressService.deleteAddress(req.user.user_id, req.params.id);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    return next(error);
  }
};

export const setDefault = async (req, res, next) => {
  try {
    const address = await addressService.setDefaultAddress(req.user.user_id, req.params.id);
    return successResponse(res, HTTP_STATUS.OK, ADDRESS_MESSAGES.DEFAULT_SET, { address });
  } catch (error) {
    return next(error);
  }
};

export default { list, getOne, create, update, remove, setDefault };
