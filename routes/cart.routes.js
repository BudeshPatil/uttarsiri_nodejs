import express from 'express';
import cartController from '../controllers/cart.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  addCartItemSchema,
  updateCartItemSchema,
  cartVariantIdSchema,
  applyCouponSchema,
  mergeCartSchema,
} from '../validators/cart.validator.js';

const cartRoutes = express.Router();
const customerOnly = [authenticateJWT, authorizeRole(['CUSTOMER', 'SUPER_ADMIN', 'ADMIN'])];

cartRoutes.use(...customerOnly);

cartRoutes.get('/', cartController.getCart);
cartRoutes.post('/items', validate(addCartItemSchema), cartController.addItem);
cartRoutes.put('/items/:variantId', validate(updateCartItemSchema), cartController.updateItem);
cartRoutes.delete('/items/:variantId', validate(cartVariantIdSchema), cartController.removeItem);
cartRoutes.delete('/', cartController.clear);
cartRoutes.post('/coupon', validate(applyCouponSchema), cartController.applyCoupon);
cartRoutes.delete('/coupon', cartController.removeCoupon);
cartRoutes.post('/merge', validate(mergeCartSchema), cartController.merge);

export default cartRoutes;
