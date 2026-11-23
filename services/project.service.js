import projectRepository from '../repositories/project.repository.js';
import { PROJECT_MESSAGES } from '../constants/project.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { pickProjectCard, sanitizeRelatedIds } from '../utils/relatedItems.util.js';
import logger from '../config/logger.js';

const normalizeProjectPayload = (payload, selfId = null) => ({
  ...payload,
  ...(payload.related_projects !== undefined
    ? { related_projects: sanitizeRelatedIds(payload.related_projects, { selfId }) }
    : {}),
});

const resolveRelatedProjects = async (project, publicOnly = false) => {
  const relatedItems = await projectRepository.getProjectsByIds(
    project.related_projects,
    { publishedOnly: publicOnly },
  );
  return relatedItems.map(pickProjectCard);
};

export const createProject = async (payload, userId) => {
  try {
    const normalizedPayload = normalizeProjectPayload(payload);
    const existing = await projectRepository.getProjectBySlug(normalizedPayload.slug);
    if (existing) {
      throw new AppError(PROJECT_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    const project = await projectRepository.createProject(normalizedPayload, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'PROJECTS', newData: project });
    return project;
  } catch (error) {
    logger.error('createProject service failed', { error: error.message });
    throw error;
  }
};

export const getAllProjects = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await projectRepository.listProjects({ ...query, limit, skip });
    return {
      projects: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getAllProjects service failed', { error: error.message });
    throw error;
  }
};

export const getPublicProjects = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 12);
    const result = await projectRepository.listProjects({
      ...query,
      status: 'published',
      limit,
      skip,
    });
    return {
      projects: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getPublicProjects service failed', { error: error.message });
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw new AppError(PROJECT_MESSAGES.PROJECT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return project;
  } catch (error) {
    logger.error('getProjectById service failed', { error: error.message, projectId });
    throw error;
  }
};

export const getProjectBySlug = async (slug, publicOnly = false) => {
  try {
    const project = await projectRepository.getProjectBySlug(slug);
    if (!project || (publicOnly && project.status !== 'published')) {
      throw new AppError(PROJECT_MESSAGES.PROJECT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return project;
  } catch (error) {
    logger.error('getProjectBySlug service failed', { error: error.message, slug });
    throw error;
  }
};

export const getProjectDetailBySlug = async (slug, publicOnly = false) => {
  try {
    const project = await getProjectBySlug(slug, publicOnly);
    const related_projects = await resolveRelatedProjects(project, publicOnly);
    return { project, related_projects };
  } catch (error) {
    logger.error('getProjectDetailBySlug service failed', { error: error.message, slug });
    throw error;
  }
};

export const updateProject = async (projectId, payload, userId) => {
  try {
    const existing = await projectRepository.getProjectById(projectId);
    if (!existing) {
      throw new AppError(PROJECT_MESSAGES.PROJECT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (payload.slug && payload.slug.toLowerCase() !== existing.slug) {
      const duplicate = await projectRepository.getProjectBySlug(payload.slug);
      if (duplicate && duplicate.project_id !== projectId) {
        throw new AppError(PROJECT_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }
    const updated = await projectRepository.updateProject(projectId, {
      ...normalizeProjectPayload(payload, projectId),
      updated_by: userId,
    });
    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'PROJECTS', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateProject service failed', { error: error.message, projectId });
    throw error;
  }
};

export const deleteProject = async (projectId, userId) => {
  try {
    const existing = await projectRepository.getProjectById(projectId);
    if (!existing) {
      throw new AppError(PROJECT_MESSAGES.PROJECT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const deleted = await projectRepository.softDeleteProject(projectId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'PROJECTS', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteProject service failed', { error: error.message, projectId });
    throw error;
  }
};

export default {
  createProject,
  getAllProjects,
  getPublicProjects,
  getProjectById,
  getProjectBySlug,
  getProjectDetailBySlug,
  updateProject,
  deleteProject,
};
