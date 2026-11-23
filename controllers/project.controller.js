import projectService from '../services/project.service.js';
import { successResponse } from '../utils/response.util.js';
import { PROJECT_MESSAGES } from '../constants/project.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, PROJECT_MESSAGES.PROJECT_CREATED, project);
  } catch (error) {
    logger.error('createProject controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllProjects = async (req, res, next) => {
  try {
    const result = await projectService.getAllProjects(req.query);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECTS_FETCHED, result);
  } catch (error) {
    logger.error('getAllProjects controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicProjects = async (req, res, next) => {
  try {
    const result = await projectService.getPublicProjects(req.query);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECTS_FETCHED, result);
  } catch (error) {
    logger.error('getPublicProjects controller failed', { error: error.message });
    return next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECT_FETCHED, project);
  } catch (error) {
    logger.error('getProjectById controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicProjectBySlug = async (req, res, next) => {
  try {
    const result = await projectService.getProjectDetailBySlug(req.params.slug, true);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECT_FETCHED, result);
  } catch (error) {
    logger.error('getPublicProjectBySlug controller failed', { error: error.message });
    return next(error);
  }
};

export const getProjectBySlug = async (req, res, next) => {
  try {
    const result = await projectService.getProjectDetailBySlug(req.params.slug, false);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECT_FETCHED, result);
  } catch (error) {
    logger.error('getProjectBySlug controller failed', { error: error.message });
    return next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECT_UPDATED, project);
  } catch (error) {
    logger.error('updateProject controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await projectService.deleteProject(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_MESSAGES.PROJECT_DELETED, project);
  } catch (error) {
    logger.error('deleteProject controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createProject,
  getAllProjects,
  getPublicProjects,
  getProjectById,
  getProjectBySlug,
  getPublicProjectBySlug,
  updateProject,
  deleteProject,
};
