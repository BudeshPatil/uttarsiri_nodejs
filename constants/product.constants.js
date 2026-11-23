export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
};

export const VARIANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
};

export const PRODUCT_UNITS = ['g', 'kg', 'ml', 'l', 'pack', 'piece', 'box', 'dozen'];

export const PRODUCT_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_FETCHED: 'Product fetched successfully',
  PRODUCTS_FETCHED: 'Products fetched successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_SLUG_EXISTS: 'Product slug already exists',
  PRODUCT_SKU_EXISTS: 'Product SKU already exists',
  VARIANT_CREATED: 'Product variant created successfully',
  VARIANT_FETCHED: 'Product variant fetched successfully',
  VARIANTS_FETCHED: 'Product variants fetched successfully',
  VARIANT_UPDATED: 'Product variant updated successfully',
  VARIANT_DELETED: 'Product variant deleted successfully',
  VARIANT_NOT_FOUND: 'Product variant not found',
  VARIANT_SKU_EXISTS: 'Variant SKU already exists',
  INVALID_CATEGORIES: 'One or more category ids are invalid',
  SEARCH_COMPLETED: 'Product search completed successfully',
};

export const PRODUCT_PERMISSIONS = {
  CREATE: 'PRODUCTS_CREATE',
  READ: 'PRODUCTS_READ',
  UPDATE: 'PRODUCTS_UPDATE',
  DELETE: 'PRODUCTS_DELETE',
};

export default {
  PRODUCT_STATUS,
  VARIANT_STATUS,
  PRODUCT_UNITS,
  PRODUCT_MESSAGES,
  PRODUCT_PERMISSIONS,
};
