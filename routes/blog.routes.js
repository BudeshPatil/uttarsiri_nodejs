import express from 'express';
import blogController from '../controllers/blog.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createBlogSchema,
  updateBlogSchema,
  blogIdSchema,
} from '../validators/blog.validator.js';

const blogRoutes = express.Router();

blogRoutes.get('/public', blogController.getPublicBlogs);
blogRoutes.get('/public/:slug', blogController.getPublicBlogBySlug);

blogRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(createBlogSchema), blogController.createBlog);
blogRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), blogController.getAllBlogs);
blogRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(blogIdSchema), blogController.getBlogById);
blogRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(updateBlogSchema), blogController.updateBlog);
blogRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(blogIdSchema), blogController.deleteBlog);

export default blogRoutes;
