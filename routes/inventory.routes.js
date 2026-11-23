import express from 'express';
import inventoryController from '../controllers/inventory.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  updateInventorySchema,
  inventoryVariantIdSchema,
} from '../validators/inventory.validator.js';

const inventoryRoutes = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock levels, reservations and low-stock alerts
 */

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     tags: [Inventory]
 *     summary: List low-stock variants
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Low-stock inventory
 */
inventoryRoutes.get(
  '/low-stock',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  inventoryController.getLowStock,
);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Inventory list
 */
inventoryRoutes.get(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  inventoryController.getAllInventory,
);

/**
 * @swagger
 * /api/inventory/{variantId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Inventory detail and stock movement history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Inventory with movements
 *   put:
 *     tags: [Inventory]
 *     summary: Adjust stock / reserve / release / thresholds
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Inventory updated
 */
inventoryRoutes.get(
  '/:variantId',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(inventoryVariantIdSchema),
  inventoryController.getInventoryByVariantId,
);
inventoryRoutes.put(
  '/:variantId',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']),
  validate(updateInventorySchema),
  inventoryController.updateInventory,
);

export default inventoryRoutes;
