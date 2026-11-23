import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

process.env.RAZORPAY_KEY_ID = 'rzp_test_unit';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_123';
process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test_123';

const {
  verifyPaymentSignature,
  verifyWebhookSignature,
  toPaise,
} = await import('../utils/razorpay.util.js');

test('toPaise rounds INR to integer paise', () => {
  assert.equal(toPaise(199.99), 19999);
  assert.equal(toPaise(40), 4000);
});

test('verifyPaymentSignature accepts a valid HMAC', () => {
  const razorpay_order_id = 'order_ABC';
  const razorpay_payment_id = 'pay_XYZ';
  const razorpay_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  assert.equal(
    verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
    true,
  );
});

test('verifyPaymentSignature rejects tampered signatures', () => {
  assert.equal(
    verifyPaymentSignature({
      razorpay_order_id: 'order_ABC',
      razorpay_payment_id: 'pay_XYZ',
      razorpay_signature: 'deadbeef',
    }),
    false,
  );
});

test('verifyWebhookSignature accepts a valid webhook HMAC', () => {
  const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  assert.equal(verifyWebhookSignature(rawBody, signature), true);
  assert.equal(verifyWebhookSignature(rawBody, 'invalid'), false);
});
