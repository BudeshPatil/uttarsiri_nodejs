import express from 'express';
import roleController from '../controllers/role.controller.js';
import { authenticateJWT, authorizePermission } from '../middlewares/auth.middleware.js';
import {
  validate,
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
} from '../validators/role.validator.js';

const roleRoutes = express.Router();

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Role created
 */
// roleRoutes.post('/', authenticateJWT, authorizePermission(['ROLES_CREATE']), validate(createRoleSchema), roleController.createRole);
roleRoutes.post('/', validate(createRoleSchema), roleController.createRole);
/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles fetched
 */
roleRoutes.get('/', authenticateJWT, authorizePermission(['ROLES_READ']), roleController.getAllRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role fetched
 */
roleRoutes.get('/:id', authenticateJWT, authorizePermission(['ROLES_READ']), validate(roleIdSchema), roleController.getRoleById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role updated
 */
roleRoutes.put('/:id', authenticateJWT, authorizePermission(['ROLES_UPDATE']), validate(updateRoleSchema), roleController.updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role deleted
 */
roleRoutes.delete('/:id', authenticateJWT, authorizePermission(['ROLES_DELETE']), validate(roleIdSchema), roleController.deleteRole);

export default roleRoutes;
