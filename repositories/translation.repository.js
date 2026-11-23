import BaseRepository from './base.repository.js';
import Translation, { buildTranslation } from '../models/translation.model.js';

class TranslationRepository extends BaseRepository {
  constructor() {
    super(Translation);
  }

  async upsertTranslation(data) {
    const item = buildTranslation(data);
    await this.model.findOneAndUpdate(
      { language: item.language, namespace: item.namespace, key: item.key },
      { $set: item },
      { upsert: true, new: true },
    );
    return item;
  }

  async listByLanguage(language, { namespace } = {}) {
    const filter = { language };
    if (namespace) filter.namespace = namespace;

    const result = await this.findItems(filter, {
      limit: 1000,
      skip: 0,
      sort: { namespace: 1, key: 1 },
    });
    return result.items;
  }
}

export default new TranslationRepository();
