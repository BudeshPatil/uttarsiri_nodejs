import BaseRepository from './base.repository.js';
import Product, { buildProduct } from '../models/product.model.js';
import { PRODUCT_STATUS } from '../constants/product.constants.js';

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async createProduct(data, createdBy = null) {
    const product = buildProduct(data, createdBy);
    await this.createItem(product);
    return product;
  }

  async getProductById(productId) {
    const product = await this.getItem({ product_id: productId });
    if (product?.is_deleted) return null;
    return product;
  }

  async getProductBySlug(slug) {
    return this.getItem({ product_slug: slug, is_deleted: { $ne: true } });
  }

  async getProductBySku(sku) {
    return this.getItem({ sku: String(sku).trim().toUpperCase(), is_deleted: { $ne: true } });
  }

  async updateProduct(productId, updates) {
    return this.updateItem(
      { product_id: productId },
      { ...updates, updated_at: new Date().toISOString() },
    );
  }

  async softDeleteProduct(productId, updatedBy = null) {
    return this.updateItem(
      { product_id: productId },
      { is_deleted: true, updated_at: new Date().toISOString(), updated_by: updatedBy },
    );
  }

  buildListFilter({ status, category_id, featured, best_seller, search, brand, vendor_id } = {}) {
    const filter = { is_deleted: { $ne: true } };

    if (status) filter.status = status;
    if (category_id) filter.category_ids = category_id;
    if (featured === 'true' || featured === true) filter.is_featured = true;
    if (best_seller === 'true' || best_seller === true) filter.is_best_seller = true;
    if (vendor_id) filter.vendor_id = vendor_id;
    if (brand) filter.brand = new RegExp(String(brand).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    if (search) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const term = new RegExp(escaped, 'i');
      filter.$or = [
        { name_en: term },
        { name_kn: term },
        { name_hi: term },
        { description_en: term },
        { description_kn: term },
        { description_hi: term },
        { search_aliases: term },
        { sku: term },
        { brand: term },
        { product_slug: term },
      ];
    }

    return filter;
  }

  async listProducts(query = {}) {
    const { limit = 20, skip = 0 } = query;
    const filter = this.buildListFilter(query);
    return this.findItems(filter, {
      limit,
      skip,
      sort: { created_at: -1 },
    });
  }

  async searchProducts({ search, language, status = PRODUCT_STATUS.ACTIVE, limit = 20, skip = 0 } = {}) {
    const filter = this.buildListFilter({ search, status });
    return this.findItems(filter, {
      limit,
      skip,
      sort: { is_best_seller: -1, is_featured: -1, created_at: -1 },
    });
  }

  async listActiveProducts({ limit = 50, skip = 0, category_id, featured, best_seller, search } = {}) {
    return this.listProducts({
      status: PRODUCT_STATUS.ACTIVE,
      category_id,
      featured,
      best_seller,
      search,
      limit,
      skip,
    });
  }
}

export default new ProductRepository();
