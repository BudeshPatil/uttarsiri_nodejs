import express from 'express';
import vendorController from '../controllers/vendor.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import { resolveVendor, requireApprovedVendor } from '../middlewares/vendor.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validate,
  vendorRegisterSchema,
  updateVendorSchema,
  vendorIdSchema,
  rejectSuspendSchema,
  vendorOrderStatusSchema,
  vendorProductIdSchema,
} from '../validators/vendor.validator.js';
import {
  validate as productValidate,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from '../validators/product.validator.js';
import { validate as inventoryValidate, updateInventorySchema } from '../validators/inventory.validator.js';

const vendorRoutes = express.Router();

/** Public vendor registration */
vendorRoutes.post(
  '/register',
  authRateLimiter,
  validate(vendorRegisterSchema),
  vendorController.register,
);

/** Admin vendor management */
vendorRoutes.get(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  vendorController.listAdmin,
);
vendorRoutes.get(
  '/admin/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(vendorIdSchema),
  vendorController.getAdmin,
);
vendorRoutes.put(
  '/admin/:id/approve',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(vendorIdSchema),
  vendorController.approve,
);
vendorRoutes.put(
  '/admin/:id/reject',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(rejectSuspendSchema),
  vendorController.reject,
);
vendorRoutes.put(
  '/admin/:id/suspend',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(rejectSuspendSchema),
  vendorController.suspend,
);

/** Authenticated vendor profile (any vendor status can view) */
vendorRoutes.get('/me', authenticateJWT, authorizeRole(['VENDOR']), vendorController.getMe);
vendorRoutes.put(
  '/me',
  authenticateJWT,
  authorizeRole(['VENDOR']),
  validate(updateVendorSchema),
  vendorController.updateMe,
);

/** Approved-vendor business APIs */
const approvedVendor = [
  authenticateJWT,
  authorizeRole(['VENDOR']),
  resolveVendor,
  requireApprovedVendor,
];

vendorRoutes.get('/portal/dashboard', ...approvedVendor, vendorController.dashboard);
vendorRoutes.get('/portal/reports', ...approvedVendor, vendorController.reports);

vendorRoutes.get('/portal/products', ...approvedVendor, vendorController.listProducts);
vendorRoutes.post(
  '/portal/products',
  ...approvedVendor,
  productValidate(createProductSchema),
  vendorController.createProduct,
);
vendorRoutes.put(
  '/portal/products/:id',
  ...approvedVendor,
  productValidate(updateProductSchema),
  vendorController.updateProduct,
);
vendorRoutes.post(
  '/portal/products/:id/submit',
  ...approvedVendor,
  validate(vendorProductIdSchema),
  vendorController.submitProduct,
);
vendorRoutes.delete(
  '/portal/products/:id',
  ...approvedVendor,
  validate(vendorProductIdSchema),
  vendorController.deleteProduct,
);
vendorRoutes.post(
  '/portal/products/:id/variants',
  ...approvedVendor,
  productValidate(createVariantSchema),
  vendorController.addVariant,
);
vendorRoutes.put(
  '/portal/products/:id/variants/:variantId',
  ...approvedVendor,
  productValidate(updateVariantSchema),
  vendorController.updateVariant,
);

vendorRoutes.get('/portal/inventory', ...approvedVendor, vendorController.listInventory);
vendorRoutes.get('/portal/inventory/low-stock', ...approvedVendor, vendorController.listLowStock);
vendorRoutes.get(
  '/portal/inventory/:variantId',
  ...approvedVendor,
  vendorController.inventoryDetail,
);
vendorRoutes.put(
  '/portal/inventory/:variantId',
  ...approvedVendor,
  inventoryValidate(updateInventorySchema),
  vendorController.updateInventory,
);

vendorRoutes.get('/portal/orders', ...approvedVendor, vendorController.listOrders);
vendorRoutes.get('/portal/orders/:id', ...approvedVendor, vendorController.getOrder);
vendorRoutes.put(
  '/portal/orders/:id/items',
  ...approvedVendor,
  validate(vendorOrderStatusSchema),
  vendorController.updateOrderItem,
);

export default vendorRoutes;
