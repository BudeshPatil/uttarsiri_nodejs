import BaseRepository from './base.repository.js';
import Setting from '../models/settings.model.js';
import { buildSetting } from '../models/settings.model.js';
import logger from '../config/logger.js';

class SettingsRepository extends BaseRepository {
  constructor() {
    super(Setting);
  }

  async upsertSetting(settingKey, value) {
    try {
      const setting = buildSetting(settingKey, value);
      await this.model.findOneAndUpdate(
        { setting_key: settingKey },
        { $set: setting },
        { upsert: true, new: true },
      );
      return setting;
    } catch (error) {
      logger.error(`upsertSetting failed for ${settingKey}`, { error: error.message });
      throw error;
    }
  }

  async getSetting(settingKey) {
    try {
      return await this.getItem({ setting_key: settingKey });
    } catch (error) {
      logger.error(`getSetting failed for ${settingKey}`, { error: error.message });
      throw error;
    }
  }

  async updateSetting(settingKey, value) {
    try {
      return await this.updateItem(
        { setting_key: settingKey },
        { value, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateSetting failed for ${settingKey}`, { error: error.message });
      throw error;
    }
  }

  async getAllSettings() {
    try {
      const items = await this.model.find({}).lean();
      const settings = {};
      items.forEach((item) => {
        settings[item.setting_key] = item.value;
      });
      return settings;
    } catch (error) {
      logger.error('getAllSettings failed', { error: error.message });
      throw error;
    }
  }

  async batchUpsertSettings(settingsMap) {
    try {
      const items = Object.entries(settingsMap).map(([key, value]) => buildSetting(key, value));
      await this.batchWrite(items);
      return settingsMap;
    } catch (error) {
      logger.error('batchUpsertSettings failed', { error: error.message });
      throw error;
    }
  }
}

export default new SettingsRepository();
