import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import seoRoutes from './routes/seo.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import blogRoutes from './routes/blog.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import contactRoutes from './routes/contact.routes.js';
import newsletterRoutes from './routes/newsletter.routes.js';
import serviceRoutes from './routes/service.routes.js';
import projectRoutes from './routes/project.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import projectCategoryRoutes from './routes/projectCategory.routes.js';
import faqRoutes from './routes/faq.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import translationRoutes from './routes/translation.routes.js';
import addressRoutes from './routes/address.routes.js';
import cartRoutes from './routes/cart.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import orderRoutes from './routes/order.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

import { swaggerUi, swaggerSpec } from './docs/swagger.js';
import requestLogger from './middlewares/requestLogger.middleware.js';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import logger from './config/logger.js';
import { PUBLIC_DIR, UPLOAD_DIR } from './config/paths.js';

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Browsers reject Access-Control-Allow-Origin: * when credentials: true.
// Prefer an explicit origin (CORS_ORIGIN / FRONTEND_URL) for credentialed requests.
// CORS_ORIGIN may hold a comma-separated list; cors() needs an array, not the raw string.
const corsOrigin =
  process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : process.env.FRONTEND_URL || true;

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Preserve raw body for Razorpay webhook signature verification.
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl?.startsWith('/api/payments/webhook')) {
      req.rawBody = Buffer.from(buf);
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(generalRateLimiter);

// app.use('/api/public', express.static(path.join(__dirname, 'public')));
app.use('/public/uploads', express.static(UPLOAD_DIR));
app.use('/public', express.static(PUBLIC_DIR));

app.get('/api/health', (req, res) => {
  return res.status(200).json({ success: true, message: 'Server is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cms/pages', cmsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/project-categories', projectCategoryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vendors', vendorRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

logger.info('Express application initialized');
logger.info('Express application initialized', { publicDir: PUBLIC_DIR, uploadDir: UPLOAD_DIR });


export default app;
