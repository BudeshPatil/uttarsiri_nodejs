import express from 'express';
import testimonialController from '../controllers/testimonial.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialIdSchema,
} from '../validators/testimonial.validator.js';

const testimonialRoutes = express.Router();

testimonialRoutes.get('/public', testimonialController.getPublicTestimonials);

testimonialRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(createTestimonialSchema), testimonialController.createTestimonial);
testimonialRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), testimonialController.getAllTestimonials);
testimonialRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(testimonialIdSchema), testimonialController.getTestimonialById);
testimonialRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(updateTestimonialSchema), testimonialController.updateTestimonial);
testimonialRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(testimonialIdSchema), testimonialController.deleteTestimonial);

export default testimonialRoutes;
