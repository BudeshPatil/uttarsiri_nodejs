export const CATEGORY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const CATEGORY_MESSAGES = {
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_FETCHED: 'Category fetched successfully',
  CATEGORIES_FETCHED: 'Categories fetched successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_SLUG_EXISTS: 'Category slug already exists',
  PARENT_NOT_FOUND: 'Parent category not found',
  INVALID_PARENT: 'A category cannot be its own parent',
};

export const CATEGORY_PERMISSIONS = {
  CREATE: 'CATEGORIES_CREATE',
  READ: 'CATEGORIES_READ',
  UPDATE: 'CATEGORIES_UPDATE',
  DELETE: 'CATEGORIES_DELETE',
};

export default { CATEGORY_STATUS, CATEGORY_MESSAGES, CATEGORY_PERMISSIONS };
