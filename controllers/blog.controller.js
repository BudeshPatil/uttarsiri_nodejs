import blogService from '../services/blog.service.js';
import { successResponse } from '../utils/response.util.js';
import { BLOG_MESSAGES } from '../constants/blog.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createBlog = async (req, res, next) => {
  try {
    const blog = await blogService.createBlog(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, BLOG_MESSAGES.BLOG_CREATED, blog);
  } catch (error) {
    logger.error('createBlog controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getAllBlogs(req.query);
    return successResponse(res, HTTP_STATUS.OK, BLOG_MESSAGES.BLOGS_FETCHED, result);
  } catch (error) {
    logger.error('getAllBlogs controller failed', { error: error.message });
    return next(error);
  }
};

export const getBlogById = async (req, res, next) => {
  try {
    const blog = await blogService.getBlogById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, BLOG_MESSAGES.BLOG_FETCHED, blog);
  } catch (error) {
    logger.error('getBlogById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const blog = await blogService.updateBlog(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, BLOG_MESSAGES.BLOG_UPDATED, blog);
  } catch (error) {
    logger.error('updateBlog controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await blogService.deleteBlog(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, BLOG_MESSAGES.BLOG_DELETED, blog);
  } catch (error) {
    logger.error('deleteBlog controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getPublicBlogs(req.query);
    return successResponse(res, HTTP_STATUS.OK, BLOG_MESSAGES.BLOGS_FETCHED, result);
  } catch (error) {
    logger.error('getPublicBlogs controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicBlogBySlug = async (req, res, next) => {
  try {
    const result = await blogService.getBlogDetailBySlug(req.params.slug, true);
    return successResponse(res, HTTP_STATUS.OK, BLOG_MESSAGES.BLOG_FETCHED, result);
  } catch (error) {
    logger.error('getPublicBlogBySlug controller failed', { error: error.message });
    return next(error);
  }
};

export default { createBlog, getAllBlogs, getPublicBlogs, getBlogById, getPublicBlogBySlug, updateBlog, deleteBlog };
