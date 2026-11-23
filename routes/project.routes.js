import express from 'express';
import projectController from '../controllers/project.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  projectSlugSchema,
} from '../validators/project.validator.js';

const projectRoutes = express.Router();

projectRoutes.get('/public', projectController.getPublicProjects);
projectRoutes.get('/public/:slug', validate(projectSlugSchema), projectController.getPublicProjectBySlug);

projectRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(createProjectSchema), projectController.createProject);
projectRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), projectController.getAllProjects);
projectRoutes.get('/slug/:slug', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(projectSlugSchema), projectController.getProjectBySlug);
projectRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(projectIdSchema), projectController.getProjectById);
projectRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']), validate(updateProjectSchema), projectController.updateProject);
projectRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(projectIdSchema), projectController.deleteProject);

export default projectRoutes;
