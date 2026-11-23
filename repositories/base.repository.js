import logger from '../config/logger.js';

export const createConditionalCheckError = (message = 'Conditional check failed') => {
  const error = new Error(message);
  error.name = 'ConditionalCheckFailedException';
  return error;
};

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  toPlain(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  toPlainMany(docs = []) {
    return docs.map((doc) => this.toPlain(doc));
  }

  resolveSkip(lastEvaluatedKey) {
    if (!lastEvaluatedKey) return 0;
    if (typeof lastEvaluatedKey.skip === 'number') return lastEvaluatedKey.skip;
    return 0;
  }

  buildPageResult(items, limit, skip, total = items.length) {
    const hasMore = skip + items.length < total;
    return {
      items,
      lastEvaluatedKey: hasMore ? { skip: skip + limit } : null,
      count: items.length,
      total,
    };
  }

  async createItem(item) {
    try {
      const created = await this.model.create(item);
      return this.toPlain(created);
    } catch (error) {
      if (error.code === 11000) {
        throw createConditionalCheckError(error.message);
      }
      logger.error(`createItem failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async getItem(filter) {
    try {
      const item = await this.model.findOne(filter).lean();
      return this.toPlain(item);
    } catch (error) {
      logger.error(`getItem failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async updateItem(filter, updateData, options = {}) {
    try {
      const { requireExists = true, extraFilter = {} } = options;
      const result = await this.model
        .findOneAndUpdate(
          { ...filter, ...extraFilter },
          { $set: updateData },
          { new: true, runValidators: true },
        )
        .lean();

      if (!result && requireExists) {
        throw createConditionalCheckError('Resource does not exist or condition failed');
      }

      return this.toPlain(result);
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') throw error;
      if (error.code === 11000) {
        throw createConditionalCheckError(error.message);
      }
      logger.error(`updateItem failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async deleteItem(filter, options = {}) {
    try {
      const { requireExists = true } = options;
      const result = await this.model.findOneAndDelete(filter).lean();

      if (!result && requireExists) {
        throw createConditionalCheckError('Resource does not exist');
      }

      return this.toPlain(result);
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') throw error;
      logger.error(`deleteItem failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async findItems(filter = {}, { limit = 50, skip = 0, sort = null } = {}) {
    try {
      let query = this.model.find(filter).skip(skip).limit(limit).lean();
      if (sort) {
        query = query.sort(sort);
      }
      const [docs, total] = await Promise.all([
        query,
        this.model.countDocuments(filter),
      ]);
      const items = this.toPlainMany(docs);
      return this.buildPageResult(items, limit, skip, total);
    } catch (error) {
      logger.error(`findItems failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async countItems(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      logger.error(`countItems failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async batchWrite(putItems = [], deleteKeys = []) {
    try {
      if (putItems.length) {
        await this.model.bulkWrite(
          putItems.map((item) => {
            const filterKeys = Object.keys(item).filter((key) =>
              this.model.schema.path(key)?.options?.unique || key.endsWith('_id') || key === 'setting_key',
            );
            const filterKey = filterKeys[0];
            if (filterKey) {
              return {
                updateOne: {
                  filter: { [filterKey]: item[filterKey] },
                  update: { $set: item },
                  upsert: true,
                },
              };
            }
            return { insertOne: { document: item } };
          }),
          { ordered: false },
        );
      }

      if (deleteKeys.length) {
        await this.model.deleteMany({ $or: deleteKeys });
      }

      return { unprocessedItems: [] };
    } catch (error) {
      logger.error(`batchWrite failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async batchGet(keys) {
    try {
      if (!keys.length) return [];
      const items = await this.model.find({ $or: keys }).lean();
      return this.toPlainMany(items);
    } catch (error) {
      logger.error(`batchGet failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async transactWrite(operations) {
    const session = await this.model.db.startSession();
    try {
      await session.withTransaction(async () => {
        for (const operation of operations) {
          await operation(session);
        }
      });
    } catch (error) {
      logger.error(`transactWrite failed for ${this.model.modelName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default BaseRepository;
