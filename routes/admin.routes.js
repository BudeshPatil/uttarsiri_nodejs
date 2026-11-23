import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware.js';

const adminRoutes = express.Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched
 */
// adminRoutes.get('/dashboard', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), adminController.getDashboard);
adminRoutes.get('/dashboard', authenticateJWT, adminController.getDashboard);
/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema: { type: string }
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Audit logs fetched
 */
adminRoutes.get('/audit-logs', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), adminController.getAuditLogsHandler);

/**
 * @swagger
 * /api/admin/system-settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings fetched
 */
adminRoutes.get('/system-settings', authenticateJWT, authorizeRole(['SUPER_ADMIN', 'ADMIN']), adminController.getSystemSettings);

export default adminRoutes;
