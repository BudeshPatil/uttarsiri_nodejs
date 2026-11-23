import express from 'express';
import analyticsController from '../controllers/analytics.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import { validate, analyticsQuerySchema } from '../validators/analytics.validator.js';

const analyticsRoutes = express.Router();
const adminOnly = [authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN'])];

analyticsRoutes.use(...adminOnly);

analyticsRoutes.get('/overview', validate(analyticsQuerySchema), analyticsController.overview);
analyticsRoutes.get('/sales', validate(analyticsQuerySchema), analyticsController.sales);
analyticsRoutes.get('/orders', validate(analyticsQuerySchema), analyticsController.orders);
analyticsRoutes.get('/products', validate(analyticsQuerySchema), analyticsController.products);
analyticsRoutes.get('/inventory', validate(analyticsQuerySchema), analyticsController.inventory);
analyticsRoutes.get('/customers', validate(analyticsQuerySchema), analyticsController.customers);
analyticsRoutes.get('/vendors', validate(analyticsQuerySchema), analyticsController.vendors);
analyticsRoutes.get('/export', validate(analyticsQuerySchema), analyticsController.exportReport);

export default analyticsRoutes;
