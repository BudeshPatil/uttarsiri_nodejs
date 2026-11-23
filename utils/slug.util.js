/**
 * URL-safe slug from Latin text. Non-Latin characters are stripped so
 * English product/category names drive URLs; localized names stay on the document.
 */
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default { slugify };
