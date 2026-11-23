export const STOCK_MOVEMENT_TYPES = {
  ADJUSTMENT: 'adjustment',
  RESTOCK: 'restock',
  RESERVE: 'reserve',
  RELEASE: 'release',
  SALE: 'sale',
  RETURN: 'return',
  INITIAL: 'initial',
};

export const INVENTORY_MESSAGES = {
  INVENTORY_FETCHED: 'Inventory fetched successfully',
  INVENTORY_UPDATED: 'Inventory updated successfully',
  INVENTORY_NOT_FOUND: 'Inventory record not found',
  LOW_STOCK_FETCHED: 'Low-stock items fetched successfully',
  INSUFFICIENT_STOCK: 'Insufficient available stock',
  INVALID_ADJUSTMENT: 'Invalid stock adjustment',
};

export const INVENTORY_PERMISSIONS = {
  READ: 'INVENTORY_READ',
  UPDATE: 'INVENTORY_UPDATE',
};

export default { STOCK_MOVEMENT_TYPES, INVENTORY_MESSAGES, INVENTORY_PERMISSIONS };
