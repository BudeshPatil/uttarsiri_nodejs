import express from 'express';
import userController from '../controllers/user.controller.js';
import { authenticateJWT, authorizeRole, authorizePermission } from '../middlewares/auth.middleware.js';
import {
  validate,
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from '../validators/user.validator.js';

const userRoutes = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User created
 */
userRoutes.post(
  '/',
  authenticateJWT,
  authorizePermission(['USERS_CREATE']),
  validate(createUserSchema),
  userController.createUser,
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: role_id
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Users fetched
 */
userRoutes.get('/', authenticateJWT, authorizePermission(['USERS_READ']), userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User fetched
 *       404:
 *         description: User not found
 */
userRoutes.get('/:id', authenticateJWT, authorizePermission(['USERS_READ']), validate(userIdSchema), userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 */
userRoutes.put('/:id', authenticateJWT, authorizePermission(['USERS_UPDATE']), validate(updateUserSchema), userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
userRoutes.delete('/:id', authenticateJWT, authorizePermission(['USERS_DELETE']), validate(userIdSchema), userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/approve:
 *   put:
 *     summary: Approve user registration
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User approved
 *       422:
 *         description: Already approved
 */
userRoutes.put('/:id/approve', authenticateJWT, authorizePermission(['USERS_APPROVE']), validate(userIdSchema), userController.approveUser);

/**
 * @swagger
 * /api/users/{id}/reject:
 *   put:
 *     summary: Reject user registration
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User rejected
 */
userRoutes.put('/:id/reject', authenticateJWT, authorizePermission(['USERS_APPROVE']), validate(userIdSchema), userController.rejectUser);

/**
 * @swagger
 * /api/users/{id}/block:
 *   put:
 *     summary: Block user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User blocked
 */
userRoutes.put('/:id/block', authenticateJWT, authorizePermission(['USERS_BLOCK']), validate(userIdSchema), userController.blockUser);

/**
 * @swagger
 * /api/users/{id}/unblock:
 *   put:
 *     summary: Unblock user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User unblocked
 */
userRoutes.put('/:id/unblock', authenticateJWT, authorizePermission(['USERS_BLOCK']), validate(userIdSchema), userController.unblockUser);

export default userRoutes;
