import express from 'express';
import projectCategoryController from '../controllers/projectCategory.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createProjectCategorySchema,
  updateProjectCategorySchema,
  projectCategoryIdSchema,
} from '../validators/projectCategory.validator.js';

const projectCategoryRoutes = express.Router();

projectCategoryRoutes.get('/public', projectCategoryController.getPublicCategories);

projectCategoryRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(createProjectCategorySchema), projectCategoryController.createCategory);
projectCategoryRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), projectCategoryController.getAllCategories);
projectCategoryRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(projectCategoryIdSchema), projectCategoryController.getCategoryById);
projectCategoryRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(updateProjectCategorySchema), projectCategoryController.updateCategory);
projectCategoryRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(projectCategoryIdSchema), projectCategoryController.deleteCategory);

export default projectCategoryRoutes;
