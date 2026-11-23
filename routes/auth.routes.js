import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validate,
  registerSchema,
  customerRegisterSchema,
  updateProfileSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';

const authRoutes = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               role_id: { type: string }
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Email already exists
 */
authRoutes.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/customer/register:
 *   post:
 *     summary: Register a storefront customer (auto-approved)
 *     tags: [Auth]
 */
authRoutes.post(
  '/customer/register',
  authRateLimiter,
  validate(customerRegisterSchema),
  authController.registerCustomer,
);

authRoutes.get('/me', authenticateJWT, authController.getProfile);
authRoutes.put('/me', authenticateJWT, validate(updateProfileSchema), authController.updateProfile);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending/blocked
 */
authRoutes.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
authRoutes.post('/logout', authenticateJWT, authController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset link sent
 */
authRoutes.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
authRoutes.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

authRoutes.post('/refresh', authRateLimiter, validate(refreshTokenSchema), authController.refresh);

export default authRoutes;
