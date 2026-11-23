import analyticsService from '../services/analytics.service.js';
import { successResponse } from '../utils/response.util.js';
import { ANALYTICS_MESSAGES } from '../constants/analytics.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';

export const overview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.OVERVIEW_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const sales = async (req, res, next) => {
  try {
    const data = await analyticsService.getSalesReport(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.SALES_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const orders = async (req, res, next) => {
  try {
    const data = await analyticsService.getOrdersReport(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.ORDERS_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const products = async (req, res, next) => {
  try {
    const data = await analyticsService.getProductsReport(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.PRODUCTS_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const inventory = async (req, res, next) => {
  try {
    const data = await analyticsService.getInventoryReport(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.INVENTORY_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const customers = async (req, res, next) => {
  try {
    const data = await analyticsService.getCustomersReport(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.CUSTOMERS_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const vendors = async (req, res, next) => {
  try {
    const data = await analyticsService.getVendorsReport(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.VENDORS_FETCHED, data);
  } catch (error) {
    return next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const data = await analyticsService.getExportRows(req.query);
    return successResponse(res, HTTP_STATUS.OK, ANALYTICS_MESSAGES.EXPORT_READY, data);
  } catch (error) {
    return next(error);
  }
};

export default {
  overview,
  sales,
  orders,
  products,
  inventory,
  customers,
  vendors,
  exportReport,
};
