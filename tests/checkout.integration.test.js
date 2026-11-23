import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import roleRepository from '../repositories/role.repository.js';
import userRepository from '../repositories/user.repository.js';
import productService from '../services/product.service.js';
import categoryService from '../services/category.service.js';
import inventoryService from '../services/inventory.service.js';
import cartService from '../services/cart.service.js';
import addressService from '../services/address.service.js';
import couponService from '../services/coupon.service.js';
import orderService from '../services/order.service.js';
import { hashPassword } from '../utils/password.util.js';
import AppError from '../utils/appError.util.js';

dotenv.config();

const hasDb = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_CONNECT);
const suite = hasDb ? test : test.skip;
const suffix = Date.now();

suite('checkout and cart integration', async (t) => {
  await connectDB();

  let customer;
  let variant;
  let address;
  let coupon;

  t.after(async () => {
    await mongoose.connection.close();
  });

  await t.test('prepares customer, product stock and coupon', async () => {
    let role = await roleRepository.getRoleByCode('CUSTOMER');
    if (!role) {
      role = await roleRepository.createRole({
        role_name: 'Customer',
        role_code: 'CUSTOMER',
        description: 'Storefront customer',
        permissions: [],
        is_active: true,
      });
    }

    const email = `customer-${suffix}@uttarsiri.test`;
    customer = await userRepository.createUser({
      name: 'Test Customer',
      email,
      phone: `9${String(suffix).slice(-9)}`,
      password: await hashPassword('Password@123'),
      role_id: role.role_id,
      status: 'approved',
      preferred_language: 'en',
    });

    const category = await categoryService.createCategory(
      {
        name_en: `Checkout Cat ${suffix}`,
        status: 'active',
      },
      customer.user_id,
    );

    const product = await productService.createProduct(
      {
        sku: `CHK-${suffix}`,
        name_en: `Checkout Jowar ${suffix}`,
        name_kn: `ಪರೀಕ್ಷೆ ${suffix}`,
        name_hi: `परीक्षण ${suffix}`,
        category_ids: [category.category_id],
        status: 'active',
        variants: [
          {
            sku: `CHK-VAR-${suffix}`,
            weight: 1,
            unit: 'kg',
            selling_price: 200,
            original_price: 220,
            stock_quantity: 5,
          },
        ],
      },
      customer.user_id,
    );

    variant = product.variants[0];
    await inventoryService.updateInventory(
      variant.variant_id,
      { available_stock: 5, reserved_stock: 0 },
      customer.user_id,
    );

    address = await addressService.createAddress(customer.user_id, {
      full_name: 'Test Customer',
      phone: customer.phone,
      house_number: '12',
      street: 'Main Road',
      area: 'Hubballi',
      city: 'Hubballi',
      state: 'Karnataka',
      pincode: '580001',
      is_default: true,
    });

    coupon = await couponService.createCoupon(
      {
        code: `SAVE10-${suffix}`,
        discount_type: 'percentage',
        discount_value: 10,
        minimum_order_amount: 100,
        usage_limit: 10,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'active',
      },
      customer.user_id,
    );

    assert.ok(variant.variant_id);
    assert.ok(address.address_id);
    assert.ok(coupon.coupon_id);
  });

  await t.test('adds items, applies coupon and quotes totals on backend', async () => {
    await cartService.addItem(customer.user_id, { variant_id: variant.variant_id, quantity: 2 });
    const withCoupon = await cartService.applyCoupon(customer.user_id, coupon.code);
    assert.equal(withCoupon.subtotal, 400);
    assert.equal(withCoupon.discount, 40);

    const quote = await orderService.getCheckoutQuote(customer.user_id, {
      address_id: address.address_id,
      delivery_option: 'standard',
      language: 'kn',
    });
    assert.equal(quote.subtotal, 400);
    assert.equal(quote.discount, 40);
    assert.ok(quote.total > 0);
    assert.ok(quote.payment_methods.includes('cod'));
  });

  await t.test('rejects insufficient stock', async () => {
    await assert.rejects(
      () => cartService.updateItem(customer.user_id, variant.variant_id, 50),
      (error) => error instanceof AppError,
    );
  });

  await t.test('creates order with snapshots and idempotency', async () => {
    const key = `idem-${suffix}`;
    const order = await orderService.createOrder(customer.user_id, {
      address_id: address.address_id,
      payment_method: 'cod',
      delivery_option: 'standard',
      language: 'hi',
      idempotency_key: key,
    });

    assert.ok(order.order_number.startsWith('US-'));
    assert.equal(order.customer_id, customer.user_id);
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].unit_price, 200);
    assert.equal(order.address_snapshot.pincode, '580001');
    assert.equal(order.payment_status, 'pending');
    assert.equal(order.customer_language, 'hi');

    const duplicate = await orderService.createOrder(customer.user_id, {
      address_id: address.address_id,
      payment_method: 'cod',
      idempotency_key: key,
    });
    assert.equal(duplicate.order_id, order.order_id);

    const history = await orderService.listCustomerOrders(customer.user_id);
    assert.ok(history.orders.some((item) => item.order_id === order.order_id));
  });

  await t.test('rejects invalid coupon', async () => {
    await cartService.addItem(customer.user_id, { variant_id: variant.variant_id, quantity: 1 });
    await assert.rejects(
      () => cartService.applyCoupon(customer.user_id, 'DOES-NOT-EXIST'),
      (error) => error instanceof AppError,
    );
  });
});
