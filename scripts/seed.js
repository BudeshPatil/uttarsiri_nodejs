import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import logger from '../config/logger.js';
import permissionRepository from '../repositories/permission.repository.js';
import roleRepository from '../repositories/role.repository.js';
import userRepository from '../repositories/user.repository.js';
import categoryRepository from '../repositories/category.repository.js';
import productRepository from '../repositories/product.repository.js';
import couponRepository from '../repositories/coupon.repository.js';
import vendorRepository from '../repositories/vendor.repository.js';
import productService from '../services/product.service.js';
import { seedDefaultTranslations } from '../services/translation.service.js';
import { hashPassword } from '../utils/password.util.js';
import { CATEGORY_PERMISSIONS } from '../constants/category.constants.js';
import { PRODUCT_PERMISSIONS } from '../constants/product.constants.js';
import { INVENTORY_PERMISSIONS } from '../constants/inventory.constants.js';
import { PRODUCT_STATUS } from '../constants/product.constants.js';
import { VENDOR_STATUS } from '../constants/vendor.constants.js';
import {
  ROOT_CATEGORIES,
  LEGACY_CATEGORY_ALIASES,
  SAMPLE_PRODUCTS,
  SAMPLE_COUPONS,
} from './seed-sample-catalog.js';

dotenv.config();

const COMMERCE_PERMISSIONS = [
  { code: CATEGORY_PERMISSIONS.CREATE, name: 'Create Categories', module: 'CATEGORIES' },
  { code: CATEGORY_PERMISSIONS.READ, name: 'Read Categories', module: 'CATEGORIES' },
  { code: CATEGORY_PERMISSIONS.UPDATE, name: 'Update Categories', module: 'CATEGORIES' },
  { code: CATEGORY_PERMISSIONS.DELETE, name: 'Delete Categories', module: 'CATEGORIES' },
  { code: PRODUCT_PERMISSIONS.CREATE, name: 'Create Products', module: 'PRODUCTS' },
  { code: PRODUCT_PERMISSIONS.READ, name: 'Read Products', module: 'PRODUCTS' },
  { code: PRODUCT_PERMISSIONS.UPDATE, name: 'Update Products', module: 'PRODUCTS' },
  { code: PRODUCT_PERMISSIONS.DELETE, name: 'Delete Products', module: 'PRODUCTS' },
  { code: INVENTORY_PERMISSIONS.READ, name: 'Read Inventory', module: 'INVENTORY' },
  { code: INVENTORY_PERMISSIONS.UPDATE, name: 'Update Inventory', module: 'INVENTORY' },
];

const ensureRole = async (role_code, role_name, description, permissions) => {
  let role = await roleRepository.getRoleByCode(role_code);
  if (!role) {
    role = await roleRepository.createRole({
      role_name,
      role_code,
      description,
      permissions,
      is_active: true,
    });
    logger.info(`${role_code} role created`);
  }
  return role;
};

const ensureUser = async ({ email, name, phone, password, role_id, preferred_language = 'en' }) => {
  let user = await userRepository.getUserByEmail(email);
  if (user) {
    logger.info('User already exists', { email });
    return user;
  }
  user = await userRepository.createUser({
    name,
    email,
    phone,
    password: await hashPassword(password),
    role_id,
    status: 'approved',
    preferred_language,
  });
  logger.info('User created', { email });
  return user;
};

const seedCategories = async (adminUserId) => {
  logger.info('Seeding North Karnataka categories…');
  const slugToId = new Map();
  for (const category of [...ROOT_CATEGORIES, ...LEGACY_CATEGORY_ALIASES]) {
    let existing = await categoryRepository.getCategoryBySlug(category.category_slug);
    if (!existing) {
      existing = await categoryRepository.createCategory(
        { ...category, status: 'active' },
        adminUserId,
      );
      logger.info('Category created', { slug: category.category_slug });
    } else {
      await categoryRepository.updateCategory(existing.category_id, {
        name_en: category.name_en,
        name_kn: category.name_kn,
        name_hi: category.name_hi,
        display_order: category.display_order,
        status: 'active',
      });
    }
    const fresh = await categoryRepository.getCategoryBySlug(category.category_slug);
    if (fresh) slugToId.set(fresh.category_slug, fresh.category_id);
  }
  return slugToId;
};

const seedProducts = async (adminUserId, slugToId) => {
  logger.info('Seeding sample products with variants & stock…');
  let created = 0;
  let skipped = 0;

  for (const item of SAMPLE_PRODUCTS) {
    const existing = await productRepository.getProductBySku(item.sku);
    if (existing) {
      skipped += 1;
      continue;
    }

    const categoryId = slugToId.get(item.category_slug);
    if (!categoryId) {
      logger.warn('Skipping product — category missing', { sku: item.sku, category_slug: item.category_slug });
      continue;
    }

    // Also attach legacy twin categories when present (homepage slug heuristics).
    const categoryIds = [categoryId];
    if (item.category_slug === 'grains-millets' && slugToId.get('traditional-grains-cereals')) {
      categoryIds.push(slugToId.get('traditional-grains-cereals'));
    }
    if (
      item.category_slug === 'traditional-north-karnataka-products' &&
      slugToId.get('north-karnataka-specials')
    ) {
      categoryIds.push(slugToId.get('north-karnataka-specials'));
    }

    await productService.createProduct(
      {
        sku: item.sku,
        name_en: item.name_en,
        name_kn: item.name_kn || '',
        name_hi: item.name_hi || '',
        description_en: item.description_en || '',
        description_kn: item.description_kn || '',
        description_hi: item.description_hi || '',
        category_ids: categoryIds,
        brand: item.brand || 'Uttar Siri',
        origin: item.origin || 'North Karnataka',
        search_aliases: item.search_aliases || [],
        status: PRODUCT_STATUS.ACTIVE,
        is_featured: Boolean(item.is_featured),
        is_best_seller: Boolean(item.is_best_seller),
        variants: (item.variants || []).map((v) => ({
          sku: v.sku,
          weight: v.weight,
          unit: v.unit,
          selling_price: v.selling_price,
          original_price: v.original_price ?? v.selling_price,
          stock_quantity: v.stock_quantity ?? 0,
          minimum_order_quantity: 1,
          status: 'active',
          low_stock_threshold: v.stock_quantity != null && v.stock_quantity <= 10 ? 10 : 5,
        })),
      },
      adminUserId,
    );
    created += 1;
    logger.info('Product created', { sku: item.sku });
  }

  logger.info('Products seed summary', { created, skipped, total: SAMPLE_PRODUCTS.length });
};

const seedCoupons = async (adminUserId) => {
  logger.info('Seeding sample coupons…');
  const yearFromNow = new Date();
  yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

  for (const coupon of SAMPLE_COUPONS) {
    const existing = await couponRepository.getByCode(coupon.code);
    if (existing) {
      logger.info('Coupon already exists', { code: coupon.code });
      continue;
    }
    await couponRepository.createCoupon(
      {
        ...coupon,
        starts_at: new Date().toISOString(),
        expires_at: yearFromNow.toISOString(),
      },
      adminUserId,
    );
    logger.info('Coupon created', { code: coupon.code });
  }
};

const seedDemoVendor = async (adminUserId, vendorRoleId) => {
  const email = process.env.SEED_VENDOR_EMAIL || 'vendor@uttarsiri.com';
  const password = process.env.SEED_VENDOR_PASSWORD || 'Vendor@12345';

  const user = await ensureUser({
    email,
    name: 'Demo Vendor Owner',
    phone: process.env.SEED_VENDOR_PHONE || '9888888888',
    password,
    role_id: vendorRoleId,
  });

  let vendor = await vendorRepository.getByUserId(user.user_id);

  if (!vendor) {
    vendor = await vendorRepository.createVendor({
      user_id: user.user_id,
      business_name: 'North Karnataka Farm Co-op',
      owner_name: 'Demo Vendor Owner',
      mobile: user.phone,
      email: user.email,
      address: {
        line1: 'APMC Yard',
        city: 'Hubballi',
        state: 'Karnataka',
        pincode: '580020',
      },
      gstin: '29ABCDE1234F1Z5',
      status: VENDOR_STATUS.APPROVED,
      preferred_language: 'en',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    });
    logger.info('Demo vendor created & approved', { email });
  } else if (vendor.status !== VENDOR_STATUS.APPROVED) {
    await vendorRepository.updateVendor(vendor.vendor_id, {
      status: VENDOR_STATUS.APPROVED,
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    });
    logger.info('Demo vendor approved', { email });
  } else {
    logger.info('Demo vendor already exists', { email });
  }

  return vendor;
};

const run = async () => {
  await connectDB();

  logger.info('Seeding commerce permissions…');
  const permissionCodes = [];
  for (const perm of COMMERCE_PERMISSIONS) {
    const existing = await permissionRepository.getPermissionByCode(perm.code);
    if (!existing) {
      await permissionRepository.createPermission(perm);
    }
    permissionCodes.push(perm.code);
  }

  logger.info('Ensuring roles…');
  let adminRole = await roleRepository.getRoleByCode('SUPER_ADMIN');
  if (!adminRole) {
    adminRole = await roleRepository.createRole({
      role_name: 'Super Admin',
      role_code: 'SUPER_ADMIN',
      description: 'Full platform access',
      permissions: permissionCodes,
      is_active: true,
    });
  } else {
    const merged = [...new Set([...(adminRole.permissions || []), ...permissionCodes])];
    adminRole = await roleRepository.updateRole(adminRole.role_id, { permissions: merged });
  }

  await ensureRole(
    'CONTENT_MANAGER',
    'Content Manager',
    'Catalogue and content management',
    permissionCodes.filter((code) => !code.endsWith('_DELETE')),
  );
  const customerRole = await ensureRole('CUSTOMER', 'Customer', 'Storefront customer account', []);
  const vendorRole = await ensureRole('VENDOR', 'Vendor', 'Grocery supplier portal access', []);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@uttarsiri.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@12345';
  const adminUser = await ensureUser({
    email: adminEmail,
    name: 'Uttar Siri Admin',
    phone: process.env.SEED_ADMIN_PHONE || '9999999999',
    password: adminPassword,
    role_id: adminRole.role_id,
  });

  const customerEmail = process.env.SEED_CUSTOMER_EMAIL || 'customer@uttarsiri.com';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'Customer@12345';
  await ensureUser({
    email: customerEmail,
    name: 'Demo Customer',
    phone: process.env.SEED_CUSTOMER_PHONE || '9777777777',
    password: customerPassword,
    role_id: customerRole.role_id,
    preferred_language: 'en',
  });

  const slugToId = await seedCategories(adminUser.user_id);
  await seedProducts(adminUser.user_id, slugToId);
  await seedCoupons(adminUser.user_id);
  await seedDemoVendor(adminUser.user_id, vendorRole.role_id);

  logger.info('Seeding default UI translations…');
  await seedDefaultTranslations();

  logger.info('Seed completed successfully', {
    admin: adminEmail,
    customer: customerEmail,
    vendor: process.env.SEED_VENDOR_EMAIL || 'vendor@uttarsiri.com',
    coupons: SAMPLE_COUPONS.map((c) => c.code),
    products: SAMPLE_PRODUCTS.length,
  });
  process.exit(0);
};

run().catch((error) => {
  logger.error('Seed failed', { message: error.message, stack: error.stack });
  process.exit(1);
});
