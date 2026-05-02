export const bookTypes = [
  { id: 'paper', labelKey: 'paper' },
  { id: 'pdf', labelKey: 'pdf' },
  { id: 'epub', labelKey: 'epub' },
  { id: 'audio', labelKey: 'audio' },
  { id: 'external', labelKey: 'externalLink' }
];

export const readingStatuses = [
  { id: 'want_to_read', labelKey: 'wantToRead' },
  { id: 'not_started', labelKey: 'notStarted' },
  { id: 'reading', labelKey: 'reading' },
  { id: 'completed', labelKey: 'completed' },
  { id: 'paused', labelKey: 'paused' },
  { id: 'deferred', labelKey: 'deferred' }
];

export const categories = [
  {
    id: 1,
    name_ar: 'المكتبة العامة',
    name_en: 'General Library',
    sort_order: 1,
    subcategories: [
      ['غير مصنّف', 'Uncategorized'],
      ['مراجع عامة', 'General References'],
      ['موسوعات', 'Encyclopedias'],
      ['كتب متنوعة', 'Miscellaneous Books']
    ]
  },
  {
    id: 2,
    name_ar: 'اللغة وعلومها',
    name_en: 'Language Studies',
    sort_order: 2,
    subcategories: [
      ['النحو', 'Grammar'],
      ['الصرف', 'Morphology'],
      ['البلاغة', 'Rhetoric'],
      ['المعاجم', 'Dictionaries'],
      ['فقه اللغة', 'Philology'],
      ['اللسانيات', 'Linguistics']
    ]
  },
  {
    id: 3,
    name_ar: 'الشريعة',
    name_en: 'Islamic Studies',
    sort_order: 3,
    subcategories: [
      ['القرآن وعلومه', 'Quranic Studies'],
      ['الحديث وعلومه', 'Hadith Studies'],
      ['الفقه', 'Islamic Jurisprudence'],
      ['العقيدة', 'Creed'],
      ['السيرة النبوية', 'Prophetic Biography'],
      ['الفكر الإسلامي', 'Islamic Thought']
    ]
  },
  {
    id: 4,
    name_ar: 'الفلسفة',
    name_en: 'Philosophy',
    sort_order: 4,
    subcategories: [
      ['الفلسفة القديمة', 'Ancient Philosophy'],
      ['الفلسفة الحديثة', 'Modern Philosophy'],
      ['الفلسفة الإسلامية', 'Islamic Philosophy'],
      ['المنطق', 'Logic'],
      ['الأخلاق', 'Ethics']
    ]
  },
  {
    id: 5,
    name_ar: 'الأدب',
    name_en: 'Literature',
    sort_order: 5,
    subcategories: [
      ['شعر قديم', 'Classical Poetry'],
      ['شعر معاصر', 'Modern Poetry'],
      ['الروايات', 'Novels'],
      ['القصص القصيرة', 'Short Stories'],
      ['المقالات', 'Essays'],
      ['أدب الرحلات', 'Travel Literature'],
      ['السيرة الذاتية الأدبية', 'Literary Autobiography']
    ]
  },
  {
    id: 6,
    name_ar: 'السير والتراجم',
    name_en: 'Biographies',
    sort_order: 6,
    subcategories: [
      ['سير ذاتية', 'Autobiographies'],
      ['تراجم أعلام', 'Biographical Dictionaries'],
      ['شخصيات تاريخية', 'Historical Figures'],
      ['مذكرات', 'Memoirs']
    ]
  },
  {
    id: 7,
    name_ar: 'التاريخ',
    name_en: 'History',
    sort_order: 7,
    subcategories: [
      ['تاريخ إسلامي', 'Islamic History'],
      ['تاريخ عربي', 'Arab History'],
      ['تاريخ عالمي', 'World History'],
      ['حضارات', 'Civilizations'],
      ['تاريخ سياسي', 'Political History'],
      ['تاريخ اقتصادي', 'Economic History']
    ]
  },
  {
    id: 8,
    name_ar: 'الجغرافيا',
    name_en: 'Geography',
    sort_order: 8,
    subcategories: [
      ['جغرافيا طبيعية', 'Physical Geography'],
      ['جغرافيا بشرية', 'Human Geography'],
      ['أطالس وخرائط', 'Atlases and Maps'],
      ['استكشافات', 'Explorations']
    ]
  },
  {
    id: 9,
    name_ar: 'الكتب المترجمة',
    name_en: 'Translated Books',
    sort_order: 9,
    subcategories: [
      ['أدب مترجم', 'Translated Literature'],
      ['فكر مترجم', 'Translated Thought'],
      ['فلسفة مترجمة', 'Translated Philosophy'],
      ['تاريخ مترجم', 'Translated History']
    ]
  },
  {
    id: 10,
    name_ar: 'English',
    name_en: 'English',
    sort_order: 10,
    subcategories: [
      ['Fiction', 'Fiction'],
      ['Non-fiction', 'Non-fiction'],
      ['History', 'History'],
      ['Philosophy', 'Philosophy'],
      ['Self-development', 'Self-development']
    ]
  }
].map((category) => ({
  ...category,
  subcategories: category.subcategories.map(([name_ar, name_en], index) => ({
    id: category.id * 100 + index + 1,
    category_id: category.id,
    name_ar,
    name_en,
    sort_order: index + 1
  }))
}));

const tagGroups = [
  ['وسوم عامة', 'General', [
    ['مهم', 'Important'],
    ['مفضل', 'Favorite'],
    ['يعاد قراءته', 'To Reread'],
    ['مرجع', 'Reference'],
    ['موسوعي', 'Encyclopedic'],
    ['مختصر', 'Concise'],
    ['مطول', 'Extensive']
  ]],
  ['وسوم زمنية', 'Era', [
    ['قديم', 'Old'],
    ['معاصر', 'Contemporary'],
    ['كلاسيكي', 'Classic'],
    ['حديث', 'Modern'],
    ['تراثي', 'Heritage']
  ]],
  ['وسوم فكرية', 'Intellectual', [
    ['فلسفي', 'Philosophical'],
    ['نقدي', 'Critical'],
    ['تحليلي', 'Analytical'],
    ['تأملي', 'Reflective'],
    ['نظري', 'Theoretical'],
    ['تطبيقي', 'Practical']
  ]],
  ['وسوم الأسلوب', 'Style', [
    ['بسيط', 'Simple'],
    ['صعب', 'Difficult'],
    ['أدبي', 'Literary'],
    ['أكاديمي', 'Academic'],
    ['مباشر', 'Direct'],
    ['رمزي', 'Symbolic']
  ]],
  ['وسوم الموضوع', 'Topic', [
    ['تاريخ', 'History'],
    ['حضارات', 'Civilizations'],
    ['سياسة', 'Politics'],
    ['اقتصاد', 'Economics'],
    ['اجتماع', 'Sociology'],
    ['دين', 'Religion'],
    ['ثقافة', 'Culture']
  ]],
  ['وسوم تجربة القراءة', 'Reading Experience', [
    ['خفيف', 'Light'],
    ['عميق', 'Deep'],
    ['ممتع', 'Enjoyable'],
    ['يحتاج تركيز', 'Requires Focus'],
    ['ملهم', 'Inspiring'],
    ['صادم', 'Shocking']
  ]],
  ['وسوم أدبية', 'Literary', [
    ['رواية', 'Novel'],
    ['شعر', 'Poetry'],
    ['قصة', 'Story'],
    ['رحلة', 'Journey'],
    ['سيرة', 'Biography'],
    ['مغامرة', 'Adventure']
  ]]
];

export const tags = tagGroups.flatMap(([group_ar, group_en, items], groupIndex) =>
  items.map(([name_ar, name_en], index) => ({
    id: groupIndex * 100 + index + 1,
    name_ar,
    name_en,
    group_ar,
    group_en
  }))
);

export const sampleBooks = [
  {
    id: 'b1',
    title: 'دلائل الإعجاز',
    author: 'عبد القاهر الجرجاني',
    translator: '',
    isbn_10: '',
    isbn_13: '',
    type: 'paper',
    category_id: 2,
    subcategory_id: 203,
    status: 'reading',
    rating: 0,
    tags: [4, 15, 24],
    language: 'العربية',
    cover_url: '',
    shelf_location: 'الرف 2 - غرفة القراءة',
    file_url: '',
    notes: 'كتاب أساسي في البلاغة.',
    favorite_quote: 'النظم هو توخي معاني النحو.',
    pages: 420,
    started_at: '2026-04-29T20:15',
    finished_at: '',
    created_at: '2026-04-25T12:00',
    needs_review: false,
    reading_sessions: [
      { id: 's1', started_at: '2026-04-29T20:15', ended_at: '2026-04-29T21:05', duration_minutes: 50 },
      { id: 's2', started_at: '2026-04-30T19:00', ended_at: '2026-04-30T19:45', duration_minutes: 45 }
    ],
    status_history: [{ status: 'reading', datetime: '2026-04-29T20:15' }],
    quotes: [{ quote_text: 'المزية ليست في اللفظ وحده.', page_number: 77, chapter: 'النظم', note: '', created_at: '2026-04-30T19:40' }],
    impact: {}
  },
  {
    id: 'b2',
    title: 'قصة الحضارة',
    author: 'ول ديورانت',
    translator: 'زكي نجيب محمود وآخرون',
    isbn_10: '',
    isbn_13: '9789776283702',
    type: 'pdf',
    category_id: 7,
    subcategory_id: 704,
    status: 'completed',
    rating: 5,
    tags: [5, 29, 30, 33],
    language: 'العربية',
    cover_url: '',
    shelf_location: '',
    file_url: 'D:/Books/story-of-civilization.pdf',
    notes: 'مرجع واسع وممتع.',
    favorite_quote: 'الحضارة نظام اجتماعي يعين الإنسان على الزيادة من إنتاجه الثقافي.',
    pages: 900,
    started_at: '2026-03-01T21:00',
    finished_at: '2026-04-10T23:30',
    created_at: '2026-02-28T12:00',
    needs_review: false,
    reading_sessions: [
      { id: 's3', started_at: '2026-03-01T21:00', ended_at: '2026-03-01T22:20', duration_minutes: 80 },
      { id: 's4', started_at: '2026-03-04T20:00', ended_at: '2026-03-04T21:10', duration_minutes: 70 },
      { id: 's5', started_at: '2026-04-10T22:10', ended_at: '2026-04-10T23:30', duration_minutes: 80 }
    ],
    status_history: [
      { status: 'reading', datetime: '2026-03-01T21:00' },
      { status: 'completed', datetime: '2026-04-10T23:30' }
    ],
    quotes: [],
    impact: { recommend: 'نعم، لمن يحب التاريخ الواسع.' }
  },
  {
    id: 'b3',
    title: 'Around the World in Eighty Days',
    author: 'Jules Verne',
    translator: '',
    isbn_10: '014044906X',
    isbn_13: '9780140449068',
    type: 'epub',
    category_id: 5,
    subcategory_id: 503,
    status: 'want_to_read',
    rating: 0,
    tags: [37, 38, 43],
    language: 'English',
    cover_url: '',
    shelf_location: '',
    file_url: 'D:/Books/around-world.epub',
    notes: '',
    favorite_quote: '',
    pages: 260,
    started_at: '',
    finished_at: '',
    created_at: '2026-04-20T15:30',
    needs_review: true,
    reading_sessions: [],
    status_history: [{ status: 'want_to_read', datetime: '2026-04-20T15:30' }],
    quotes: [],
    impact: {}
  }
];

export function localizedName(item, language) {
  return language === 'en' ? item.name_en || item.name_ar : item.name_ar || item.name_en;
}

export function normalizeIsbn(value) {
  return value.replace(/[^0-9Xx]/g, '').toUpperCase();
}
