import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    setting_key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'settings',
  },
);

settingsSchema.index({ updated_at: -1 });

export const buildSetting = (settingKey, value) => {
  const now = new Date().toISOString();
  return {
    setting_key: settingKey,
    value,
    updated_at: now,
  };
};

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingsSchema);

export default Setting;
