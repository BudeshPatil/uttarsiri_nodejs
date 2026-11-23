import express from 'express';
import bannerController from '../controllers/banner.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createBannerSchema,
  updateBannerSchema,
  bannerIdSchema,
} from '../validators/banner.validator.js';

const bannerRoutes = express.Router();

/**
 * @swagger
 * /api/banners/public:
 *   get:
 *     summary: Get active homepage banners (no auth)
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: Active banners for homepage slider
 */
bannerRoutes.get('/public', bannerController.getPublicBanners);

bannerRoutes.post(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(createBannerSchema),
  bannerController.createBanner,
);

bannerRoutes.get(
  '/',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  bannerController.getAllBanners,
);

bannerRoutes.get(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(bannerIdSchema),
  bannerController.getBannerById,
);

bannerRoutes.put(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(updateBannerSchema),
  bannerController.updateBanner,
);

bannerRoutes.delete(
  '/:id',
  authenticateJWT,
  authorizeRole(['SUPER_ADMIN', 'ADMIN']),
  validate(bannerIdSchema),
  bannerController.deleteBanner,
);

export default bannerRoutes;
