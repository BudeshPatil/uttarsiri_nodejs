/**
 * North Karnataka sample catalogue used by `npm run seed`.
 * Idempotent: products keyed by SKU; existing rows are skipped.
 */

export const ROOT_CATEGORIES = [
  {
    name_en: 'Grains & Millets',
    name_kn: 'ಧಾನ್ಯ ಮತ್ತು ಸಿರಿಧಾನ್ಯ',
    name_hi: 'अनाज और मिलेट्स',
    category_slug: 'grains-millets',
    display_order: 1,
  },
  {
    name_en: 'Pulses & Dals',
    name_kn: 'ದಾಳಿಗಳು',
    name_hi: 'दालें',
    category_slug: 'pulses-dals',
    display_order: 2,
  },
  {
    name_en: 'Traditional North Karnataka Products',
    name_kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಉತ್ತರ ಕರ್ನಾಟಕ ಉತ್ಪನ್ನಗಳು',
    name_hi: 'पारंपरिक उत्तर कर्नाटक उत्पाद',
    category_slug: 'traditional-north-karnataka-products',
    display_order: 3,
  },
  {
    name_en: 'Flour & Rava',
    name_kn: 'ಹಿಟ್ಟು ಮತ್ತು ರವೆ',
    name_hi: 'आटा और रवा',
    category_slug: 'flour-rava',
    display_order: 4,
  },
  {
    name_en: 'Oil Seeds',
    name_kn: 'ಎಣ್ಣೆ ಬೀಜಗಳು',
    name_hi: 'तेल के बीज',
    category_slug: 'oil-seeds',
    display_order: 5,
  },
  {
    name_en: 'Spices',
    name_kn: 'ಮಸಾಲೆಗಳು',
    name_hi: 'मसाले',
    category_slug: 'spices',
    display_order: 6,
  },
  {
    name_en: 'Traditional Foods',
    name_kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಆಹಾರ',
    name_hi: 'पारंपरिक खाद्य पदार्थ',
    category_slug: 'traditional-foods',
    display_order: 7,
  },
  {
    name_en: 'Regional Sweets',
    name_kn: 'ಪ್ರಾದೇಶಿಕ ಸಿಹಿ ತಿಂಡಿಗಳು',
    name_hi: 'क्षेत्रीय मिठाइयाँ',
    category_slug: 'regional-sweets',
    display_order: 8,
  },
  {
    name_en: 'Chutney Powders',
    name_kn: 'ಚಟ್ನಿ ಪುಡಿಗಳು',
    name_hi: 'चटनी पाउडर',
    category_slug: 'chutney-powders',
    display_order: 9,
  },
];

/** Legacy slugs from earlier seeds — still seeded as aliases so old links work. */
export const LEGACY_CATEGORY_ALIASES = [
  {
    name_en: 'Traditional Grains & Cereals',
    name_kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಧಾನ್ಯಗಳು',
    name_hi: 'पारंपरिक अनाज',
    category_slug: 'traditional-grains-cereals',
    display_order: 10,
  },
  {
    name_en: 'North Karnataka Specials',
    name_kn: 'ಉತ್ತರ ಕರ್ನಾಟಕ ವಿಶೇಷ',
    name_hi: 'उत्तर कर्नाटक विशेष',
    category_slug: 'north-karnataka-specials',
    display_order: 11,
  },
];

/**
 * Each product: category_slug + catalogue fields + variants[].
 * Prices in INR. stock_quantity seeds inventory on create.
 */
export const SAMPLE_PRODUCTS = [
  // —— Grains & Millets ——
  {
    category_slug: 'grains-millets',
    sku: 'US-JOWAR-001',
    name_en: 'Organic Jowar (Sorghum)',
    name_kn: 'ಸಾವಯವ ಜೋಳ',
    name_hi: 'जैविक ज्वार',
    description_en: 'Stone-cleaned North Karnataka jowar — ideal for roti and porridge.',
    description_kn: 'ಉತ್ತರ ಕರ್ನಾಟಕದ ಸ್ವಚ್ಛ ಜೋಳ — ರೊಟ್ಟಿ ಮತ್ತು ಗಂಜಿಗೆ ಸೂಕ್ತ.',
    description_hi: 'उत्तर कर्नाटक का साफ़ ज्वार — रोटी और दलिया के लिए उत्तम।',
    brand: 'Uttar Siri',
    origin: 'North Karnataka',
    search_aliases: ['sorghum', 'ಜೋಳ', 'ज्वार', 'jola'],
    is_best_seller: true,
    is_featured: true,
    variants: [
      { sku: 'US-JOWAR-001-500G', weight: 500, unit: 'g', selling_price: 65, original_price: 75, stock_quantity: 120 },
      { sku: 'US-JOWAR-001-1KG', weight: 1, unit: 'kg', selling_price: 120, original_price: 140, stock_quantity: 80 },
    ],
  },
  {
    category_slug: 'grains-millets',
    sku: 'US-BAJRA-001',
    name_en: 'Bajra (Pearl Millet)',
    name_kn: 'ಸಜ್ಜೆ',
    name_hi: 'बाजरा',
    description_en: 'Wholesome pearl millet for winter rotis and porridge.',
    description_kn: 'ಚಳಿಗಾಲದ ರೊಟ್ಟಿ ಮತ್ತು ಗಂಜಿಗೆ ಸಜ್ಜೆ.',
    description_hi: 'सर्दियों की रोटी और दलिया के लिए बाजरा।',
    brand: 'Uttar Siri',
    origin: 'North Karnataka',
    search_aliases: ['pearl millet', 'ಸಜ್ಜೆ', 'बाजरा'],
    is_best_seller: true,
    variants: [
      { sku: 'US-BAJRA-001-1KG', weight: 1, unit: 'kg', selling_price: 95, original_price: 110, stock_quantity: 90 },
    ],
  },
  {
    category_slug: 'grains-millets',
    sku: 'US-RAGI-001',
    name_en: 'Ragi (Finger Millet)',
    name_kn: 'ರಾಗಿ',
    name_hi: 'रागी',
    description_en: 'Calcium-rich ragi for mudde and malt.',
    description_kn: 'ಮುದ್ದೆ ಮತ್ತು ಮಾಲ್ಟ್‌ಗೆ ರಾಗಿ.',
    description_hi: 'मुद्दे और माल्ट के लिए रागी।',
    brand: 'Uttar Siri',
    origin: 'Karnataka',
    search_aliases: ['finger millet', 'ನಾಚಣಿ', 'नाचणी'],
    is_featured: true,
    variants: [
      { sku: 'US-RAGI-001-500G', weight: 500, unit: 'g', selling_price: 55, original_price: 65, stock_quantity: 100 },
      { sku: 'US-RAGI-001-1KG', weight: 1, unit: 'kg', selling_price: 99, original_price: 115, stock_quantity: 70 },
    ],
  },

  // —— Pulses & Dals ——
  {
    category_slug: 'pulses-dals',
    sku: 'US-TOOR-001',
    name_en: 'Toor Dal (Arhar)',
    name_kn: 'ತೊಗರಿ ಬೇಳೆ',
    name_hi: 'तूर दाल',
    description_en: 'Unpolished toor dal for sambar and everyday dals.',
    description_kn: 'ಸಾಂಬಾರ್ ಮತ್ತು ದಿನನಿತ್ಯದ ದಾಳಿಗೆ ತೊಗರಿ ಬೇಳೆ.',
    description_hi: 'सांबार और रोज़ की दाल के लिए तूर दाल।',
    brand: 'Uttar Siri',
    origin: 'Karnataka',
    search_aliases: ['arhar', 'ತೊಗರಿ', 'अरहर'],
    is_best_seller: true,
    variants: [
      { sku: 'US-TOOR-001-500G', weight: 500, unit: 'g', selling_price: 85, original_price: 95, stock_quantity: 150 },
      { sku: 'US-TOOR-001-1KG', weight: 1, unit: 'kg', selling_price: 160, original_price: 180, stock_quantity: 100 },
    ],
  },
  {
    category_slug: 'pulses-dals',
    sku: 'US-MOONG-001',
    name_en: 'Moong Dal',
    name_kn: 'ಹೆಸರು ಬೇಳೆ',
    name_hi: 'मूंग दाल',
    description_en: 'Split yellow moong — light and easy to cook.',
    description_kn: 'ಸೀಗು ಹೆಸರು ಬೇಳೆ — ಸುಲಭವಾಗಿ ಬೇಯುವುದು.',
    description_hi: 'पीली मूंग दाल — हल्की और जल्दी पकने वाली।',
    brand: 'Uttar Siri',
    search_aliases: ['green gram', 'ಹೆಸರು', 'मूंग'],
    variants: [
      { sku: 'US-MOONG-001-500G', weight: 500, unit: 'g', selling_price: 78, original_price: 88, stock_quantity: 110 },
    ],
  },
  {
    category_slug: 'pulses-dals',
    sku: 'US-CHANA-001',
    name_en: 'Chana Dal',
    name_kn: 'ಕಡಲೆ ಬೇಳೆ',
    name_hi: 'चना दाल',
    description_en: 'Premium chana dal for kosambari and curries.',
    brand: 'Uttar Siri',
    search_aliases: ['bengal gram', 'ಕಡಲೆ', 'चना'],
    variants: [
      { sku: 'US-CHANA-001-1KG', weight: 1, unit: 'kg', selling_price: 130, original_price: 145, stock_quantity: 85 },
    ],
  },

  // —— Traditional North Karnataka ——
  {
    category_slug: 'traditional-north-karnataka-products',
    sku: 'US-JOLADROTTI-MIX',
    name_en: 'Jolada Rotti Mix',
    name_kn: 'ಜೋಳದ ರೊಟ್ಟಿ ಮಿಶ್ರಣ',
    name_hi: 'जोलदा रोटी मिक्स',
    description_en: 'Ready mix for soft North Karnataka jolada rotti.',
    description_kn: 'ಮೆತ್ತನೆಯ ಜೋಳದ ರೊಟ್ಟಿಗೆ ಸಿದ್ಧ ಮಿಶ್ರಣ.',
    description_hi: 'नरम जोलदा रोटी के लिए रेडी मिक्स।',
    brand: 'Uttar Siri',
    origin: 'Kalaburagi',
    search_aliases: ['jolada rotti', 'ಜೋಳದ ರೊಟ್ಟಿ'],
    is_featured: true,
    variants: [
      { sku: 'US-JOLADROTTI-MIX-500G', weight: 500, unit: 'g', selling_price: 90, original_price: 100, stock_quantity: 60 },
    ],
  },
  {
    category_slug: 'traditional-north-karnataka-products',
    sku: 'US-HURDA-001',
    name_en: 'Organic Hurda (Tender Jowar)',
    name_kn: 'ಹುರಡ',
    name_hi: 'हुरदा',
    description_en: 'Seasonal tender jowar — roast and enjoy.',
    brand: 'Uttar Siri',
    origin: 'North Karnataka',
    search_aliases: ['hurda', 'ಹುರಡ', 'हुरदा'],
    variants: [
      { sku: 'US-HURDA-001-250G', weight: 250, unit: 'g', selling_price: 140, original_price: 160, stock_quantity: 40 },
    ],
  },

  // —— Flour & Rava ——
  {
    category_slug: 'flour-rava',
    sku: 'US-JOWAR-FLOUR',
    name_en: 'Jowar Flour',
    name_kn: 'ಜೋಳದ ಹಿಟ್ಟು',
    name_hi: 'ज्वार आटा',
    description_en: 'Freshly milled jowar flour for rotis.',
    brand: 'Uttar Siri',
    search_aliases: ['sorghum flour', 'ಜೋಳದ ಹಿಟ್ಟು'],
    is_best_seller: true,
    variants: [
      { sku: 'US-JOWAR-FLOUR-500G', weight: 500, unit: 'g', selling_price: 70, original_price: 80, stock_quantity: 100 },
      { sku: 'US-JOWAR-FLOUR-1KG', weight: 1, unit: 'kg', selling_price: 130, original_price: 150, stock_quantity: 75 },
    ],
  },
  {
    category_slug: 'flour-rava',
    sku: 'US-RAGI-FLOUR',
    name_en: 'Ragi Flour',
    name_kn: 'ರಾಗಿ ಹಿಟ್ಟು',
    name_hi: 'रागी आटा',
    description_en: 'Fine ragi flour for mudde and dosa.',
    brand: 'Uttar Siri',
    search_aliases: ['finger millet flour', 'ರಾಗಿ ಹಿಟ್ಟು'],
    is_featured: true,
    variants: [
      { sku: 'US-RAGI-FLOUR-1KG', weight: 1, unit: 'kg', selling_price: 110, original_price: 125, stock_quantity: 90 },
    ],
  },
  {
    category_slug: 'flour-rava',
    sku: 'US-RAVA-001',
    name_en: 'Bansi Rava',
    name_kn: 'ಬನಸಿ ರವೆ',
    name_hi: 'बन्सी रवा',
    description_en: 'Coarse rava for upma and sweets.',
    brand: 'Uttar Siri',
    search_aliases: ['sooji', 'ರವೆ', 'सूजी'],
    variants: [
      { sku: 'US-RAVA-001-500G', weight: 500, unit: 'g', selling_price: 48, original_price: 55, stock_quantity: 130 },
    ],
  },

  // —— Oil Seeds ——
  {
    category_slug: 'oil-seeds',
    sku: 'US-GROUNDNUT-001',
    name_en: 'Groundnuts (Peanuts)',
    name_kn: 'ಕಡಲೆಕಾಯಿ',
    name_hi: 'मूंगफली',
    description_en: 'Bold groundnuts from North Karnataka farms.',
    brand: 'Uttar Siri',
    origin: 'North Karnataka',
    search_aliases: ['peanut', 'ಕಡಲೆಕಾಯಿ', 'मूंगफली'],
    is_best_seller: true,
    variants: [
      { sku: 'US-GROUNDNUT-001-500G', weight: 500, unit: 'g', selling_price: 95, original_price: 110, stock_quantity: 100 },
      { sku: 'US-GROUNDNUT-001-1KG', weight: 1, unit: 'kg', selling_price: 180, original_price: 200, stock_quantity: 60 },
    ],
  },
  {
    category_slug: 'oil-seeds',
    sku: 'US-SESAME-001',
    name_en: 'White Sesame Seeds',
    name_kn: 'ಎಳ್ಳು',
    name_hi: 'सफेद तिल',
    description_en: 'Clean white sesame for sweets and tempering.',
    brand: 'Uttar Siri',
    search_aliases: ['til', 'ಎಳ್ಳು', 'तिल'],
    variants: [
      { sku: 'US-SESAME-001-250G', weight: 250, unit: 'g', selling_price: 75, original_price: 85, stock_quantity: 70 },
    ],
  },

  // —— Spices ——
  {
    category_slug: 'spices',
    sku: 'US-BYADGI-001',
    name_en: 'Byadgi Chilli',
    name_kn: 'ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ',
    name_hi: 'ब्याडगी मिर्च',
    description_en: 'Famous deep-red Byadgi chillies — rich colour, mild heat.',
    description_kn: 'ಪ್ರಸಿದ್ಧ ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ — ಬಣ್ಣ ಹೆಚ್ಚು, ಖಾರ ಕಡಿಮೆ.',
    description_hi: 'प्रसिद्ध ब्याडगी मिर्च — रंग गहरा, तीखापन हल्का।',
    brand: 'Uttar Siri',
    origin: 'Byadgi, Karnataka',
    search_aliases: ['byadagi', 'ಬ್ಯಾಡಗಿ', 'ब्याडगी'],
    is_featured: true,
    is_best_seller: true,
    variants: [
      { sku: 'US-BYADGI-001-100G', weight: 100, unit: 'g', selling_price: 55, original_price: 65, stock_quantity: 80 },
      { sku: 'US-BYADGI-001-250G', weight: 250, unit: 'g', selling_price: 125, original_price: 145, stock_quantity: 50 },
    ],
  },
  {
    category_slug: 'spices',
    sku: 'US-TURMERIC-001',
    name_en: 'Turmeric Powder',
    name_kn: 'ಅರಿಶಿನ ಪುಡಿ',
    name_hi: 'हल्दी पाउडर',
    description_en: 'Pure turmeric powder, no fillers.',
    brand: 'Uttar Siri',
    search_aliases: ['haldi', 'ಅರಿಶಿನ', 'हल्दी'],
    variants: [
      { sku: 'US-TURMERIC-001-100G', weight: 100, unit: 'g', selling_price: 35, original_price: 40, stock_quantity: 150 },
      { sku: 'US-TURMERIC-001-200G', weight: 200, unit: 'g', selling_price: 65, original_price: 75, stock_quantity: 90 },
    ],
  },

  // —— Traditional Foods ——
  {
    category_slug: 'traditional-foods',
    sku: 'US-HURIGALU-001',
    name_en: 'Hurigalu (Roasted Gram Mix)',
    name_kn: 'ಹುರಿಗಾಳು',
    name_hi: 'भुने चने का मिक्स',
    description_en: 'Crunchy roasted gram snack mix.',
    brand: 'Uttar Siri',
    search_aliases: ['hurigalu', 'ಹುರಿಗಾಳು'],
    is_featured: true,
    variants: [
      { sku: 'US-HURIGALU-001-200G', weight: 200, unit: 'g', selling_price: 85, original_price: 95, stock_quantity: 55 },
    ],
  },
  {
    category_slug: 'traditional-foods',
    sku: 'US-SANDBIGE-001',
    name_en: 'Sandige (Sun-dried Fryums)',
    name_kn: 'ಸಂಡಿಗೆ',
    name_hi: 'संडिगे',
    description_en: 'Homestyle sandige — fry and serve with meals.',
    brand: 'Uttar Siri',
    origin: 'North Karnataka',
    search_aliases: ['sandige', 'ಸಂಡಿಗೆ', 'वड़ी'],
    variants: [
      { sku: 'US-SANDBIGE-001-200G', weight: 200, unit: 'g', selling_price: 110, original_price: 125, stock_quantity: 45 },
    ],
  },

  // —— Regional Sweets ——
  {
    category_slug: 'regional-sweets',
    sku: 'US-DHARWAD-PEDA',
    name_en: 'Dharwad Peda',
    name_kn: 'ಧಾರವಾಡ ಪೇಡ',
    name_hi: 'धारवाड़ पेड़ा',
    description_en: 'Classic Dharwad peda — soft, caramelised milk sweet.',
    description_kn: 'ಧಾರವಾಡದ ಪ್ರಸಿದ್ಧ ಪೇಡ.',
    description_hi: 'प्रसिद्ध धारवाड़ पेड़ा।',
    brand: 'Uttar Siri',
    origin: 'Dharwad',
    search_aliases: ['peda', 'ಪೇಡ', 'पेड़ा'],
    is_best_seller: true,
    is_featured: true,
    variants: [
      { sku: 'US-DHARWAD-PEDA-250G', weight: 250, unit: 'g', selling_price: 220, original_price: 250, stock_quantity: 40 },
      { sku: 'US-DHARWAD-PEDA-500G', weight: 500, unit: 'g', selling_price: 420, original_price: 480, stock_quantity: 25 },
    ],
  },
  {
    category_slug: 'regional-sweets',
    sku: 'US-GIRMIT-001',
    name_en: 'Belgaum Girmit Masala Mix',
    name_kn: 'ಬೆಳಗಾವಿ ಗಿರ್ಮಿಟ್ ಮಸಾಲಾ',
    name_hi: 'बेल्गावी गिरमिट मसाला',
    description_en: 'Spice mix for Belgaum-style girmit chaat.',
    brand: 'Uttar Siri',
    origin: 'Belagavi',
    search_aliases: ['girmit', 'ಗಿರ್ಮಿಟ್'],
    variants: [
      { sku: 'US-GIRMIT-001-100G', weight: 100, unit: 'g', selling_price: 60, original_price: 70, stock_quantity: 50 },
    ],
  },

  // —— Chutney Powders ——
  {
    category_slug: 'chutney-powders',
    sku: 'US-AGASI-CHUTNEY',
    name_en: 'Agasi Chutney Powder (Flax)',
    name_kn: 'ಅಗಸೆ ಚಟ್ನಿ ಪುಡಿ',
    name_hi: 'अलसी चटनी पाउडर',
    description_en: 'Nutty flaxseed chutney powder — classic with jolada rotti.',
    description_kn: 'ಜೋಳದ ರೊಟ್ಟಿಯೊಂದಿಗೆ ಅಗಸೆ ಚಟ್ನಿ ಪುಡಿ.',
    description_hi: 'जोलदा रोटी के साथ अलसी चटनी पाउडर।',
    brand: 'Uttar Siri',
    search_aliases: ['flax chutney', 'ಅಗಸೆ', 'अलसी'],
    is_best_seller: true,
    is_featured: true,
    variants: [
      { sku: 'US-AGASI-CHUTNEY-100G', weight: 100, unit: 'g', selling_price: 70, original_price: 80, stock_quantity: 90 },
      { sku: 'US-AGASI-CHUTNEY-250G', weight: 250, unit: 'g', selling_price: 160, original_price: 180, stock_quantity: 55 },
    ],
  },
  {
    category_slug: 'chutney-powders',
    sku: 'US-SHENGA-CHUTNEY',
    name_en: 'Shenga Chutney Powder (Groundnut)',
    name_kn: 'ಶೇಂಗಾ ಚಟ್ನಿ ಪುಡಿ',
    name_hi: 'मूंगफली चटनी पाउडर',
    description_en: 'Roasted groundnut chutney powder with Byadgi chilli.',
    brand: 'Uttar Siri',
    search_aliases: ['groundnut chutney', 'ಶೇಂಗಾ', 'शेंगा'],
    is_featured: true,
    variants: [
      { sku: 'US-SHENGA-CHUTNEY-100G', weight: 100, unit: 'g', selling_price: 65, original_price: 75, stock_quantity: 85 },
    ],
  },
  {
    category_slug: 'chutney-powders',
    sku: 'US-NIGER-CHUTNEY',
    name_en: 'Niger Seed Chutney Powder',
    name_kn: 'ಗುರೆಳ್ಳು ಚಟ್ನಿ ಪುಡಿ',
    name_hi: 'रामतिल चटनी पाउडर',
    description_en: 'Earthy niger (gurellu) seed chutney powder.',
    brand: 'Uttar Siri',
    search_aliases: ['gurellu', 'ಗುರೆಳ್ಳು', 'रामतिल'],
    variants: [
      { sku: 'US-NIGER-CHUTNEY-100G', weight: 100, unit: 'g', selling_price: 72, original_price: 82, stock_quantity: 8 },
    ],
  },
];

export const SAMPLE_COUPONS = [
  {
    code: 'WELCOME50',
    description: '₹50 off on orders above ₹499',
    discount_type: 'fixed',
    discount_value: 50,
    minimum_order_amount: 499,
    usage_limit: 1000,
    per_user_limit: 1,
    status: 'active',
  },
  {
    code: 'MILLET10',
    description: '10% off (max ₹100) on orders above ₹299',
    discount_type: 'percentage',
    discount_value: 10,
    minimum_order_amount: 299,
    max_discount_amount: 100,
    usage_limit: 500,
    per_user_limit: 3,
    status: 'active',
  },
];
