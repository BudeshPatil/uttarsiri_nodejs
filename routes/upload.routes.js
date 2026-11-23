import express from 'express';
import uploadController from '../controllers/upload.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';
import { validate, uploadIdSchema } from '../validators/upload.validator.js';

const uploadRoutes = express.Router();

uploadRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), uploadMiddleware.single('file'), uploadController.uploadFile);
uploadRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), uploadController.getAllUploads);
uploadRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(uploadIdSchema), uploadController.deleteUpload);

export default uploadRoutes;
