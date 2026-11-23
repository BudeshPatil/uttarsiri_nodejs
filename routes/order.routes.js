import express from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  checkoutQuoteSchema,
  createOrderSchema,
  orderIdSchema,
  cancelOrderSchema,
} from '../validators/order.validator.js';

const orderRoutes = express.Router();
const customerOnly = [authenticateJWT, authorizeRole(['CUSTOMER', 'SUPER_ADMIN', 'ADMIN'])];

orderRoutes.use(...customerOnly);

orderRoutes.post('/checkout/quote', validate(checkoutQuoteSchema), orderController.quote);
orderRoutes.post('/', validate(createOrderSchema), orderController.create);
orderRoutes.get('/', orderController.list);
orderRoutes.get('/:id', validate(orderIdSchema), orderController.getOne);
orderRoutes.post('/:id/cancel', validate(cancelOrderSchema), orderController.cancel);

export default orderRoutes;
