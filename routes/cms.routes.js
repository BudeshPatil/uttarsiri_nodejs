import express from 'express';
import cmsController from '../controllers/cms.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createCmsPageSchema,
  updateCmsPageSchema,
  cmsPageIdSchema,
} from '../validators/cms.validator.js';

const cmsRoutes = express.Router();

cmsRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(createCmsPageSchema), cmsController.createPage);
cmsRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), cmsController.getAllPages);
cmsRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(cmsPageIdSchema), cmsController.getPageById);
cmsRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(updateCmsPageSchema), cmsController.updatePage);
cmsRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(cmsPageIdSchema), cmsController.deletePage);

export default cmsRoutes;
