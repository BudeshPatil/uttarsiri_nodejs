import express from 'express';
import contactController from '../controllers/contact.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createContactSchema,
  updateContactSchema,
  contactIdSchema,
} from '../validators/contact.validator.js';

const contactRoutes = express.Router();

contactRoutes.post('/', validate(createContactSchema), contactController.createContact);

contactRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'SALES_EXECUTIVE']), contactController.getAllContacts);
contactRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'SALES_EXECUTIVE']), validate(contactIdSchema), contactController.getContactById);
contactRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'SALES_EXECUTIVE']), validate(updateContactSchema), contactController.updateContact);
contactRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(contactIdSchema), contactController.deleteContact);

export default contactRoutes;
