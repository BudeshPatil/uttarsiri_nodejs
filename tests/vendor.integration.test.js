import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import vendorService from '../services/vendor.service.js';
import categoryService from '../services/category.service.js';
import AppError from '../utils/appError.util.js';

dotenv.config();

const hasDb = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_CONNECT);
const suite = hasDb ? test : test.skip;
const suffix = Date.now();

suite('vendor portal integration', async (t) => {
  await connectDB();

  let vendorA;
  let vendorB;
  let productA;
  let category;

  t.after(async () => {
    await mongoose.connection.close();
  });

  await t.test('registers two vendors pending approval', async () => {
    const a = await vendorService.registerVendor({
      business_name: `Vendor A ${suffix}`,
      owner_name: 'Owner A',
      mobile: `81${String(suffix).slice(-8)}`,
      email: `vendora-${suffix}@uttarsiri.test`,
      password: 'Password@123',
      address: {
        line1: 'Shop 1',
        city: 'Hubballi',
        state: 'Karnataka',
        pincode: '580001',
      },
      gstin: '29AAAAA0000A1Z5',
      preferred_language: 'kn',
    });
    vendorA = a.vendor;
    assert.equal(vendorA.status, 'pending');

    const b = await vendorService.registerVendor({
      business_name: `Vendor B ${suffix}`,
      owner_name: 'Owner B',
      mobile: `82${String(suffix).slice(-8)}`,
      email: `vendorb-${suffix}@uttarsiri.test`,
      password: 'Password@123',
      address: {
        line1: 'Shop 2',
        city: 'Belagavi',
        state: 'Karnataka',
        pincode: '590001',
      },
    });
    vendorB = b.vendor;
    assert.ok(vendorB.vendor_id);
  });

  await t.test('approves vendor A before business actions', async () => {
    assert.equal(vendorA.status, 'pending');
    vendorA = await vendorService.approveVendor(vendorA.vendor_id, 'admin-test');
    assert.equal(vendorA.status, 'approved');

    category = await categoryService.createCategory(
      { name_en: `Vendor Cat ${suffix}`, status: 'active' },
      vendorA.user_id,
    );
  });

  await t.test('vendor A creates product, submits for approval, updates stock', async () => {
    productA = await vendorService.createVendorProduct(
      vendorA,
      {
        sku: `VND-A-${suffix}`,
        name_en: `Vendor Millet ${suffix}`,
        name_kn: `ಮಾರಾಟಗಾರ ${suffix}`,
        name_hi: `विक्रेता ${suffix}`,
        category_ids: [category.category_id],
        variants: [
          {
            sku: `VND-A-VAR-${suffix}`,
            weight: 1,
            unit: 'kg',
            selling_price: 150,
            original_price: 160,
            stock_quantity: 20,
          },
        ],
      },
      vendorA.user_id,
    );

    assert.equal(productA.vendor_id, vendorA.vendor_id);
    assert.equal(productA.status, 'draft');

    const submitted = await vendorService.submitProductForApproval(
      vendorA,
      productA.product_id,
      vendorA.user_id,
    );
    assert.equal(submitted.status, 'pending_approval');

    const variantId = productA.variants[0].variant_id;
    const inventory = await vendorService.updateVendorInventory(
      vendorA,
      variantId,
      { available_stock: 18, reason: 'Manual count' },
      vendorA.user_id,
    );
    assert.equal(inventory.available_stock, 18);

    const dashboard = await vendorService.getDashboard(vendorA);
    assert.ok(dashboard.total_products >= 1);
    assert.ok(dashboard.pending_approval >= 1);
  });

  await t.test('vendor B cannot access vendor A product or inventory', async () => {
    vendorB = await vendorService.approveVendor(vendorB.vendor_id, 'admin-test');
    await assert.rejects(
      () =>
        vendorService.updateVendorProduct(
          vendorB,
          productA.product_id,
          { name_en: 'Hijack' },
          vendorB.user_id,
        ),
      (error) => error instanceof AppError && error.statusCode === 403,
    );

    await assert.rejects(
      () =>
        vendorService.updateVendorInventory(
          vendorB,
          productA.variants[0].variant_id,
          { available_stock: 1 },
          vendorB.user_id,
        ),
      (error) => error instanceof AppError && error.statusCode === 403,
    );
  });
});
