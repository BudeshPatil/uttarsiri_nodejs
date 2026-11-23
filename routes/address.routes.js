import express from 'express';
import addressController from '../controllers/address.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
} from '../validators/address.validator.js';

const addressRoutes = express.Router();
const customerOnly = [authenticateJWT, authorizeRole(['CUSTOMER', 'SUPER_ADMIN', 'ADMIN'])];

addressRoutes.use(...customerOnly);

addressRoutes.get('/', addressController.list);
addressRoutes.get('/:id', validate(addressIdSchema), addressController.getOne);
addressRoutes.post('/', validate(createAddressSchema), addressController.create);
addressRoutes.put('/:id', validate(updateAddressSchema), addressController.update);
addressRoutes.delete('/:id', validate(addressIdSchema), addressController.remove);
addressRoutes.post('/:id/default', validate(addressIdSchema), addressController.setDefault);

export default addressRoutes;
