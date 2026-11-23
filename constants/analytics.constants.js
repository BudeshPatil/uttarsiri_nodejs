export const ANALYTICS_MESSAGES = {
  OVERVIEW_FETCHED: 'Analytics overview fetched',
  SALES_FETCHED: 'Sales report fetched',
  ORDERS_FETCHED: 'Orders report fetched',
  PRODUCTS_FETCHED: 'Products report fetched',
  INVENTORY_FETCHED: 'Inventory report fetched',
  CUSTOMERS_FETCHED: 'Customers report fetched',
  VENDORS_FETCHED: 'Vendors report fetched',
  EXPORT_READY: 'Export data ready',
};

export const ANALYTICS_SECTIONS = [
  'overview',
  'sales',
  'orders',
  'products',
  'inventory',
  'customers',
  'vendors',
];

export const TREND_GRANULARITY = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

/** Order statuses treated as still in progress / pending fulfilment. */
export const PENDING_ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped'];

export const COMPLETED_ORDER_STATUS = 'delivered';
export const CANCELLED_ORDER_STATUS = 'cancelled';

export default {
  ANALYTICS_MESSAGES,
  ANALYTICS_SECTIONS,
  TREND_GRANULARITY,
  PENDING_ORDER_STATUSES,
  COMPLETED_ORDER_STATUS,
  CANCELLED_ORDER_STATUS,
};
