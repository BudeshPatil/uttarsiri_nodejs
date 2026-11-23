import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localizeField,
  withLocalizedFields,
  normalizeLanguage,
  DEFAULT_LANGUAGE,
} from '../utils/i18n.util.js';
import { slugify } from '../utils/slug.util.js';

test('normalizeLanguage falls back to English', () => {
  assert.equal(normalizeLanguage('kn'), 'kn');
  assert.equal(normalizeLanguage('hi-IN'), 'hi');
  assert.equal(normalizeLanguage('fr'), DEFAULT_LANGUAGE);
});

test('localizeField falls back to English when Kannada missing', () => {
  const product = {
    name_en: 'Jowar Flour',
    name_kn: '',
    name_hi: 'ज्वार आटा',
  };

  assert.equal(localizeField(product, 'name', 'kn'), 'Jowar Flour');
  assert.equal(localizeField(product, 'name', 'hi'), 'ज्वार आटा');
  assert.equal(localizeField(product, 'name', 'en'), 'Jowar Flour');
});

test('withLocalizedFields adds convenience name/description', () => {
  const localized = withLocalizedFields(
    {
      name_en: 'Chutney Powder',
      name_kn: 'ಚಟ್ನಿ ಪುಡಿ',
      description_en: 'Spicy',
      description_kn: '',
    },
    ['name', 'description'],
    'kn',
  );

  assert.equal(localized.name, 'ಚಟ್ನಿ ಪುಡಿ');
  assert.equal(localized.description, 'Spicy');
  assert.equal(localized.locale, 'kn');
});

test('slugify produces url-safe English slugs', () => {
  assert.equal(slugify('North Karnataka Specials'), 'north-karnataka-specials');
  assert.equal(slugify('  Flour & Rava '), 'flour-rava');
});
