import vendorService from '../services/vendor.service.js';
import { successResponse } from '../utils/response.util.js';
import { VENDOR_MESSAGES } from '../constants/vendor.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';

export const register = async (req, res, next) => {
  try {
    const result = await vendorService.registerVendor(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, VENDOR_MESSAGES.VENDOR_REGISTERED, result);
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorByUserId(req.user.user_id);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDOR_FETCHED, { vendor });
  } catch (error) {
    return next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateMyVendor(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDOR_UPDATED, { vendor });
  } catch (error) {
    return next(error);
  }
};

export const listAdmin = async (req, res, next) => {
  try {
    const result = await vendorService.listVendorsAdmin(req.query);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDORS_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const getAdmin = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorAdmin(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDOR_FETCHED, { vendor });
  } catch (error) {
    return next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const vendor = await vendorService.approveVendor(req.params.id, req.user.user_id);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDOR_APPROVED, { vendor });
  } catch (error) {
    return next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const vendor = await vendorService.rejectVendor(req.params.id, req.body?.reason);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDOR_REJECTED, { vendor });
  } catch (error) {
    return next(error);
  }
};

export const suspend = async (req, res, next) => {
  try {
    const vendor = await vendorService.suspendVendor(req.params.id, req.body?.reason);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.VENDOR_SUSPENDED, { vendor });
  } catch (error) {
    return next(error);
  }
};

export const dashboard = async (req, res, next) => {
  try {
    const summary = await vendorService.getDashboard(req.vendor);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.DASHBOARD_FETCHED, { summary });
  } catch (error) {
    return next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const result = await vendorService.listVendorProducts(req.vendor, req.query);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.PRODUCTS_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await vendorService.createVendorProduct(req.vendor, req.body, req.user.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, 'Product created successfully', { product });
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await vendorService.updateVendorProduct(
      req.vendor,
      req.params.id,
      req.body,
      req.user.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, 'Product updated successfully', { product });
  } catch (error) {
    return next(error);
  }
};

export const submitProduct = async (req, res, next) => {
  try {
    const product = await vendorService.submitProductForApproval(
      req.vendor,
      req.params.id,
      req.user.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.PRODUCT_SUBMITTED, { product });
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await vendorService.deleteVendorProduct(req.vendor, req.params.id, req.user.user_id);
    return successResponse(res, HTTP_STATUS.OK, 'Product deleted successfully');
  } catch (error) {
    return next(error);
  }
};

export const addVariant = async (req, res, next) => {
  try {
    const variant = await vendorService.upsertVendorVariant(
      req.vendor,
      req.params.id,
      req.body,
      req.user.user_id,
    );
    return successResponse(res, HTTP_STATUS.CREATED, 'Variant created successfully', { variant });
  } catch (error) {
    return next(error);
  }
};

export const updateVariant = async (req, res, next) => {
  try {
    const variant = await vendorService.updateVendorVariant(
      req.vendor,
      req.params.id,
      req.params.variantId,
      req.body,
      req.user.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, 'Variant updated successfully', { variant });
  } catch (error) {
    return next(error);
  }
};

export const listInventory = async (req, res, next) => {
  try {
    const result = await vendorService.listVendorInventory(req.vendor, req.query);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.INVENTORY_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const listLowStock = async (req, res, next) => {
  try {
    const result = await vendorService.listVendorLowStock(req.vendor, req.query);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.INVENTORY_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const inventoryDetail = async (req, res, next) => {
  try {
    const result = await vendorService.getVendorInventoryDetail(
      req.vendor,
      req.params.variantId,
      req.query,
    );
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.INVENTORY_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const updateInventory = async (req, res, next) => {
  try {
    const result = await vendorService.updateVendorInventory(
      req.vendor,
      req.params.variantId,
      req.body,
      req.user.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, 'Inventory updated successfully', result);
  } catch (error) {
    return next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const result = await vendorService.listVendorOrders(req.vendor, req.query);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.ORDERS_FETCHED, result);
  } catch (error) {
    return next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await vendorService.getVendorOrder(req.vendor, req.params.id);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.ORDERS_FETCHED, { order });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderItem = async (req, res, next) => {
  try {
    const order = await vendorService.updateVendorOrderItemStatus(req.vendor, req.params.id, req.body);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.ORDER_UPDATED, { order });
  } catch (error) {
    return next(error);
  }
};

export const reports = async (req, res, next) => {
  try {
    const reportsData = await vendorService.getVendorReports(req.vendor);
    return successResponse(res, HTTP_STATUS.OK, VENDOR_MESSAGES.REPORTS_FETCHED, { reports: reportsData });
  } catch (error) {
    return next(error);
  }
};

export default {
  register,
  getMe,
  updateMe,
  listAdmin,
  getAdmin,
  approve,
  reject,
  suspend,
  dashboard,
  listProducts,
  createProduct,
  updateProduct,
  submitProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  listInventory,
  listLowStock,
  inventoryDetail,
  updateInventory,
  listOrders,
  getOrder,
  updateOrderItem,
  reports,
};
