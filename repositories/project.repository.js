import BaseRepository from './base.repository.js';
import Project from '../models/project.model.js';
import { buildProject } from '../models/project.model.js';
import { normalizeRelatedIds, orderByIds } from '../utils/relatedItems.util.js';
import logger from '../config/logger.js';

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  async createProject(data, createdBy = null) {
    try {
      const project = buildProject(data, createdBy);
      await this.createItem(project);
      return project;
    } catch (error) {
      logger.error('createProject repository failed', { error: error.message });
      throw error;
    }
  }

  async getProjectById(projectId) {
    try {
      const project = await this.getItem({ project_id: projectId });
      if (project?.is_deleted) return null;
      return project;
    } catch (error) {
      logger.error(`getProjectById failed for ${projectId}`, { error: error.message });
      throw error;
    }
  }

  async getProjectBySlug(slug) {
    try {
      return await this.getItem({
        slug: slug.toLowerCase(),
        is_deleted: { $ne: true },
      });
    } catch (error) {
      logger.error('getProjectBySlug failed', { error: error.message });
      throw error;
    }
  }

  async updateProject(projectId, updates) {
    try {
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.slug) {
        normalizedUpdates.slug = normalizedUpdates.slug.toLowerCase();
      }
      return await this.updateItem(
        { project_id: projectId },
        { ...normalizedUpdates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateProject failed for ${projectId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteProject(projectId, updatedBy = null) {
    try {
      return await this.updateItem(
        { project_id: projectId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteProject failed for ${projectId}`, { error: error.message });
      throw error;
    }
  }

  async listProjects({ status, category, location, featured, search, limit = 50, skip = 0 }) {
    try {
      const filter = { is_deleted: { $ne: true } };
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (location) filter.location = { $regex: location, $options: 'i' };
      if (featured === 'true' || featured === true) filter.is_featured = true;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { short_description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ];
      }
      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listProjects failed', { error: error.message });
      throw error;
    }
  }

  async getProjectsByIds(ids, { publishedOnly = false } = {}) {
    try {
      const normalizedIds = normalizeRelatedIds(ids);
      if (!normalizedIds.length) return [];

      const filter = {
        project_id: { $in: normalizedIds },
        is_deleted: { $ne: true },
      };
      if (publishedOnly) filter.status = 'published';

      const result = await this.findItems(filter, { limit: normalizedIds.length, skip: 0 });
      return orderByIds(result.items, normalizedIds, 'project_id');
    } catch (error) {
      logger.error('getProjectsByIds failed', { error: error.message });
      throw error;
    }
  }
}

export default new ProjectRepository();
