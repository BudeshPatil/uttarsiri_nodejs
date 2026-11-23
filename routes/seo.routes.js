import express from 'express';
import seoController from '../controllers/seo.controller.js';
import { authenticateJWT, authorizePermission } from '../middlewares/auth.middleware.js';
import { validate, updateSeoSchema } from '../validators/settings.validator.js';

const seoRoutes = express.Router();

/**
 * @swagger
 * /api/seo:
 *   get:
 *     summary: Get SEO settings
 *     tags: [SEO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SEO settings fetched
 */
seoRoutes.get('/', authenticateJWT, authorizePermission(['SEO_READ']), seoController.getSeo);

/**
 * @swagger
 * /api/seo:
 *   put:
 *     summary: Update SEO settings
 *     tags: [SEO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SEO settings updated
 */
seoRoutes.put('/', authenticateJWT, authorizePermission(['SEO_UPDATE']), validate(updateSeoSchema), seoController.updateSeo);

/**
 * @swagger
 * /api/seo/generate-sitemap:
 *   post:
 *     summary: Generate sitemap.xml
 *     tags: [SEO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sitemap generated
 */
seoRoutes.post('/generate-sitemap', authenticateJWT, authorizePermission(['SEO_UPDATE']), seoController.generateSitemap);

/**
 * @swagger
 * /api/seo/generate-robots:
 *   post:
 *     summary: Generate robots.txt
 *     tags: [SEO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Robots.txt generated
 */
seoRoutes.post('/generate-robots', authenticateJWT, authorizePermission(['SEO_UPDATE']), seoController.generateRobots);

export default seoRoutes;
