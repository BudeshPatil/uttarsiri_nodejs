import express from 'express';
import serviceController from '../controllers/service.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  serviceSlugSchema,
} from '../validators/service.validator.js';

const serviceRoutes = express.Router();

serviceRoutes.get('/public', serviceController.getPublicServices);
serviceRoutes.get('/public/:slug', validate(serviceSlugSchema), serviceController.getPublicServiceBySlug);

serviceRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(createServiceSchema), serviceController.createService);
serviceRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), serviceController.getAllServices);
serviceRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(serviceIdSchema), serviceController.getServiceById);
serviceRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(updateServiceSchema), serviceController.updateService);
serviceRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(serviceIdSchema), serviceController.deleteService);

export default serviceRoutes;
