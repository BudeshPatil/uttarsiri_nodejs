import express from 'express';
import galleryController from '../controllers/gallery.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createGallerySchema,
  updateGallerySchema,
  galleryIdSchema,
} from '../validators/gallery.validator.js';

const galleryRoutes = express.Router();

galleryRoutes.get('/public', galleryController.getPublicGalleries);

galleryRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(createGallerySchema), galleryController.createGallery);
galleryRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), galleryController.getAllGalleries);
galleryRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(galleryIdSchema), galleryController.getGalleryById);
galleryRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(updateGallerySchema), galleryController.updateGallery);
galleryRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(galleryIdSchema), galleryController.deleteGallery);

export default galleryRoutes;
