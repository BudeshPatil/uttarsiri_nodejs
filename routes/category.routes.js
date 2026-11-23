import express from 'express';
import categoryController from '../controllers/category.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from '../validators/category.validator.js';

const categoryRoutes = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Grocery category and subcategory management
 */

/**
 * @swagger
 * /api/categories/public:
 *   get:
 *     tags: [Categories]
 *     summary: Public category tree
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, enum: [en, kn, hi] }
 *     responses:
 *       200:
 *         description: Active categories
 */
categoryRoutes.get('/public', categoryController.getPublicCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create category or subcategory
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Category created
 *   get:
 *     tags: [Categories]
 *     summary: List categories (admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Categories list
 */
categoryRoutes.post(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(createCategorySchema),
  categoryController.createCategory,
);
categoryRoutes.get(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  categoryController.getAllCategories,
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category detail
 */
categoryRoutes.get(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(categoryIdSchema),
  categoryController.getCategoryById,
);
categoryRoutes.put(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);
categoryRoutes.delete(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(categoryIdSchema),
  categoryController.deleteCategory,
);

export default categoryRoutes;
