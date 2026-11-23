import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createPaymentSchema,
  verifyPaymentSchema,
  failPaymentSchema,
  refundPaymentSchema,
  paymentOrderIdSchema,
} from '../validators/payment.validator.js';

const paymentRoutes = express.Router();
const customerOnly = [authenticateJWT, authorizeRole(['CUSTOMER', 'SUPER_ADMIN', 'ADMIN'])];
const adminOnly = [authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN'])];

paymentRoutes.get('/config', paymentController.getConfig);
paymentRoutes.post('/webhook', paymentController.webhook);

paymentRoutes.post('/create', ...customerOnly, validate(createPaymentSchema), paymentController.create);
paymentRoutes.post('/verify', ...customerOnly, validate(verifyPaymentSchema), paymentController.verify);
paymentRoutes.post('/fail', ...customerOnly, validate(failPaymentSchema), paymentController.fail);
paymentRoutes.get('/order/:orderId', ...customerOnly, validate(paymentOrderIdSchema), paymentController.getByOrder);
paymentRoutes.post('/refund', ...adminOnly, validate(refundPaymentSchema), paymentController.refund);

export default paymentRoutes;
