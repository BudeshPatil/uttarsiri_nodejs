import blogRepository from '../repositories/blog.repository.js';
import { BLOG_MESSAGES } from '../constants/blog.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { pickBlogCard, sanitizeRelatedIds } from '../utils/relatedItems.util.js';
import logger from '../config/logger.js';

const normalizeBlogPayload = (payload, selfId = null) => ({
  ...payload,
  ...(payload.related_blogs !== undefined
    ? { related_blogs: sanitizeRelatedIds(payload.related_blogs, { selfId }) }
    : {}),
});

const resolveRelatedBlogs = async (blog, publicOnly = false) => {
  const relatedItems = await blogRepository.getBlogsByIds(
    blog.related_blogs,
    { publishedOnly: publicOnly },
  );
  return relatedItems.map(pickBlogCard);
};

export const createBlog = async (payload, userId) => {
  try {
    const normalizedPayload = normalizeBlogPayload(payload);
    const existing = await blogRepository.getBlogBySlug(normalizedPayload.slug);
    if (existing) {
      throw new AppError(BLOG_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const blog = await blogRepository.createBlog(normalizedPayload, userId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'BLOGS', newData: blog });
    return blog;
  } catch (error) {
    logger.error('createBlog service failed', { error: error.message });
    throw error;
  }
};

export const getAllBlogs = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await blogRepository.listBlogs({ status: query.status, limit, skip });

    return {
      blogs: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllBlogs service failed', { error: error.message });
    throw error;
  }
};

export const getBlogById = async (blogId) => {
  try {
    const blog = await blogRepository.getBlogById(blogId);
    if (!blog) {
      throw new AppError(BLOG_MESSAGES.BLOG_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return blog;
  } catch (error) {
    logger.error('getBlogById service failed', { error: error.message, blogId });
    throw error;
  }
};

export const updateBlog = async (blogId, payload, userId) => {
  try {
    const existing = await blogRepository.getBlogById(blogId);
    if (!existing) {
      throw new AppError(BLOG_MESSAGES.BLOG_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (payload.slug && payload.slug.toLowerCase() !== existing.slug) {
      const duplicate = await blogRepository.getBlogBySlug(payload.slug);
      if (duplicate && duplicate.blog_id !== blogId) {
        throw new AppError(BLOG_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const updated = await blogRepository.updateBlog(blogId, {
      ...normalizeBlogPayload(payload, blogId),
      updated_by: userId,
    });

    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'BLOGS', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateBlog service failed', { error: error.message, blogId });
    throw error;
  }
};

export const deleteBlog = async (blogId, userId) => {
  try {
    const existing = await blogRepository.getBlogById(blogId);
    if (!existing) {
      throw new AppError(BLOG_MESSAGES.BLOG_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const deleted = await blogRepository.softDeleteBlog(blogId, userId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'BLOGS', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteBlog service failed', { error: error.message, blogId });
    throw error;
  }
};

export const getPublicBlogs = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 12);
    const result = await blogRepository.listBlogs({ status: 'published', limit, skip });

    return {
      blogs: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getPublicBlogs service failed', { error: error.message });
    throw error;
  }
};

export const getBlogBySlug = async (slug, publicOnly = false) => {
  try {
    const blog = await blogRepository.getBlogBySlug(slug);
    if (!blog || (publicOnly && blog.status !== 'published')) {
      throw new AppError(BLOG_MESSAGES.BLOG_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return blog;
  } catch (error) {
    logger.error('getBlogBySlug service failed', { error: error.message, slug });
    throw error;
  }
};

export const getBlogDetailBySlug = async (slug, publicOnly = false) => {
  try {
    const blog = await getBlogBySlug(slug, publicOnly);
    const related_blogs = await resolveRelatedBlogs(blog, publicOnly);
    return { blog, related_blogs };
  } catch (error) {
    logger.error('getBlogDetailBySlug service failed', { error: error.message, slug });
    throw error;
  }
};

export default {
  createBlog,
  getAllBlogs,
  getPublicBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogDetailBySlug,
  updateBlog,
  deleteBlog,
};
