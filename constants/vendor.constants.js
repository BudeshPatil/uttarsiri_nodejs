export const VENDOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

export const VENDOR_ORDER_ITEM_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  PREPARING: 'preparing',
  READY: 'ready',
  DISPATCHED: 'dispatched',
};

export const VENDOR_MESSAGES = {
  VENDOR_REGISTERED: 'Vendor registration submitted. Awaiting approval.',
  VENDOR_FETCHED: 'Vendor profile fetched successfully',
  VENDORS_FETCHED: 'Vendors fetched successfully',
  VENDOR_UPDATED: 'Vendor profile updated successfully',
  VENDOR_APPROVED: 'Vendor approved successfully',
  VENDOR_REJECTED: 'Vendor rejected successfully',
  VENDOR_SUSPENDED: 'Vendor suspended successfully',
  VENDOR_NOT_FOUND: 'Vendor not found',
  VENDOR_NOT_APPROVED: 'Vendor account is not approved for this action',
  DASHBOARD_FETCHED: 'Vendor dashboard fetched successfully',
  PRODUCTS_FETCHED: 'Vendor products fetched successfully',
  PRODUCT_SUBMITTED: 'Product submitted for admin approval',
  ORDERS_FETCHED: 'Vendor orders fetched successfully',
  ORDER_UPDATED: 'Order item status updated successfully',
  INVENTORY_FETCHED: 'Vendor inventory fetched successfully',
  REPORTS_FETCHED: 'Vendor reports fetched successfully',
  ACCESS_DENIED: 'You do not have access to this resource',
  INVALID_STATUS_TRANSITION: 'Invalid order status transition',
};

export const DEFAULT_COMMISSION_RATE = 0.1;

export const VENDOR_PERMISSIONS = {
  PRODUCTS_READ: 'VENDOR_PRODUCTS_READ',
  PRODUCTS_WRITE: 'VENDOR_PRODUCTS_WRITE',
  INVENTORY_READ: 'VENDOR_INVENTORY_READ',
  INVENTORY_WRITE: 'VENDOR_INVENTORY_WRITE',
  ORDERS_READ: 'VENDOR_ORDERS_READ',
  ORDERS_WRITE: 'VENDOR_ORDERS_WRITE',
  REPORTS_READ: 'VENDOR_REPORTS_READ',
  APPROVE: 'VENDORS_APPROVE',
};

export default {
  VENDOR_STATUS,
  VENDOR_ORDER_ITEM_STATUS,
  VENDOR_MESSAGES,
  DEFAULT_COMMISSION_RATE,
  VENDOR_PERMISSIONS,
};
