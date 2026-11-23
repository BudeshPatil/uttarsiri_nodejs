import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import categoryService from '../services/category.service.js';
import productService from '../services/product.service.js';
import inventoryService from '../services/inventory.service.js';
import translationService from '../services/translation.service.js';
import AppError from '../utils/appError.util.js';

dotenv.config();

const hasDb = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_CONNECT);
const suite = hasDb ? test : test.skip;

const TEST_USER = '00000000-0000-4000-8000-000000000001';
const suffix = Date.now();

suite('commerce foundation integration', async (t) => {
  await connectDB();

  let parentCategory;
  let childCategory;
  let product;
  let variant;

  t.after(async () => {
    await mongoose.connection.close();
  });

  await t.test('creates parent category with multilingual names', async () => {
    parentCategory = await categoryService.createCategory(
      {
        name_en: `Grains Test ${suffix}`,
        name_kn: `ಧಾನ್ಯ ${suffix}`,
        name_hi: `अनाज ${suffix}`,
        description_en: 'Test grains',
        display_order: 1,
        status: 'active',
      },
      TEST_USER,
    );

    assert.ok(parentCategory.category_id);
    assert.equal(parentCategory.name_kn.includes('ಧಾನ್ಯ'), true);
  });

  await t.test('creates subcategory under parent', async () => {
    childCategory = await categoryService.createCategory(
      {
        parent_category_id: parentCategory.category_id,
        name_en: `Jowar Test ${suffix}`,
        name_kn: `ಜೋಳ ${suffix}`,
        name_hi: `ज्वार ${suffix}`,
        status: 'active',
      },
      TEST_USER,
    );

    assert.equal(childCategory.parent_category_id, parentCategory.category_id);
  });

  await t.test('creates product with variants and prices', async () => {
    product = await productService.createProduct(
      {
        sku: `SKU-TEST-${suffix}`,
        name_en: `Organic Jowar ${suffix}`,
        name_kn: `ಸಾವಯವ ಜೋಳ ${suffix}`,
        name_hi: `जैविक ज्वार ${suffix}`,
        description_en: 'North Karnataka jowar',
        category_ids: [parentCategory.category_id, childCategory.category_id],
        brand: 'Uttar Siri',
        origin: 'North Karnataka',
        search_aliases: ['ಜೋಳ', 'sorghum', 'ज्वार'],
        status: 'active',
        is_featured: true,
        variants: [
          {
            sku: `VAR-500G-${suffix}`,
            weight: 500,
            unit: 'g',
            selling_price: 85,
            original_price: 99,
            stock_quantity: 25,
            minimum_order_quantity: 1,
            low_stock_threshold: 5,
          },
          {
            sku: `VAR-1KG-${suffix}`,
            weight: 1,
            unit: 'kg',
            selling_price: 160,
            original_price: 180,
            stock_quantity: 10,
          },
        ],
      },
      TEST_USER,
    );

    assert.equal(product.variants.length, 2);
    assert.equal(product.category_ids.length, 2);
    variant = product.variants[0];
    assert.equal(variant.selling_price, 85);
    assert.equal(variant.stock_quantity, 25);
  });

  await t.test('returns localized product fields with English fallback', async () => {
    const kn = await productService.getProductById(product.product_id, { lang: 'kn' });
    assert.equal(kn.name.includes('ಸಾವಯವ'), true);

    const missing = await productService.getProductById(product.product_id, { lang: 'hi' });
    assert.ok(missing.name);
  });

  await t.test('searches by Kannada and English names', async () => {
    const knSearch = await productService.searchProducts({
      q: 'ಸಾವಯವ',
      lang: 'kn',
    });
    assert.ok(knSearch.products.some((p) => p.product_id === product.product_id));

    const enSearch = await productService.searchProducts({
      q: 'Organic Jowar',
      lang: 'en',
    });
    assert.ok(enSearch.products.some((p) => p.product_id === product.product_id));
  });

  await t.test('updates inventory and writes movement history', async () => {
    const updated = await inventoryService.updateInventory(
      variant.variant_id,
      { adjustment: -5, reason: 'Damaged stock write-off', movement_type: 'adjustment' },
      TEST_USER,
    );

    assert.equal(updated.available_stock, 20);

    const detail = await inventoryService.getInventoryByVariantId(variant.variant_id, {
      page: 1,
      limit: 10,
    });
    assert.ok(detail.movements.length >= 1);
    assert.equal(detail.available_stock, 20);
  });

  await t.test('flags low stock', async () => {
    await inventoryService.updateInventory(
      variant.variant_id,
      { available_stock: 3, reason: 'Force low stock for test' },
      TEST_USER,
    );

    const low = await inventoryService.getLowStock({ page: 1, limit: 50 });
    assert.ok(low.inventory.some((row) => row.variant_id === variant.variant_id));
  });

  await t.test('translations endpoint data includes UI and fallback', async () => {
    const kn = await translationService.getTranslationsByLanguage('kn', {
      include_catalog: 'false',
    });
    assert.equal(kn.language, 'kn');
    assert.ok(kn.ui['nav.home']);
    assert.equal(kn.fallback, 'en');
  });

  await t.test('rejects invalid product create payload via service guards', async () => {
    await assert.rejects(
      () =>
        productService.createProduct(
          {
            sku: `BAD-${suffix}`,
            name_en: 'Bad Product',
            category_ids: ['00000000-0000-4000-8000-000000000099'],
            status: 'active',
          },
          TEST_USER,
        ),
      (error) => error instanceof AppError,
    );
  });
});
