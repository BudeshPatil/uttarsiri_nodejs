import express from 'express';
import translationController from '../controllers/translation.controller.js';
import { validate, translationLanguageSchema } from '../validators/translation.validator.js';

const translationRoutes = express.Router();

/**
 * @swagger
 * tags:
 *   name: Translations
 *   description: UI and catalogue translations (en / kn / hi)
 */

/**
 * @swagger
 * /api/translations/{language}:
 *   get:
 *     tags: [Translations]
 *     summary: Get translations for a language with English fallback
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema: { type: string, enum: [en, kn, hi] }
 *       - in: query
 *         name: include_catalog
 *         schema: { type: string, enum: ['true', 'false'] }
 *     responses:
 *       200:
 *         description: Translation bundle
 */
translationRoutes.get(
  '/:language',
  validate(translationLanguageSchema),
  translationController.getTranslationsByLanguage,
);

export default translationRoutes;
