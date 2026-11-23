import orderService from '../services/order.service.js';
import { successResponse } from '../utils/response.util.js';
import { ORDER_MESSAGES } from '../constants/order.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';

export const quote = async (req, res, next) => {
  try {
    const quoteData = await orderService.getCheckoutQuote(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.OK, ORDER_MESSAGES.QUOTE_CALCULATED, { quote: quoteData });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const created = await orderService.createOrder(req.user.user_id, {
      ...req.body,
      idempotency_key: req.body.idempotency_key || req.headers['idempotency-key'],
    });
    const { payment, payment_error, ...order } = created || {};
    return successResponse(res, HTTP_STATUS.CREATED, ORDER_MESSAGES.ORDER_CREATED, {
      order,
      payment: payment || null,
      payment_error: payment_error || undefined,
    });
  } catch (error) {
    return next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await orderService.listCustomerOrders(req.user.user_id, req.query);
    return successResponse(res, HTTP_STATUS.OK, ORDER_MESSAGES.ORDERS_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const order = await orderService.getCustomerOrder(req.user.user_id, req.params.id);
    return successResponse(res, HTTP_STATUS.OK, ORDER_MESSAGES.ORDER_FETCHED, { order });
  } catch (error) {
    return next(error);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const order = await orderService.cancelCustomerOrder(
      req.user.user_id,
      req.params.id,
      req.body?.reason,
    );
    return successResponse(res, HTTP_STATUS.OK, ORDER_MESSAGES.ORDER_CANCELLED, { order });
  } catch (error) {
    return next(error);
  }
};

export default { quote, create, list, getOne, cancel };
