export function normalizeRelatedIds(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    return [...new Set(value.filter(Boolean).map(String))];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeRelatedIds(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export function sanitizeRelatedIds(ids, { selfId = null, maxItems = 6 } = {}) {
  const normalized = normalizeRelatedIds(ids);
  const filtered = selfId
    ? normalized.filter((id) => String(id) !== String(selfId))
    : normalized;
  return filtered.slice(0, maxItems);
}

export function pickProjectCard(project) {
  return {
    project_id: project.project_id,
    title: project.title,
    slug: project.slug,
    category: project.category || '',
    location: project.location || '',
    budget: project.budget || '',
    project_status: project.project_status || 'completed',
    completion_date: project.completion_date || '',
    short_description: project.short_description || '',
    cover_image: project.cover_image || '',
  };
}

export function pickBlogCard(blog) {
  return {
    blog_id: blog.blog_id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt || '',
    author: blog.author || '',
    cover_image: blog.cover_image || '',
    status: blog.status || 'draft',
  };
}

export function orderByIds(items, ids, idKey) {
  const lookup = new Map(items.map((item) => [String(item[idKey]), item]));
  return ids
    .map((id) => lookup.get(String(id)))
    .filter(Boolean);
}
