import userRepository from '../repositories/user.repository.js';
import roleRepository from '../repositories/role.repository.js';
import auditRepository from '../repositories/audit.repository.js';
import serviceRepository from '../repositories/service.repository.js';
import projectRepository from '../repositories/project.repository.js';
import blogRepository from '../repositories/blog.repository.js';
import testimonialRepository from '../repositories/testimonial.repository.js';
import contactRepository from '../repositories/contact.repository.js';
import analyticsService from './analytics.service.js';
import { USER_STATUS } from '../constants/user.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import logger from '../config/logger.js';

export const getDashboardStats = async () => {
  try {
    const notDeleted = { is_deleted: { $ne: true } };

    const [
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      blockedUsers,
      totalRoles,
      loginsToday,
      registrationsToday,
      totalServices,
      totalProjects,
      totalBlogs,
      totalTestimonials,
      totalInquiries,
      newInquiries,
      convertedLeads,
      commerce,
    ] = await Promise.all([
      userRepository.countByStatus(USER_STATUS.PENDING),
      userRepository.countByStatus(USER_STATUS.APPROVED),
      userRepository.countByStatus(USER_STATUS.REJECTED),
      userRepository.countByStatus(USER_STATUS.BLOCKED),
      roleRepository.countRoles(),
      auditRepository.countTodayByAction(AUDIT_ACTIONS.LOGIN),
      auditRepository.countTodayByAction(AUDIT_ACTIONS.REGISTER),
      serviceRepository.countItems(notDeleted),
      projectRepository.countItems(notDeleted),
      blogRepository.countItems(notDeleted),
      testimonialRepository.countItems(notDeleted),
      contactRepository.countItems({}),
      contactRepository.countItems({ lead_status: 'new' }),
      contactRepository.countItems({ lead_status: 'converted' }),
      analyticsService.getOverview({}).catch((error) => {
        logger.warn('commerce overview unavailable for dashboard', { error: error.message });
        return null;
      }),
    ]);

    const totalUsers = pendingUsers + approvedUsers + rejectedUsers + blockedUsers;

    return {
      total_users: totalUsers,
      active_users: approvedUsers,
      pending_users: pendingUsers,
      blocked_users: blockedUsers,
      rejected_users: rejectedUsers,
      total_roles: totalRoles,
      total_logins_today: loginsToday,
      total_registrations_today: registrationsToday,
      total_services: totalServices,
      total_projects: totalProjects,
      total_blogs: totalBlogs,
      total_testimonials: totalTestimonials,
      total_inquiries: totalInquiries,
      new_inquiries: newInquiries,
      converted_leads: convertedLeads,
      // Live commerce KPIs from analytics aggregations (never fabricated).
      total_orders: commerce?.orders?.total_orders || 0,
      pending_orders: commerce?.orders?.pending_orders || 0,
      completed_orders: commerce?.orders?.completed_orders || 0,
      cancelled_orders: commerce?.orders?.cancelled_orders || 0,
      average_order_value: commerce?.orders?.average_order_value || 0,
      total_revenue: commerce?.sales?.total_revenue || 0,
      daily_revenue: commerce?.sales?.daily_revenue || 0,
      weekly_revenue: commerce?.sales?.weekly_revenue || 0,
      monthly_revenue: commerce?.sales?.monthly_revenue || 0,
      total_customers: commerce?.customers?.total_customers || 0,
      total_vendors: commerce?.vendors?.total_vendors || 0,
      low_stock: commerce?.inventory?.low_stock_skus || 0,
      out_of_stock: commerce?.inventory?.out_of_stock_skus || 0,
      sales_trends: commerce?.sales?.trends || [],
    };
  } catch (error) {
    logger.error('getDashboardStats service failed', { error: error.message });
    throw error;
  }
};

export default { getDashboardStats };
