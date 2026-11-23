import express from 'express';
import couponController from '../controllers/coupon.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createCouponSchema,
  updateCouponSchema,
  couponIdSchema,
} from '../validators/coupon.validator.js';

const couponRoutes = express.Router();
const adminOnly = [authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'])];

couponRoutes.use(...adminOnly);

couponRoutes.get('/', couponController.list);
couponRoutes.get('/:id', validate(couponIdSchema), couponController.getOne);
couponRoutes.post('/', validate(createCouponSchema), couponController.create);
couponRoutes.put('/:id', validate(updateCouponSchema), couponController.update);
couponRoutes.delete('/:id', validate(couponIdSchema), couponController.remove);

export default couponRoutes;
