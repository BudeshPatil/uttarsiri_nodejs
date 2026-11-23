import express from 'express';
import faqController from '../controllers/faq.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import { validate, createFaqSchema, updateFaqSchema, faqIdSchema } from '../validators/faq.validator.js';

const faqRoutes = express.Router();

faqRoutes.get('/public', faqController.getPublicFaqs);

faqRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(createFaqSchema), faqController.createFaq);
faqRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), faqController.getAllFaqs);
faqRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(faqIdSchema), faqController.getFaqById);
faqRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(updateFaqSchema), faqController.updateFaq);
faqRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(faqIdSchema), faqController.deleteFaq);

export default faqRoutes;
