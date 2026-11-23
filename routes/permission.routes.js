import express from 'express';
import permissionController from '../controllers/permission.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';
import {
  validate,
  createPermissionSchema,
  updatePermissionSchema,
  permissionIdSchema,
} from '../validators/permission.validator.js';

const permissionRoutes = express.Router();

permissionRoutes.post('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(createPermissionSchema), permissionController.createPermission);
permissionRoutes.get('/', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), permissionController.getAllPermissions);
permissionRoutes.get('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(permissionIdSchema), permissionController.getPermissionById);
permissionRoutes.put('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(updatePermissionSchema), permissionController.updatePermission);
permissionRoutes.delete('/:id', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), validate(permissionIdSchema), permissionController.deletePermission);

export default permissionRoutes;
