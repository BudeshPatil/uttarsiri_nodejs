import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const newsletterSchema = new mongoose.Schema(
  {
    subscriber_id: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    status: { type: String, default: 'active' },
    created_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'newsletter_subscribers',
  },
);

newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ created_at: -1 });

export const buildSubscriber = (data) => {
  const now = new Date().toISOString();
  return {
    subscriber_id: data.subscriber_id || generateId(),
    email: data.email?.toLowerCase(),
    status: data.status || 'active',
    created_at: data.created_at || now,
  };
};

const NewsletterSubscriber =
  mongoose.models.NewsletterSubscriber || mongoose.model('NewsletterSubscriber', newsletterSchema);

export default NewsletterSubscriber;
