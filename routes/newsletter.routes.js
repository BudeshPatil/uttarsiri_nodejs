import express from 'express';
import newsletterController from '../controllers/newsletter.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import { validate, subscriberIdSchema } from '../validators/newsletter.validator.js';

const newsletterRoutes = express.Router();

newsletterRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), newsletterController.getAllSubscribers);
newsletterRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(subscriberIdSchema), newsletterController.getSubscriberById);
newsletterRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(subscriberIdSchema), newsletterController.deleteSubscriber);

export default newsletterRoutes;
