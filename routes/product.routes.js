import express from 'express';
import productController from '../controllers/product.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdSchema,
  searchProductsSchema,
} from '../validators/product.validator.js';

const productRoutes = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Grocery products, variants and multilingual search
 */

/**
 * @swagger
 * /api/products/public:
 *   get:
 *     tags: [Products]
 *     summary: Public active products
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [en, kn, hi] }
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Products list
 */
productRoutes.get('/public', productController.getPublicProducts);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products by English / Kannada / Hindi names and aliases
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [en, kn, hi] }
 *     responses:
 *       200:
 *         description: Search results
 */
productRoutes.get('/search', validate(searchProductsSchema), productController.searchProducts);

productRoutes.post(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(createProductSchema),
  productController.createProduct,
);
productRoutes.get(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  productController.getAllProducts,
);

productRoutes.post(
  '/:id/variants',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(createVariantSchema),
  productController.createProductVariant,
);
productRoutes.get(
  '/:id/variants',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(productIdSchema),
  productController.getProductVariants,
);
productRoutes.put(
  '/:id/variants/:variantId',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(updateVariantSchema),
  productController.updateProductVariant,
);
productRoutes.delete(
  '/:id/variants/:variantId',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(variantIdSchema),
  productController.deleteProductVariant,
);

productRoutes.get(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(productIdSchema),
  productController.getProductById,
);
productRoutes.put(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(updateProductSchema),
  productController.updateProduct,
);
productRoutes.delete(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(productIdSchema),
  productController.deleteProduct,
);

export default productRoutes;
