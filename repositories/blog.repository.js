import BaseRepository from './base.repository.js';
import Blog from '../models/blog.model.js';
import { buildBlog } from '../models/blog.model.js';
import { normalizeRelatedIds, orderByIds } from '../utils/relatedItems.util.js';
import logger from '../config/logger.js';

class BlogRepository extends BaseRepository {
  constructor() {
    super(Blog);
  }

  async createBlog(data, createdBy = null) {
    try {
      const blog = buildBlog(data, createdBy);
      await this.createItem(blog);
      return blog;
    } catch (error) {
      logger.error('createBlog repository failed', { error: error.message });
      throw error;
    }
  }

  async getBlogById(blogId) {
    try {
      const blog = await this.getItem({ blog_id: blogId });
      if (blog?.is_deleted) return null;
      return blog;
    } catch (error) {
      logger.error(`getBlogById failed for ${blogId}`, { error: error.message });
      throw error;
    }
  }

  async getBlogBySlug(slug) {
    try {
      return await this.getItem({
        slug: slug.toLowerCase(),
        is_deleted: { $ne: true },
      });
    } catch (error) {
      logger.error('getBlogBySlug failed', { error: error.message });
      throw error;
    }
  }

  async updateBlog(blogId, updates) {
    try {
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.slug) {
        normalizedUpdates.slug = normalizedUpdates.slug.toLowerCase();
      }

      return await this.updateItem(
        { blog_id: blogId },
        { ...normalizedUpdates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateBlog failed for ${blogId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteBlog(blogId, updatedBy = null) {
    try {
      return await this.updateItem(
        { blog_id: blogId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteBlog failed for ${blogId}`, { error: error.message });
      throw error;
    }
  }

  async listBlogs({ status, limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = { is_deleted: { $ne: true } };

      if (status) filter.status = status;

      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listBlogs failed', { error: error.message });
      throw error;
    }
  }

  async getBlogsByIds(ids, { publishedOnly = false } = {}) {
    try {
      const normalizedIds = normalizeRelatedIds(ids);
      if (!normalizedIds.length) return [];

      const filter = {
        blog_id: { $in: normalizedIds },
        is_deleted: { $ne: true },
      };
      if (publishedOnly) filter.status = 'published';

      const result = await this.findItems(filter, { limit: normalizedIds.length, skip: 0 });
      return orderByIds(result.items, normalizedIds, 'blog_id');
    } catch (error) {
      logger.error('getBlogsByIds failed', { error: error.message });
      throw error;
    }
  }
}

export default new BlogRepository();
