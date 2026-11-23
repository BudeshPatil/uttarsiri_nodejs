import express from 'express';
import settingsController from '../controllers/settings.controller.js';
import { authenticateJWT, authorizePermission } from '../middlewares/auth.middleware.js';
import { validate, updateSettingsSchema } from '../validators/settings.validator.js';

const settingsRoutes = express.Router();

/**
 * @swagger
 * /api/settings/branding:
 *   get:
 *     summary: Get public branding (logo/favicon) without auth
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Branding fetched
 */
settingsRoutes.get('/branding', settingsController.getBranding);

/**
 * @swagger
 * /api/settings/public:
 *   get:
 *     summary: Public site settings (branding + stats) for the website, no auth
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public settings fetched
 */
settingsRoutes.get('/public', settingsController.getPublicSettings);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched
 */
settingsRoutes.get('/', authenticateJWT, authorizePermission(['SETTINGS_READ']), settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated
 */
settingsRoutes.put('/', authenticateJWT, authorizePermission(['SETTINGS_UPDATE']), validate(updateSettingsSchema), settingsController.updateSettings);

export default settingsRoutes;
