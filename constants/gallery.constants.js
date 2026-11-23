export const GALLERY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

/**
 * Page section a gallery image belongs to. The About page renders its
 * "Gallery — Craft, Detail & Finished Spaces" section from ABOUT.
 */
export const GALLERY_SECTIONS = {
  ABOUT: 'about',
  HOME: 'home',
};

export const GALLERY_MESSAGES = {
  GALLERY_CREATED: 'Gallery image created successfully',
  GALLERY_FETCHED: 'Gallery image fetched successfully',
  GALLERIES_FETCHED: 'Gallery images fetched successfully',
  GALLERY_UPDATED: 'Gallery image updated successfully',
  GALLERY_DELETED: 'Gallery image deleted successfully',
  GALLERY_NOT_FOUND: 'Gallery image not found',
};

export default { GALLERY_STATUS, GALLERY_SECTIONS, GALLERY_MESSAGES };
