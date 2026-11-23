import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const blogSchema = new mongoose.Schema(
  {
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    status: { type: String, default: 'draft' },
    author: { type: String, default: '' },
    cover_image: { type: String, default: '' },
    related_blogs: { type: [String], default: [] },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'blogs',
  },
);

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ is_deleted: 1 });
blogSchema.index({ created_at: -1 });
blogSchema.index({ updated_at: -1 });

export const buildBlog = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    blog_id: data.blog_id || generateId(),
    title: data.title,
    slug: data.slug?.toLowerCase(),
    excerpt: data.excerpt || '',
    content: data.content || '',
    status: data.status || 'draft',
    author: data.author || '',
    cover_image: data.cover_image || '',
    related_blogs: data.related_blogs || [],
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default Blog;
