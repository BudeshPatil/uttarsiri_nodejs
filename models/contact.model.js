import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const noteSchema = new mongoose.Schema(
  {
    note_id: { type: String, default: () => generateId() },
    content: { type: String, default: '' },
    created_by: { type: String, default: '' },
    created_by_name: { type: String, default: '' },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false },
);

const contactSchema = new mongoose.Schema(
  {
    contact_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    message: { type: String, default: '' },
    service_interest: { type: String, default: '' },
    source: { type: String, default: 'website' },
    lead_status: {
      type: String,
      default: 'new',
      enum: ['new', 'contacted', 'follow_up', 'quotation_sent', 'converted', 'closed'],
    },
    status: { type: String, default: 'new' },
    assigned_to: { type: String, default: '' },
    assigned_to_name: { type: String, default: '' },
    follow_up_date: { type: String, default: '' },
    notes: { type: [noteSchema], default: [] },
    created_at: { type: String },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'contacts',
  },
);

contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ lead_status: 1 });
contactSchema.index({ assigned_to: 1 });
contactSchema.index({ source: 1 });
contactSchema.index({ created_at: -1 });
contactSchema.index({ updated_at: -1 });

export const buildContact = (data) => {
  const now = new Date().toISOString();
  return {
    contact_id: data.contact_id || generateId(),
    name: data.name,
    email: data.email?.toLowerCase(),
    phone: data.phone || '',
    message: data.message || '',
    service_interest: data.service_interest || '',
    source: data.source || 'website',
    lead_status: data.lead_status || 'new',
    status: data.status || 'new',
    assigned_to: data.assigned_to || '',
    assigned_to_name: data.assigned_to_name || '',
    follow_up_date: data.follow_up_date || '',
    notes: data.notes || [],
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact;
