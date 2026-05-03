import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Camera,
  ChevronDown,
  Check,
  Clock3,
  Download,
  ArrowRight,
  ImageUp,
  FileText,
  Filter,
  Globe2,
  Grid3X3,
  Images,
  ListChecks,
  Map,
  Moon,
  Plus,
  Search,
  Star,
  Sun,
  Tags,
  Rows3,
  User,
  X
} from 'lucide-react';
import {
  bookTypes,
  categories as initialCategories,
  localizedName,
  normalizeIsbn,
  readingStatuses,
  sampleBooks,
  tags as initialTags
} from './data/libraryData';

const nowLocal = () => new Date().toISOString().slice(0, 16);
const digitalTypes = ['pdf', 'epub', 'external'];
const BOOKS_STORAGE_KEY = 'maktabati.books';
const CATEGORIES_STORAGE_KEY = 'maktabati.categories';
const TAGS_STORAGE_KEY = 'maktabati.tags';
const USER_SETTINGS_STORAGE_KEY = 'maktabati.userSettings.v1';
const USER_SESSION_STORAGE_KEY = 'maktabati.localSession.v1';

const defaultUserSettings = {
  displayName: 'مستخدم مكتبتي',
  libraryDescription: 'مكتبة شخصية',
  language: 'ar',
  themePreference: 'light',
  timeFormat: '12',
  defaultView: 'summary',
  defaultCategoryId: '',
  defaultBookType: 'paper'
};

function readStoredJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function resolveThemePreference(preference) {
  if (preference === 'system' && typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference === 'dark' ? 'dark' : 'light';
}
const defaultStatus = 'not_started';
const defaultType = 'paper';

const csvHeaderMap = {
  '\uFEFFالعنوان': 'title',
  'العنوان': 'title',
  title: 'title',
  'المؤلف': 'author',
  author: 'author',
  'التصنيف الرئيسي': 'main_category',
  main_category: 'main_category',
  'التصنيف الفرعي': 'sub_category',
  sub_category: 'sub_category',
  'نوع الكتاب': 'book_type',
  book_type: 'book_type',
  'حالة القراءة': 'reading_status',
  reading_status: 'reading_status',
  'التقييم': 'rating',
  rating: 'rating',
  'ISBN-10': 'isbn_10',
  isbn10: 'isbn_10',
  isbn_10: 'isbn_10',
  'ISBN-13': 'isbn_13',
  isbn13: 'isbn_13',
  isbn_13: 'isbn_13',
  'اسم المترجم': 'translator',
  'المترجم': 'translator',
  translator: 'translator',
  'دار النشر': 'publisher',
  publisher: 'publisher',
  'الطبعة': 'edition',
  edition: 'edition',
  'سنة النشر': 'publication_year',
  publication_year: 'publication_year',
  'عدد الصفحات': 'pages',
  pages: 'pages',
  'سعر الشراء': 'purchase_price',
  purchase_price: 'purchase_price',
  'مكان الكتاب': 'shelf_location',
  location: 'shelf_location',
  'الغرفة': 'room',
  room: 'room',
  'الرف': 'shelf',
  shelf: 'shelf',
  'الصندوق': 'box',
  box: 'box',
  'الملاحظات': 'notes',
  notes: 'notes',
  'اقتباس مفضل': 'favorite_quote',
  favorite_quote: 'favorite_quote',
  'تاريخ بداية القراءة': 'started_at',
  reading_started_at: 'started_at',
  'تاريخ الانتهاء من القراءة': 'finished_at',
  reading_finished_at: 'finished_at',
  'صورة الغلاف': 'cover_url',
  cover_image_url: 'cover_url'
};

const statusAliases = {
  'لم أبدأ': 'not_started',
  'لم يبدأ': 'not_started',
  not_started: 'not_started',
  'أريد قراءته': 'want_to_read',
  want_to_read: 'want_to_read',
  'جاري القراءة': 'reading',
  reading: 'reading',
  'مكتمل': 'completed',
  completed: 'completed',
  'متوقف': 'paused',
  paused: 'paused',
  'متروك': 'deferred',
  abandoned: 'deferred',
  'مؤجل': 'deferred',
  deferred: 'deferred'
};

const typeAliases = {
  'ورقي': 'paper',
  physical: 'paper',
  paper: 'paper',
  print: 'paper',
  'رقمي': 'pdf',
  digital: 'pdf',
  pdf: 'pdf',
  PDF: 'pdf',
  epub: 'epub',
  EPUB: 'epub',
  'صوتي': 'audio',
  audio: 'audio',
  'رابط خارجي': 'external',
  external: 'external'
};

function optionLabel(items, id, t) {
  return t(items.find((item) => item.id === id)?.labelKey || 'all');
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));
const hourOptions24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const hourOptions12 = Array.from({ length: 12 }, (_, index) => String(index + 1));

function formatDateTime(value, language = 'ar', timeFormat = '12') {
  if (!value) return language === 'ar' ? 'غير محدد' : 'Not set';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split('-');
    return language === 'ar' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === 'ar' ? 'غير محدد' : 'Not set';
  const day = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', { day: '2-digit' }).format(date);
  const month = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', { month: '2-digit' }).format(date);
  const year = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', { year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat !== '24'
  }).format(date);
  return `${day}/${month}/${year} - ${time}`;
}

function splitDateTime(value) {
  if (!value || value === 'invalid') return { date: '', time: '' };
  const [datePart = '', timePart = ''] = String(value).split('T');
  return { date: datePart, time: timePart.slice(0, 5) };
}

function joinDateTime(date, time) {
  if (!date && !time) return '';
  if (date && !time) return date;
  if (!date && time) return '';
  return `${date}T${time}`;
}

function splitTimeParts(time, timeFormat = '12') {
  if (!time) return { hour: '', minute: '', period: 'AM' };
  const [rawHour = '', rawMinute = ''] = String(time).split(':');
  const hour24 = Number(rawHour);
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) return { hour: '', minute: '', period: 'AM' };
  if (timeFormat === '24') {
    return { hour: String(hour24).padStart(2, '0'), minute: rawMinute || '00', period: '' };
  }
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return { hour: String(hour12), minute: rawMinute || '00', period };
}

function buildTimeValue({ hour, minute, period }, timeFormat = '12') {
  if (!hour) return '';
  const safeMinute = minute || '00';
  if (timeFormat === '24') return `${String(hour).padStart(2, '0')}:${safeMinute}`;
  let hour24 = Number(hour) % 12;
  if (period === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${safeMinute}`;
}

function isValidDateTime(value) {
  if (!value) return true;
  if (value === 'invalid') return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return true;
  return !Number.isNaN(new Date(value).getTime());
}

function sanitizeIsbnInput(value) {
  const compact = String(value || '').replace(/[\s-]/g, '').toUpperCase();
  const chars = compact.replace(/[^0-9X]/g, '').split('');
  return chars.filter((char, index) => char !== 'X' || index === chars.length - 1).join('');
}

function isValidIsbnInput(value) {
  if (!value) return true;
  if (/^\d{13}$/.test(value)) return true;
  return /^\d{9}[\dX]$/.test(value);
}

function isMostlyLatin(value = '') {
  const text = String(value).trim();
  if (!text) return false;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return latin > arabic;
}

function makeInitialBookForm(defaultCategory, language, defaultBookType = defaultType) {
  return {
    title: '',
    author: '',
    translator: '',
    type: defaultBookType,
    category_id: defaultCategory.id,
    subcategory_id: defaultCategory.subcategories[0].id,
    status: defaultStatus,
    rating: 0,
    tagIds: [],
    isbn: '',
    isbn_10: '',
    isbn_13: '',
    publisher: '',
    publication_year: '',
    edition: '',
    purchase_price: '',
    pages: '',
    language: language === 'ar' ? 'العربية' : 'English',
    cover_url: '',
    cover_file_name: '',
    shelf_location: '',
    room: '',
    shelf: '',
    box: '',
    file_url: '',
    audio_duration: '',
    notes: '',
    favorite_quote: '',
    created_at: '',
    started_at: '',
    finished_at: ''
  };
}

function TimeDropdown({ value, onChange, timeFormat, t }) {
  const parts = splitTimeParts(value, timeFormat);

  function update(nextParts) {
    onChange(buildTimeValue(nextParts, timeFormat));
  }

  return (
    <div className={timeFormat === '24' ? 'timeDropdowns timeDropdowns24' : 'timeDropdowns'}>
      <select value={parts.hour} onChange={(event) => update({ ...parts, hour: event.target.value })}>
        <option value="">{t('chooseTimeOptional')}</option>
        {(timeFormat === '24' ? hourOptions24 : hourOptions12).map((hour) => (
          <option key={hour} value={hour}>{hour}</option>
        ))}
      </select>
      <select value={parts.minute} onChange={(event) => update({ ...parts, minute: event.target.value })} disabled={!parts.hour}>
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>{minute}</option>
        ))}
      </select>
      {timeFormat !== '24' && (
        <select value={parts.period} onChange={(event) => update({ ...parts, period: event.target.value })} disabled={!parts.hour}>
          <option value="AM">{t('am')}</option>
          <option value="PM">{t('pm')}</option>
        </select>
      )}
    </div>
  );
}

function DateInput({ label, value, onChange, t, timeFormat }) {
  const parts = splitDateTime(value);
  const invalid = value === 'invalid';

  function update(nextParts) {
    onChange(joinDateTime(nextParts.date, nextParts.time));
  }

  return (
    <fieldset className="dateTimeField">
      <legend>{label}</legend>
      <label>
        {t('date')} <small>{t('optional')}</small>
        <input
          type="date"
          value={parts.date}
          onChange={(event) => update({ ...parts, date: event.target.value })}
        />
      </label>
      <label>
        {t('time')} <small>{t('optional')}</small>
        <TimeDropdown value={parts.time} timeFormat={timeFormat} onChange={(time) => update({ ...parts, time })} t={t} />
      </label>
      <small className="fieldHint">{t('dateTimeOptionalHint')}</small>
      {invalid && <small className="fieldError">{t('invalidDateTime')}</small>}
    </fieldset>
  );
}

function IsbnInput({ value, onChange, onBlur, showError, t }) {
  return (
    <label>
      {t('isbnOptionalLabel')}
      <input
        value={value}
        inputMode="text"
        autoComplete="off"
        placeholder={t('isbnExamplePlaceholder')}
        onChange={(event) => onChange(sanitizeIsbnInput(event.target.value))}
        onBlur={onBlur}
      />
      {showError && <small className="fieldError">{t('invalidIsbn')}</small>}
    </label>
  );
}

function buildBookFromForm(form) {
  const date = nowLocal();
  const isbn = sanitizeIsbnInput(form.isbn || form.isbn_13 || form.isbn_10);
  return {
    ...form,
    id: crypto.randomUUID(),
    isbn_10: isbn.length === 10 ? isbn : '',
    isbn_13: isbn.length === 13 ? isbn : '',
    tags: form.tagIds,
    rating: form.status === 'completed' ? Number(form.rating) : 0,
    pages: Number(form.pages) || '',
    shelf_location: form.shelf_location || [form.room && `الغرفة: ${form.room}`, form.shelf && `الرف: ${form.shelf}`, form.box && `الصندوق: ${form.box}`].filter(Boolean).join(' - '),
    status_history: [{ status: form.status, datetime: date }],
    reading_sessions: [],
    quotes: [],
    impact: {},
    needs_review: !isbn && !form.cover_url,
    created_at: form.created_at || ''
  };
}

function minutesBetween(startedAt, endedAt) {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
}

function getActiveSession(book) {
  return book?.reading_sessions?.find((session) => session.started_at && !session.ended_at);
}

function getCategory(categoryList, id) {
  return categoryList.find((category) => category.id === Number(id));
}

function getSubcategory(categoryList, categoryId, subcategoryId) {
  return getCategory(categoryList, categoryId)?.subcategories.find((item) => item.id === Number(subcategoryId));
}

function safeLocalizedName(item, language) {
  return item ? localizedName(item, language) : '-';
}

function findCategoryByName(categoryList, value, language) {
  const needle = String(value || '').trim().toLowerCase();
  if (!needle) return categoryList[0];
  return categoryList.find((category) =>
    [category.name_ar, category.name_en, localizedName(category, language)]
      .filter(Boolean)
      .some((name) => String(name).trim().toLowerCase() === needle)
  ) || categoryList[0];
}

function findSubcategoryByName(category, value, language) {
  const needle = String(value || '').trim().toLowerCase();
  if (!category?.subcategories?.length) return null;
  if (!needle) return category.subcategories[0];
  return category.subcategories.find((subcategory) =>
    [subcategory.name_ar, subcategory.name_en, localizedName(subcategory, language)]
      .filter(Boolean)
      .some((name) => String(name).trim().toLowerCase() === needle)
  ) || category.subcategories[0];
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => csvHeaderMap[header.trim()] || header.trim());
  return rows.slice(1).map((values) =>
    headers.reduce((record, header, index) => ({ ...record, [header]: values[index] || '' }), {})
  );
}

function normalizeImportedRecord(record, categories, language) {
  const category =
    getCategory(categories, record.category_id) ||
    findCategoryByName(categories, record.main_category || record.category || record.category_name, language);
  const subcategory =
    getSubcategory(categories, category.id, record.subcategory_id) ||
    findSubcategoryByName(category, record.sub_category || record.subcategory || record.subcategory_name, language);
  const room = record.room ? `${record.room}`.trim() : '';
  const shelf = record.shelf ? `${record.shelf}`.trim() : '';
  const box = record.box ? `${record.box}`.trim() : '';
  const locationParts = [record.shelf_location || record.location, room && `الغرفة: ${room}`, shelf && `الرف: ${shelf}`, box && `الصندوق: ${box}`]
    .filter(Boolean);

  const status = statusAliases[String(record.reading_status || record.status || '').trim()] || defaultStatus;
  const type = typeAliases[String(record.book_type || record.type || '').trim()] || defaultType;
  const ratingValue = String(record.rating || '').trim();
  const rating = ratingValue ? Number(ratingValue) : 0;
  const date = nowLocal();

  return {
    id: crypto.randomUUID(),
    title: String(record.title || record['العنوان'] || '').trim(),
    author: String(record.author || record['المؤلف'] || '').trim(),
    translator: String(record.translator || '').trim(),
    isbn_10: normalizeIsbn(String(record.isbn_10 || record.isbn10 || '')),
    isbn_13: normalizeIsbn(String(record.isbn_13 || record.isbn13 || '')),
    type,
    category_id: category.id,
    subcategory_id: subcategory?.id || category.subcategories[0]?.id,
    status,
    rating: status === 'completed' ? rating : 0,
    tags: [],
    publisher: String(record.publisher || '').trim(),
    publication_year: String(record.publication_year || '').trim(),
    edition: String(record.edition || '').trim(),
    purchase_price: String(record.purchase_price || '').trim(),
    pages: Number(record.pages) || '',
    language: language === 'ar' ? 'العربية' : 'English',
    cover_url: String(record.cover_url || record.cover_image_url || '').trim(),
    cover_file_name: '',
    shelf_location: locationParts.join(' - '),
    file_url: String(record.file_url || '').trim(),
    audio_duration: String(record.audio_duration || '').trim(),
    notes: String(record.notes || '').trim(),
    favorite_quote: String(record.favorite_quote || '').trim(),
    started_at: String(record.started_at || record.reading_started_at || '').trim(),
    finished_at: String(record.finished_at || record.reading_finished_at || '').trim(),
    created_at: String(record.created_at || '').trim() || date,
    updated_at: String(record.updated_at || '').trim(),
    needs_review: !(record.isbn_13 || record.isbn13 || record.cover_url || record.cover_image_url),
    reading_sessions: Array.isArray(record.reading_sessions) ? record.reading_sessions : [],
    status_history: Array.isArray(record.status_history) ? record.status_history : [{ status, datetime: date }],
    quotes: Array.isArray(record.quotes) ? record.quotes : [],
    impact: record.impact && typeof record.impact === 'object' ? record.impact : {}
  };
}

function validateImportedBook(book, sourceRecord, existingBooks) {
  const ratingRaw = String(sourceRecord.rating || '').trim();
  const duplicate = existingBooks.some((existing) => {
    const sameIsbn13 = book.isbn_13 && existing.isbn_13 && book.isbn_13 === existing.isbn_13;
    const sameIsbn10 = book.isbn_10 && existing.isbn_10 && book.isbn_10 === existing.isbn_10;
    const sameTitleAuthor =
      book.title &&
      book.author &&
      existing.title?.trim().toLowerCase() === book.title.trim().toLowerCase() &&
      existing.author?.trim().toLowerCase() === book.author.trim().toLowerCase();
    return sameIsbn13 || sameIsbn10 || sameTitleAuthor;
  });

  if (!book.title || !book.author) return 'missing';
  if (ratingRaw && !['1', '2', '3', '4', '5'].includes(ratingRaw)) return 'invalid';
  if (duplicate) return 'duplicate';
  return 'ready';
}

function statusLabelKey(status) {
  return {
    ready: 'readyToImport',
    missing: 'missingData',
    duplicate: 'possibleDuplicate',
    invalid: 'formatError'
  }[status] || 'formatError';
}

function RatingStars({ value, onChange, disabled = false }) {
  return (
    <div className="stars" aria-label="rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? 'star active' : 'star'}
          disabled={disabled}
          onClick={() => onChange?.(star)}
          title={`${star}`}
        >
          <Star size={20} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function CoverPlaceholder({ title, author, label, fallbackTitle, compact = false }) {
  return (
    <div className={compact ? 'coverPlaceholder compactCoverPlaceholder' : 'coverPlaceholder'}>
      <BookOpen size={compact ? 24 : 34} />
      <strong dir={isMostlyLatin(title || fallbackTitle) ? 'ltr' : undefined}>{title || fallbackTitle}</strong>
      {author && <span dir={isMostlyLatin(author) ? 'ltr' : undefined}>{author}</span>}
      <small>{label}</small>
    </div>
  );
}

function LogoMark({ variant = 'book-stack', large = false }) {
  return (
    <span className={`brandMark logo-${variant} ${large ? 'brandMarkLarge' : ''}`} aria-hidden="true">
      <span className="brandPage brandPageLeft" />
      <span className="brandPage brandPageRight" />
      <span className="brandDot" />
      <span className="brandLetter">م</span>
      <span className="shelfLine" />
      <span className="shelfBook shelfBookOne" />
      <span className="shelfBook shelfBookTwo" />
      <span className="shelfBook shelfBookThree" />
      <span className="bookmarkBook" />
      <span className="bookmarkRibbon" />
      <span className="windowBox" />
      <span className="windowLine windowLineOne" />
      <span className="windowLine windowLineTwo" />
      <span className="stackBase" />
      <span className="stackBook stackBookOne" />
      <span className="stackBook stackBookTwo" />
      <span className="stackBook stackBookThree" />
      <span className="stackBook stackBookTilt" />
    </span>
  );
}

function ImportBooksDialog({ type, books, categories, language, onClose, onImport }) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState('');

  const validRows = rows.filter((row) => row.status === 'ready');
  const duplicateRows = rows.filter((row) => row.status === 'duplicate');
  const invalidRows = rows.filter((row) => row.status === 'invalid');
  const missingRows = rows.filter((row) => row.status === 'missing');

  function readFile(event) {
    const file = event.target.files?.[0];
    setError('');
    setResult('');
    setRows([]);
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if ((type === 'csv' && extension !== 'csv') || (type === 'json' && extension !== 'json')) {
      setError(t('unsupportedFileType'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setError(type === 'csv' ? t('csvReadError') : t('invalidJson'));
    reader.onload = () => {
      try {
        const text = String(reader.result || '').trim();
        if (!text) {
          setError(t('emptyFile'));
          return;
        }
        let rawRows = [];
        if (type === 'csv') {
          rawRows = parseCsv(text);
          if (!rawRows.length) {
            setError(t('csvReadError'));
            return;
          }
        } else {
          const parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
          if (Array.isArray(parsed)) rawRows = parsed;
          else if (Array.isArray(parsed.books)) rawRows = parsed.books;
          else {
            setError(t('invalidJson'));
            return;
          }
        }

        const seen = new Set();
        const preview = rawRows.map((record, index) => {
          const book = normalizeImportedRecord(record, categories, language);
          let status = validateImportedBook(book, record, books);
          const fingerprint = book.isbn_13 || book.isbn_10 || `${book.title.trim().toLowerCase()}|${book.author.trim().toLowerCase()}`;
          if (status === 'ready' && fingerprint && seen.has(fingerprint)) status = 'duplicate';
          if (fingerprint) seen.add(fingerprint);
          return { index: index + 1, source: record, book, status };
        });
        setRows(preview);
      } catch {
        setError(type === 'csv' ? t('csvReadError') : t('invalidJson'));
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function confirmImport() {
    const imported = validRows.map((row) => row.book);
    if (!imported.length) {
      setError(t('noValidRows'));
      return;
    }
    onImport(imported);
    const skipped = rows.length - imported.length;
    setResult(
      t('importSummary', {
        imported: imported.length,
        skipped,
        duplicates: duplicateRows.length,
        invalid: invalidRows.length + missingRows.length
      })
    );
    setRows([]);
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal importModal">
        <div className="modalHeader">
          <div>
            <h2>{type === 'csv' ? t('importCsv') : t('importJson')}</h2>
            <p>{t('importHint')}</p>
          </div>
          <button className="iconButton" type="button" onClick={onClose} title={t('cancel')}>
            <X size={20} />
          </button>
        </div>

        <div className="importUploader">
          <label className="smallUploadButton">
            <ImageUp size={16} />
            {t('chooseFile')}
            <input type="file" accept={type === 'csv' ? '.csv,text/csv' : '.json,application/json'} onChange={readFile} />
          </label>
          <span>{t('previewBeforeImport')}</span>
        </div>

        {error && <p className="error">{error}</p>}
        {result && <p className="notice successNotice">{result}</p>}

        {!!rows.length && (
          <>
            <section className="importStats">
              <div><strong>{rows.length}</strong><span>{t('totalRows')}</span></div>
              <div><strong>{validRows.length}</strong><span>{t('validRows')}</span></div>
              <div><strong>{missingRows.length + invalidRows.length}</strong><span>{t('invalidRows')}</span></div>
              <div><strong>{duplicateRows.length}</strong><span>{t('duplicateRows')}</span></div>
            </section>
            <div className="importTableWrap">
              <table className="importTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('bookTitle')}</th>
                    <th>{t('author')}</th>
                    <th>{t('mainCategory')}</th>
                    <th>{t('bookType')}</th>
                    <th>{t('readingStatus')}</th>
                    <th>{t('importStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 12).map((row) => (
                    <tr key={row.index} className={`import-${row.status}`}>
                      <td>{row.index}</td>
                      <td>{row.book.title || '-'}</td>
                      <td>{row.book.author || '-'}</td>
                      <td>{safeLocalizedName(getCategory(categories, row.book.category_id), language)}</td>
                      <td>{optionLabel(bookTypes, row.book.type, t)}</td>
                      <td>{optionLabel(readingStatuses, row.book.status, t)}</td>
                      <td>{t(statusLabelKey(row.status))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 12 && <p className="hint">{t('previewLimited')}</p>}
          </>
        )}

        <div className="modalActions stickyActions">
          <button className="secondaryButton" type="button" onClick={onClose}>{t('cancel')}</button>
          <button className="primaryButton" type="button" onClick={confirmImport} disabled={!validRows.length}>
            <Check size={18} /> {t('importValidRows')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBookModal({ onClose, onSave, language, timeFormat, categories, tags, defaultCategoryId, defaultBookType, onAddCategory, onAddSubcategory, onAddTag }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('manual');
  const [addMode, setAddMode] = useState('quick');
  const [openSections, setOpenSections] = useState({ basics: true });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [isbnQuery, setIsbnQuery] = useState('');
  const [isbnTouched, setIsbnTouched] = useState(false);
  const [lookupState, setLookupState] = useState('');
  const [error, setError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const defaultCategory = categories.find((category) => category.id === Number(defaultCategoryId)) || categories[0];
  const [form, setForm] = useState(() => makeInitialBookForm(defaultCategory, language, defaultBookType || defaultType));

  const subcategories = getCategory(categories, form.category_id)?.subcategories || [];
  const selectedTags = tags.filter((tag) => form.tagIds.includes(tag.id));
  const searchedTags = tags.filter((tag) => {
    const needle = tagSearch.trim().toLowerCase();
    if (!needle) return true;
    return [tag.name_ar, tag.name_en, tag.group_ar, tag.group_en]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const orderedTags = [
    ...selectedTags,
    ...searchedTags.filter((tag) => !form.tagIds.includes(tag.id))
  ].slice(0, 28);
  const canSave = Boolean(form.title.trim() && form.author.trim());
  const hasValidDates = [form.created_at, form.started_at, form.finished_at].every(isValidDateTime);
  const hasValidIsbn = isValidIsbnInput(form.isbn);

  function updateField(field, value) {
    if (saveNotice) setSaveNotice('');
    if (error) setError('');
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'category_id') {
        const category = getCategory(categories, value);
        if (category?.subcategories?.length) {
          next.subcategory_id = category.subcategories[0].id;
        }
      }
      if (field === 'status' && value !== 'completed') next.rating = 0;
      return next;
    });
  }

  function toggleTag(tagId) {
    setForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((id) => id !== tagId)
        : [...current.tagIds, tagId]
    }));
  }

  function handleCoverUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((current) => ({
      ...current,
      cover_url: URL.createObjectURL(file),
      cover_file_name: file.name
    }));
  }

  function addMainCategory() {
    const categoryName = newCategoryName.trim();
    if (!categoryName) return;
    const category = onAddCategory(categoryName);
    setForm((current) => ({
      ...current,
      category_id: category.id,
      subcategory_id: category.subcategories[0].id
    }));
    setNewCategoryName('');
    setShowNewCategory(false);
  }

  function addSubcategory() {
    const subcategoryName = newSubcategoryName.trim();
    if (!subcategoryName) return;
    const subcategory = onAddSubcategory(form.category_id, subcategoryName);
    if (!subcategory) return;
    updateField('subcategory_id', subcategory.id);
    setNewSubcategoryName('');
    setShowNewSubcategory(false);
  }

  function addTag() {
    const tagName = newTagName.trim();
    if (!tagName) return;
    const tag = onAddTag(tagName);
    setForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tag.id) ? current.tagIds : [...current.tagIds, tag.id]
    }));
    setNewTagName('');
  }

  function fakeLookup() {
    const isbn = sanitizeIsbnInput(isbnQuery);
    if (isbn === '9780140449068') {
      setForm((current) => ({
        ...current,
        title: 'Around the World in Eighty Days',
        author: 'Jules Verne',
        type: 'epub',
        category_id: 5,
        subcategory_id: 503,
        isbn,
        isbn_13: isbn,
        language: 'English',
        file_url: 'D:/Books/around-world.epub'
      }));
      setMode('manual');
      setLookupState('');
      return;
    }
    setLookupState(t('notFoundManual'));
  }

  function validateFormBeforeSave() {
    if (!canSave) {
      setError(t('requiredBookFields'));
      return false;
    }
    if (!hasValidDates) {
      setError(t('invalidDateTime'));
      return false;
    }
    if (!hasValidIsbn) {
      setIsbnTouched(true);
      setError(t('invalidIsbn'));
      return false;
    }
    return true;
  }

  function submit(event) {
    event.preventDefault();
    if (!validateFormBeforeSave()) return;
    onSave(buildBookFromForm(form));
    onClose();
  }

  function saveAndAddAnother() {
    if (!validateFormBeforeSave()) return;
    onSave(buildBookFromForm(form), { keepOpen: true });
    setForm(makeInitialBookForm(defaultCategory, language, defaultBookType || defaultType));
    setError('');
    setSaveNotice(t('bookSavedReadyForNext'));
    setNewCategoryName('');
    setNewSubcategoryName('');
    setNewTagName('');
    setTagSearch('');
    setIsbnQuery('');
    setLookupState('');
    setIsbnTouched(false);
    setOpenSections({ basics: true });
  }

  function toggleSection(section) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function DetailSection({ id, title, children }) {
    const expanded = !!openSections[id];
    return (
      <section className="formSection">
        <button className="formSectionHeader" type="button" onClick={() => toggleSection(id)} aria-expanded={expanded}>
          <span>{title}</span>
          <ChevronDown size={17} />
        </button>
        {expanded && <div className="formSectionBody">{children}</div>}
      </section>
    );
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modalHeader">
          <div>
            <h2>{t('addBook')}</h2>
            <p>{t('quickAddHint')}</p>
          </div>
          <button className="iconButton" type="button" onClick={onClose} title={t('cancel')}>
            <X size={20} />
          </button>
        </div>

        <div className="addModes">
          {[
            ['cover', Camera, 'coverCapture'],
            ['isbn', Search, 'isbnBarcode'],
            ['manual', FileText, 'manualEntry']
          ].map(([id, Icon, label]) => (
            <button key={id} className={mode === id ? 'mode active' : 'mode'} type="button" onClick={() => setMode(id)}>
              <Icon size={22} />
              <span>{t(label)}</span>
            </button>
          ))}
        </div>

        {mode === 'cover' && (
          <div className="placeholderPanel">
            <Camera size={36} />
            <strong>{t('coverCapture')}</strong>
            <span>{t('coverCaptureHint')}</span>
            <label className="smallUploadButton">
              <ImageUp size={16} />
              {t('uploadCover')}
              <input type="file" accept="image/*" onChange={(event) => { handleCoverUpload(event); setMode('manual'); }} />
            </label>
          </div>
        )}

        {mode === 'isbn' && (
          <div className="isbnPanel">
            <input
              value={isbnQuery}
              onChange={(event) => setIsbnQuery(sanitizeIsbnInput(event.target.value))}
              placeholder={t('isbnPlaceholder')}
            />
            <div className="rowActions">
              <button className="primaryButton" type="button" onClick={fakeLookup}>
                <Search size={18} /> {t('search')}
              </button>
              <button className="secondaryButton" type="button" onClick={() => setLookupState(t('scanBarcodeSoon'))}>
                <Grid3X3 size={18} /> {t('scanBarcode')}
              </button>
            </div>
            {lookupState && <p className="notice">{lookupState}</p>}
          </div>
        )}

        {mode === 'manual' && (
          <form className="bookForm" onSubmit={submit}>
            {error && <p className="error">{error}</p>}
            {saveNotice && <p className="notice successNotice">{saveNotice}</p>}
            <div className="segmentedControl addLevelToggle">
              <button type="button" className={addMode === 'quick' ? 'active' : ''} onClick={() => setAddMode('quick')}>
                {t('quickAdd')}
              </button>
              <button type="button" className={addMode === 'detailed' ? 'active' : ''} onClick={() => { setAddMode('detailed'); setOpenSections({ basics: true }); }}>
                {t('detailedAdd')}
              </button>
            </div>

            {addMode === 'quick' ? (
              <>
                <div className="formGrid">
                  <label>
                    {t('bookTitle')} *
                    <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                  </label>
                  <label>
                    {t('author')} *
                    <input value={form.author} onChange={(event) => updateField('author', event.target.value)} />
                  </label>
                  <label>
                    {t('mainCategory')}
                    <select value={form.category_id} onChange={(event) => updateField('category_id', Number(event.target.value))}>
                      {categories.map((category) => <option key={category.id} value={category.id}>{safeLocalizedName(category, language)}</option>)}
                    </select>
                  </label>
                  <label>
                    {t('bookType')}
                    <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                      {bookTypes.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                    </select>
                  </label>
                  <label>
                    {t('readingStatus')}
                    <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                      {readingStatuses.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}
                    </select>
                  </label>
                  <IsbnInput
                    value={form.isbn}
                    onChange={(value) => updateField('isbn', value)}
                    onBlur={() => setIsbnTouched(true)}
                    showError={isbnTouched && !hasValidIsbn}
                    t={t}
                  />
                </div>
                <div className="coverUpload">
                  <span>{t('bookCover')}</span>
                  <label className="smallUploadButton">
                    <ImageUp size={16} />
                    {t('uploadCover')}
                    <input type="file" accept="image/*" onChange={handleCoverUpload} />
                  </label>
                  {form.cover_file_name && <small>{form.cover_file_name}</small>}
                  {form.cover_url && <img src={form.cover_url} alt="" />}
                  {form.cover_url && <button className="linkButton compactLink" type="button" onClick={() => setForm((current) => ({ ...current, cover_url: '', cover_file_name: '' }))}>{t('removeCover')}</button>}
                </div>
              </>
            ) : (
              <div className="detailedSections">
                <DetailSection id="basics" title={t('basicData')}>
                  <div className="formGrid">
                    <label>
                      {t('bookTitle')} *
                      <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                    </label>
                    <label>
                      {t('author')} *
                      <input value={form.author} onChange={(event) => updateField('author', event.target.value)} />
                    </label>
                    <label>
                      <span className="labelText">{t('translator')} <small>{t('optional')}</small></span>
                      <input value={form.translator} onChange={(event) => updateField('translator', event.target.value)} />
                    </label>
                    <label>
                      {t('mainCategory')}
                      <select value={form.category_id} onChange={(event) => updateField('category_id', Number(event.target.value))}>
                        {categories.map((category) => <option key={category.id} value={category.id}>{safeLocalizedName(category, language)}</option>)}
                      </select>
                      <button className="linkButton compactLink" type="button" onClick={() => setShowNewCategory((value) => !value)}>
                        <Plus size={15} /> {t('createMainCategory')}
                      </button>
                    </label>
                    <label>
                      {t('subcategory')}
                      <select value={form.subcategory_id} onChange={(event) => updateField('subcategory_id', Number(event.target.value))}>
                        {subcategories.map((item) => <option key={item.id} value={item.id}>{safeLocalizedName(item, language)}</option>)}
                      </select>
                      <button className="linkButton compactLink" type="button" onClick={() => setShowNewSubcategory((value) => !value)}>
                        <Plus size={15} /> {t('createSubcategory')}
                      </button>
                    </label>
                    {showNewCategory && (
                      <label>
                        {t('addMainCategory')}
                        <div className="inlineAdd">
                          <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder={t('newMainCategoryPlaceholder')} />
                          <button className="secondaryButton" type="button" onClick={addMainCategory}><Plus size={17} /> {t('addAsMainCategory')}</button>
                        </div>
                      </label>
                    )}
                    {showNewSubcategory && (
                      <label>
                        {t('addSubcategory')}
                        <div className="inlineAdd">
                          <input value={newSubcategoryName} onChange={(event) => setNewSubcategoryName(event.target.value)} placeholder={t('newSubcategoryPlaceholder')} />
                          <button className="secondaryButton" type="button" onClick={addSubcategory}><Plus size={17} /> {t('addAsSubcategory')}</button>
                        </div>
                      </label>
                    )}
                    <label>
                      {t('bookType')}
                      <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                        {bookTypes.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                      </select>
                    </label>
                    <label>
                      {t('readingStatus')}
                      <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                        {readingStatuses.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}
                      </select>
                    </label>
                    <label>
                      {t('language')}
                      <select value={form.language} onChange={(event) => updateField('language', event.target.value)}>
                        <option value="العربية">{t('arabic')}</option>
                        <option value="English">{t('english')}</option>
                      </select>
                    </label>
                  </div>
                </DetailSection>

                <DetailSection id="publishing" title={t('publishingData')}>
                  <div className="formGrid">
                    <IsbnInput
                      value={form.isbn}
                      onChange={(value) => updateField('isbn', value)}
                      onBlur={() => setIsbnTouched(true)}
                      showError={isbnTouched && !hasValidIsbn}
                      t={t}
                    />
                    {[
                      ['publisher', 'publisher'],
                      ['publication_year', 'publicationYear'],
                      ['edition', 'edition'],
                      ['pages', 'pages'],
                      ['purchase_price', 'purchasePrice']
                    ].map(([field, label]) => (
                      <label key={field}>
                        {t(label)}
                        <input value={form[field] || ''} onChange={(event) => updateField(field, event.target.value)} />
                      </label>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection id="readingRating" title={t('readingAndRating')}>
                  <div className="formGrid">
                    <DateInput label={t('addedAt')} value={form.created_at} onChange={(value) => updateField('created_at', value)} t={t} timeFormat={timeFormat} />
                    <DateInput label={t('startedAt')} value={form.started_at} onChange={(value) => updateField('started_at', value)} t={t} timeFormat={timeFormat} />
                    <DateInput label={t('finishedAt')} value={form.finished_at} onChange={(value) => updateField('finished_at', value)} t={t} timeFormat={timeFormat} />
                  </div>
                  {form.status === 'completed' ? (
                    <div className="inlineField">
                      <span>{t('rating')}</span>
                      <RatingStars value={Number(form.rating)} onChange={(value) => updateField('rating', value)} />
                    </div>
                  ) : (
                    <p className="hint">{t('completedOnlyRating')}</p>
                  )}
                </DetailSection>

                <DetailSection id="coverLocation" title={t('coverAndLocation')}>
                  <div className="coverUpload">
                    <span>{t('bookCover')}</span>
                    <label className="smallUploadButton">
                      <ImageUp size={16} />
                      {t('uploadCover')}
                      <input type="file" accept="image/*" onChange={handleCoverUpload} />
                    </label>
                    {form.cover_file_name && <small>{form.cover_file_name}</small>}
                    {form.cover_url && <img src={form.cover_url} alt="" />}
                    {form.cover_url && <button className="linkButton compactLink" type="button" onClick={() => setForm((current) => ({ ...current, cover_url: '', cover_file_name: '' }))}>{t('removeCover')}</button>}
                  </div>
                  <div className="formGrid">
                    <label>{t('shelfLocation')}<input value={form.shelf_location} onChange={(event) => updateField('shelf_location', event.target.value)} /></label>
                    <label>{t('room')}<input value={form.room} onChange={(event) => updateField('room', event.target.value)} /></label>
                    <label>{t('shelf')}<input value={form.shelf} onChange={(event) => updateField('shelf', event.target.value)} /></label>
                    <label>{t('box')}<input value={form.box} onChange={(event) => updateField('box', event.target.value)} /></label>
                    {digitalTypes.includes(form.type) && <label>{t('fileUrl')}<input value={form.file_url} onChange={(event) => updateField('file_url', event.target.value)} /></label>}
                    {form.type === 'audio' && (
                      <>
                        <label>{t('audioUrl')}<input value={form.file_url} onChange={(event) => updateField('file_url', event.target.value)} /></label>
                        <label>{t('audioDuration')}<input value={form.audio_duration} onChange={(event) => updateField('audio_duration', event.target.value)} /></label>
                      </>
                    )}
                  </div>
                </DetailSection>

                <DetailSection id="notesQuotes" title={t('notesAndQuotes')}>
                  <label>{t('notes')}<textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></label>
                  <label>{t('favoriteQuote')}<textarea value={form.favorite_quote} onChange={(event) => updateField('favorite_quote', event.target.value)} /></label>
                </DetailSection>

                <DetailSection id="tagSection" title={t('tags')}>
                  <div className="tagPicker">
                    {!selectedTags.length && <p className="hint">{t('tagsHelper')}</p>}
                    <input className="tagSearch" value={tagSearch} onChange={(event) => setTagSearch(event.target.value)} placeholder={t('searchTags')} />
                    <div className="inlineAdd compactInlineAdd">
                      <input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder={t('newTagPlaceholder')} />
                      <button className="secondaryButton" type="button" onClick={addTag}><Plus size={17} /> {t('addTag')}</button>
                    </div>
                    <span className="subtleLabel">{t('suggestedTags')}</span>
                    <div className="chips compactChips">
                      {orderedTags.map((tag) => (
                        <button key={tag.id} type="button" className={form.tagIds.includes(tag.id) ? 'chip active' : 'chip'} onClick={() => toggleTag(tag.id)}>
                          {safeLocalizedName(tag, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                </DetailSection>
              </div>
            )}

            <div className="modalActions stickyActions">
              <button className="secondaryButton" type="button" onClick={onClose}>{t('cancel')}</button>
              <button className="primaryButton" type="submit" disabled={!canSave || !hasValidDates || !hasValidIsbn}><Check size={18} /> {t('saveBook')}</button>
              <button className="secondaryButton" type="button" onClick={saveAndAddAnother} disabled={!canSave || !hasValidDates || !hasValidIsbn}>
                <Plus size={18} /> {t('saveAndAddAnother')}
              </button>
            </div>
            {!canSave && <p className="hint saveHint">{t('requiredBookFields')}</p>}
            {canSave && !hasValidDates && <p className="error saveHint">{t('invalidDateTime')}</p>}
            {canSave && hasValidDates && !hasValidIsbn && <p className="error saveHint">{t('invalidIsbn')}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

function BookCard({ book, language, onSelect, categories }) {
  const { t } = useTranslation();
  const category = getCategory(categories, book.category_id);
  const subcategory = getSubcategory(categories, book.category_id, book.subcategory_id);
  const sessionMinutes = book.reading_sessions.reduce((sum, item) => sum + item.duration_minutes, 0);

  return (
    <button className="bookCard" type="button" onClick={() => onSelect(book)}>
      <div className="cover">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" />
        ) : (
          <CoverPlaceholder
            title={book.title}
            author={book.author}
            label={t('addCover')}
            fallbackTitle={t('appName')}
            compact
          />
        )}
      </div>
      <div className="bookInfo">
        <div className="bookCardTop">
          <h3 className={isMostlyLatin(book.title) ? 'latinText' : ''} dir={isMostlyLatin(book.title) ? 'ltr' : undefined}>{book.title}</h3>
          <p className={isMostlyLatin(book.author) ? 'latinText' : ''} dir={isMostlyLatin(book.author) ? 'ltr' : undefined}>{book.author}</p>
        </div>
        <div className="bookCardMiddle">
          <span>{safeLocalizedName(category, language)}</span>
          <span>{safeLocalizedName(subcategory, language)}</span>
          <span>{optionLabel(readingStatuses, book.status, t)}</span>
          {book.needs_review && <span>{t('needsReview')}</span>}
        </div>
        <div className="bookCardBottom">
          {book.status === 'completed' ? <RatingStars value={book.rating} disabled /> : <span>{t('unrated')}</span>}
          <span>{formatMinutes(sessionMinutes)}</span>
          <span>{optionLabel(bookTypes, book.type, t)}</span>
        </div>
      </div>
    </button>
  );
}

function DetailsPanel({ book, language, timeFormat, onClose, onStatusChange, onToggleReadingSession, onFeatureMessage, categories, tags, mode = 'panel' }) {
  const { t } = useTranslation();
  if (!book) return null;
  const category = getCategory(categories, book.category_id);
  const subcategory = getSubcategory(categories, book.category_id, book.subcategory_id);
  const selectedTags = tags.filter((tag) => book.tags.includes(tag.id));
  const minutes = book.reading_sessions.reduce((sum, item) => sum + item.duration_minutes, 0);
  const average = book.reading_sessions.length ? Math.round(minutes / book.reading_sessions.length) : 0;
  const last = book.reading_sessions.at(-1);
  const activeSession = getActiveSession(book);

  return (
    <aside className={mode === 'page' ? 'detailsPanel bookDetailsPage' : 'detailsPanel'}>
      <div className="detailsHeader">
        <button className="iconButton" type="button" onClick={onClose} title={t('cancel')}>
          {mode === 'page' ? <ArrowRight size={20} /> : <X size={20} />}
        </button>
        <h2>{mode === 'page' ? book.title : t('details')}</h2>
      </div>
      <div className="detailCover">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" />
        ) : (
          <CoverPlaceholder title={book.title} author={book.author} label={t('addCover')} fallbackTitle={t('appName')} />
        )}
      </div>
      <h3>{book.title}</h3>
      <p className="muted">{book.author}</p>
      {book.translator && <p>{t('translator')}: {book.translator}</p>}
      <div className="detailActions">
        <button className="secondaryButton" type="button" onClick={() => onFeatureMessage?.(t('editSoonMessage'))}>{t('edit')}</button>
        <button className="secondaryButton" type="button" onClick={() => onToggleReadingSession(book.id)}>
          {activeSession ? t('endSession') : t('startSession')}
        </button>
        {book.file_url && (
          <button className="secondaryButton" type="button" onClick={() => onFeatureMessage?.(t('openFileHint'))}>
            {t('openFile')}
          </button>
        )}
      </div>
      <label className="statusSelect">
        {t('readingStatus')}
        <select value={book.status} onChange={(event) => onStatusChange(book.id, event.target.value)}>
          {readingStatuses.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}
        </select>
      </label>
      {book.status === 'completed' && <RatingStars value={book.rating} disabled />}
      <dl className="detailList">
        <dt>{t('isbn10')}</dt><dd>{book.isbn_10 || '-'}</dd>
        <dt>{t('isbn13')}</dt><dd>{book.isbn_13 || '-'}</dd>
        <dt>{t('bookType')}</dt><dd>{optionLabel(bookTypes, book.type, t)}</dd>
        <dt>{t('mainCategory')}</dt><dd>{safeLocalizedName(category, language)}</dd>
        <dt>{t('subcategory')}</dt><dd>{safeLocalizedName(subcategory, language)}</dd>
        <dt>{book.type === 'paper' ? t('shelfLocation') : t('fileUrl')}</dt><dd>{book.shelf_location || book.file_url || '-'}</dd>
        <dt>{t('startedAt')}</dt><dd>{formatDateTime(book.started_at, language, timeFormat)}</dd>
        <dt>{t('finishedAt')}</dt><dd>{formatDateTime(book.finished_at, language, timeFormat)}</dd>
        <dt>{t('addedAt')}</dt><dd>{formatDateTime(book.created_at, language, timeFormat)}</dd>
      </dl>
      <section>
        <h4>{t('tags')}</h4>
        <div className="chips">{selectedTags.map((tag) => <span className="chip" key={tag.id}>{safeLocalizedName(tag, language)}</span>)}</div>
      </section>
      <section>
        <h4>{t('readingSessions')}</h4>
        <div className="metricsCompact">
          <span>{t('totalReadingTime')}: {formatMinutes(minutes)}</span>
          <span>{t('sessionsCount')}: {book.reading_sessions.length}</span>
          <span>{t('averageSession')}: {formatMinutes(average)}</span>
          <span>{t('lastSession')}: {formatDateTime(last?.ended_at || last?.started_at, language, timeFormat)}</span>
          {activeSession && <span>{t('activeSession')}: {formatDateTime(activeSession.started_at, language, timeFormat)}</span>}
        </div>
      </section>
      <section>
        <h4>{t('notes')}</h4>
        <p className="muted">{book.notes || '-'}</p>
      </section>
      <section>
        <h4>{t('favoriteQuote')}</h4>
        <p className="quote">{book.favorite_quote || '-'}</p>
      </section>
      <section>
        <h4>{t('bookImpact')}</h4>
        <div className="impactQuestions">
          {['impactQuestion1', 'impactQuestion2', 'impactQuestion3', 'impactQuestion4', 'impactQuestion5', 'impactQuestion6'].map((key) => (
            <span key={key}>{t(key)}</span>
          ))}
        </div>
      </section>
    </aside>
  );
}

function ProfileDialog({ settings, stats, language, timeFormat, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal compactModal">
        <div className="modalHeader">
          <div>
            <h2>{t('profile')}</h2>
            <p>{t('profileHint')}</p>
          </div>
          <button className="iconButton" type="button" onClick={onClose} title={t('cancel')}>
            <X size={20} />
          </button>
        </div>
        <div className="profileHero">
          <span className="profileAvatar"><User size={34} /></span>
          <div>
            <h3>{settings.displayName || t('guestUser')}</h3>
            <p>{settings.libraryDescription || t('personalLibrary')}</p>
          </div>
        </div>
        <div className="profileStats">
          <div><strong>{stats.total}</strong><span>{t('books')}</span></div>
          <div><strong>{stats.completed}</strong><span>{t('booksRead')}</span></div>
          <div><strong>{stats.reading}</strong><span>{t('currentlyReading')}</span></div>
          <div><strong>{formatMinutes(stats.minutes)}</strong><span>{t('totalReadingTime')}</span></div>
          <div><strong>{stats.averageRating || t('unrated')}</strong><span>{t('averageRating')}</span></div>
          <div><strong>{formatDateTime(stats.lastAdded, language, timeFormat)}</strong><span>{t('lastBookAdded')}</span></div>
        </div>
      </div>
    </div>
  );
}

function SettingsDialog({
  settings,
  categories,
  onClose,
  onSave,
  onExportBackup,
  onImportBackup,
  onClearLocalData
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(settings);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal settingsModal">
        <div className="modalHeader">
          <div>
            <h2>{t('accountSettings')}</h2>
            <p>{t('settingsHint')}</p>
          </div>
          <button className="iconButton" type="button" onClick={onClose} title={t('cancel')}>
            <X size={20} />
          </button>
        </div>
        <form className="bookForm" onSubmit={submit}>
          <section className="formSection settingsSection">
            <div className="formSectionHeader staticHeader">{t('accountData')}</div>
            <div className="formSectionBody formGrid">
              <label>{t('displayName')}<input value={draft.displayName} onChange={(event) => update('displayName', event.target.value)} /></label>
              <label>{t('libraryDescription')}<input value={draft.libraryDescription} onChange={(event) => update('libraryDescription', event.target.value)} /></label>
              <label>
                {t('languagePreference')}
                <select value={draft.language} onChange={(event) => update('language', event.target.value)}>
                  <option value="ar">{t('arabic')}</option>
                  <option value="en">{t('english')}</option>
                </select>
              </label>
              <label>
                {t('themePreference')}
                <select value={draft.themePreference} onChange={(event) => update('themePreference', event.target.value)}>
                  <option value="light">{t('lightTheme')}</option>
                  <option value="dark">{t('darkTheme')}</option>
                  <option value="system">{t('systemTheme')}</option>
                </select>
              </label>
              <label>
                {t('timeFormat')}
                <select value={draft.timeFormat || '12'} onChange={(event) => update('timeFormat', event.target.value)}>
                  <option value="12">{t('timeFormat12')}</option>
                  <option value="24">{t('timeFormat24')}</option>
                </select>
              </label>
            </div>
          </section>

          <section className="formSection settingsSection">
            <div className="formSectionHeader staticHeader">{t('libraryPreferences')}</div>
            <div className="formSectionBody formGrid">
              <label>
                {t('defaultView')}
                <select value={draft.defaultView} onChange={(event) => update('defaultView', event.target.value)}>
                  <option value="summary">{t('summaryView')}</option>
                  <option value="covers">{t('coversView')}</option>
                  <option value="list">{t('listView')}</option>
                </select>
              </label>
              <label>
                {t('defaultCategory')}
                <select value={draft.defaultCategoryId} onChange={(event) => update('defaultCategoryId', event.target.value)}>
                  <option value="">{t('firstCategoryDefault')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name_ar || category.name_en}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('defaultBookType')}
                <select value={draft.defaultBookType} onChange={(event) => update('defaultBookType', event.target.value)}>
                  {bookTypes.filter((type) => ['paper', 'pdf', 'epub', 'external'].includes(type.id)).map((type) => (
                    <option key={type.id} value={type.id}>{t(type.labelKey)}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="formSection settingsSection">
            <div className="formSectionHeader staticHeader">{t('dataSafety')}</div>
            <div className="formSectionBody">
              <div className="settingsActions">
                <button className="secondaryButton" type="button" onClick={onExportBackup}>
                  <Download size={17} /> {t('exportBackupJson')}
                </button>
                <label className="smallUploadButton">
                  <Download size={17} /> {t('importBackupJson')}
                  <input type="file" accept="application/json,.json" onChange={onImportBackup} />
                </label>
                <button className="dangerButton" type="button" onClick={onClearLocalData}>
                  {t('clearLocalLibraryData')}
                </button>
              </div>
              <p className="hint">{t('dataSafetyHint')}</p>
            </div>
          </section>

          <div className="modalActions stickyActions">
            <button className="secondaryButton" type="button" onClick={onClose}>{t('cancel')}</button>
            <button className="primaryButton" type="submit"><Check size={18} /> {t('saveSettings')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const accountMenuRef = useRef(null);
  const [userSettings, setUserSettings] = useState(() => {
    const legacySettings = typeof localStorage === 'undefined'
      ? {}
      : {
          language: localStorage.getItem('maktabati.language') || defaultUserSettings.language,
          themePreference: localStorage.getItem('maktabati.theme') || defaultUserSettings.themePreference
        };
    return {
      ...defaultUserSettings,
      ...legacySettings,
      ...readStoredJson(USER_SETTINGS_STORAGE_KEY, {})
    };
  });
  const [language, setLanguage] = useState(() =>
    typeof localStorage === 'undefined'
      ? userSettings.language || i18n.language || 'ar'
      : userSettings.language || localStorage.getItem('maktabati.language') || i18n.language || 'ar'
  );
  const [theme, setTheme] = useState(() =>
    typeof localStorage === 'undefined'
      ? resolveThemePreference(userSettings.themePreference)
      : resolveThemePreference(userSettings.themePreference || localStorage.getItem('maktabati.theme') || 'light')
  );
  const [books, setBooks] = useState(() => readStoredJson(BOOKS_STORAGE_KEY, sampleBooks));
  const [categories, setCategories] = useState(() => readStoredJson(CATEGORIES_STORAGE_KEY, initialCategories));
  const [tags, setTags] = useState(() => readStoredJson(TAGS_STORAGE_KEY, initialTags));
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
    flag: 'all',
    rating: 'all',
    translation: 'all'
  });
  const [viewMode, setViewMode] = useState(userSettings.defaultView || 'summary');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [importType, setImportType] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSmartShelves, setShowSmartShelves] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [soonMessage, setSoonMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [activePage, setActivePage] = useState('library');

  useEffect(() => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('maktabati.language', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('maktabati.theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
  }, [tags]);

  const selectedBook = books.find((book) => book.id === selectedBookId);

  const filteredBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return books.filter((book) => {
      const text = [
        book.title,
        book.author,
        book.translator,
        book.isbn_10,
        book.isbn_13,
        book.notes,
        book.favorite_quote,
        ...book.quotes.map((quote) => quote.quote_text)
      ].join(' ').toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (filters.type !== 'all' && book.type !== filters.type) return false;
      if (filters.category !== 'all' && book.category_id !== Number(filters.category)) return false;
      if (filters.status !== 'all' && book.status !== filters.status) return false;
      if (filters.flag === 'paperOnly' && book.type !== 'paper') return false;
      if (filters.flag === 'digitalOnly' && !digitalTypes.includes(book.type)) return false;
      if (filters.flag === 'audioOnly' && book.type !== 'audio') return false;
      if (filters.flag === 'completedOnly' && book.status !== 'completed') return false;
      if (filters.flag === 'unreadOnly' && !['not_started', 'want_to_read'].includes(book.status)) return false;
      if (filters.flag === 'hasTranslator' && !book.translator) return false;
      if (filters.flag === 'missingIsbn' && (book.isbn_10 || book.isbn_13)) return false;
      if (filters.flag === 'missingCover' && book.cover_url) return false;
      if (filters.flag === 'needsReview' && !book.needs_review) return false;
      if (filters.rating === 'unrated' && book.rating) return false;
      if (!['all', 'unrated'].includes(filters.rating) && Number(book.rating) !== Number(filters.rating)) return false;
      if (filters.translation === 'translated' && !book.translator) return false;
      if (filters.translation === 'notTranslated' && book.translator) return false;
      return true;
    });
  }, [books, filters, query]);

  const analytics = useMemo(() => {
    const completed = books.filter((book) => book.status === 'completed');
    const minutes = books.flatMap((book) => book.reading_sessions).reduce((sum, item) => sum + item.duration_minutes, 0);
    return {
      total: books.length,
      completed: completed.length,
      hours: Math.round(minutes / 60),
      completion: books.length ? Math.round((completed.length / books.length) * 100) : 0
    };
  }, [books]);

  const profileStats = useMemo(() => {
    const completed = books.filter((book) => book.status === 'completed');
    const rated = completed.filter((book) => Number(book.rating) > 0);
    const minutes = books.flatMap((book) => book.reading_sessions || []).reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0);
    const datedBooks = books
      .filter((book) => book.created_at && !Number.isNaN(new Date(book.created_at).getTime()))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return {
      total: books.length,
      completed: completed.length,
      reading: books.filter((book) => book.status === 'reading').length,
      minutes,
      averageRating: rated.length
        ? (rated.reduce((sum, book) => sum + Number(book.rating), 0) / rated.length).toFixed(1)
        : '',
      lastAdded: datedBooks[0]?.created_at || ''
    };
  }, [books]);

  const smartShelfValue = useMemo(() => {
    if (filters.status === 'not_started') return 'notStarted';
    if (filters.status === 'reading') return 'reading';
    if (filters.status === 'completed') return 'completed';
    if (['missingCover', 'missingIsbn', 'needsReview'].includes(filters.flag)) return filters.flag;
    return 'all';
  }, [filters.flag, filters.status]);

  function applySmartShelf(value) {
    const statusMap = {
      notStarted: 'not_started',
      reading: 'reading',
      completed: 'completed'
    };

    if (value === 'all') {
      setFilters((current) => ({ ...current, status: 'all', flag: 'all' }));
      return;
    }

    if (statusMap[value]) {
      setFilters((current) => ({ ...current, status: statusMap[value], flag: 'all' }));
      return;
    }

    setFilters((current) => ({ ...current, status: 'all', flag: value }));
  }

  function saveBook(book, options = {}) {
    setBooks((current) => [book, ...current]);
    if (options.keepOpen) return;
    setSelectedBookId(book.id);
    setActivePage('details');
  }

  function importBooks(importedBooks) {
    setBooks((current) => [...importedBooks, ...current]);
    if (importedBooks[0]) {
      setSelectedBookId(importedBooks[0].id);
      setActivePage('details');
    }
  }

  function openBookDetails(book) {
    setSelectedBookId(book.id);
    setActivePage('details');
  }

  function addMainCategory(name) {
    const nextId = Math.max(...categories.map((category) => category.id)) + 1;
    const nextCategory = {
      id: nextId,
      name_ar: name,
      name_en: name,
      sort_order: nextId,
      subcategories: [
        {
          id: nextId * 100 + 1,
          category_id: nextId,
          name_ar: 'غير مصنّف',
          name_en: 'Uncategorized',
          sort_order: 1
        }
      ]
    };
    setCategories((current) => [...current, nextCategory]);
    return nextCategory;
  }

  function addSubcategory(categoryId, name) {
    const category = categories.find((item) => item.id === Number(categoryId));
    if (!category) return null;
    const maxSubcategoryId = Math.max(...category.subcategories.map((item) => item.id), category.id * 100);
    const nextSubcategory = {
      id: maxSubcategoryId + 1,
      category_id: category.id,
      name_ar: name,
      name_en: name,
      sort_order: category.subcategories.length + 1
    };
    setCategories((current) =>
      current.map((item) =>
        item.id === category.id
          ? { ...item, subcategories: [...item.subcategories, nextSubcategory] }
          : item
      )
    );
    return nextSubcategory;
  }

  function addTag(name) {
    const nextId = Math.max(...tags.map((tag) => tag.id), 0) + 1;
    const nextTag = {
      id: nextId,
      name_ar: name,
      name_en: name,
      group_ar: 'وسوم مخصصة',
      group_en: 'Custom'
    };
    setTags((current) => [...current, nextTag]);
    return nextTag;
  }

  function changeStatus(bookId, status) {
    setBooks((current) => current.map((book) => {
      if (book.id !== bookId) return book;
      const date = nowLocal();
      const next = {
        ...book,
        status,
        status_history: [...book.status_history, { status, datetime: date }]
      };
      if (status === 'reading' && !next.started_at) next.started_at = date;
      if (status === 'completed' && !next.finished_at) {
        next.finished_at = date;
        next.rating = next.rating || 5;
      }
      if (status !== 'completed') next.rating = 0;
      return next;
    }));
  }

  function toggleReadingSession(bookId) {
    setBooks((current) => current.map((book) => {
      if (book.id !== bookId) return book;
      const activeSession = getActiveSession(book);
      const date = nowLocal();

      if (activeSession) {
        const sessions = book.reading_sessions.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                ended_at: date,
                duration_minutes: minutesBetween(session.started_at, date)
              }
            : session
        );
        return { ...book, reading_sessions: sessions };
      }

      return {
        ...book,
        status: book.status === 'not_started' || book.status === 'want_to_read' ? 'reading' : book.status,
        started_at: book.started_at || date,
        reading_sessions: [
          ...book.reading_sessions,
          {
            id: crypto.randomUUID(),
            started_at: date,
            ended_at: '',
            duration_minutes: 0
          }
        ],
        status_history:
          book.status === 'not_started' || book.status === 'want_to_read'
            ? [...book.status_history, { status: 'reading', datetime: date }]
            : book.status_history
      };
    }));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maktabati-books.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportBackupJson() {
    const backup = {
      version: 1,
      exported_at: new Date().toISOString(),
      books,
      categories,
      tags,
      settings: userSettings
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maktabati-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackupJson(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const nextBooks = Array.isArray(parsed) ? parsed : parsed.books;
        if (!Array.isArray(nextBooks)) {
          setToastMessage(t('invalidBackupFile'));
          return;
        }
        if (!window.confirm(t('importBackupConfirm'))) return;
        setBooks(nextBooks);
        if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
        if (Array.isArray(parsed.tags)) setTags(parsed.tags);
        if (parsed.settings) {
          const nextSettings = { ...defaultUserSettings, ...parsed.settings };
          setUserSettings(nextSettings);
          setLanguage(nextSettings.language);
          setTheme(resolveThemePreference(nextSettings.themePreference));
          setViewMode(nextSettings.defaultView || 'summary');
        }
        setToastMessage(t('backupImported'));
      } catch {
        setToastMessage(t('invalidBackupFile'));
      }
    };
    reader.readAsText(file);
  }

  function saveSettings(nextSettings) {
    const normalized = {
      ...defaultUserSettings,
      ...nextSettings,
      displayName: nextSettings.displayName.trim() || defaultUserSettings.displayName,
      libraryDescription: nextSettings.libraryDescription.trim() || defaultUserSettings.libraryDescription,
      timeFormat: nextSettings.timeFormat === '24' ? '24' : '12'
    };
    setUserSettings(normalized);
    setLanguage(normalized.language);
    setTheme(resolveThemePreference(normalized.themePreference));
    setViewMode(normalized.defaultView || 'summary');
    setShowSettings(false);
    setToastMessage(t('settingsSaved'));
  }

  function clearLocalData() {
    if (!window.confirm(t('clearLocalDataConfirm'))) return;
    setBooks([]);
    setSelectedBookId(null);
    setActivePage('library');
    setToastMessage(t('localDataCleared'));
  }

  function logoutLocalSession() {
    if (!window.confirm(t('logoutConfirm'))) return;
    localStorage.setItem(USER_SESSION_STORAGE_KEY, 'logged-out');
    setShowAccountMenu(false);
    setToastMessage(t('logoutDone'));
  }

  function exportCsv() {
    const header = ['title', 'author', 'translator', 'isbn_13', 'type', 'status', 'rating'];
    const rows = books.map((book) => header.map((key) => `"${String(book[key] ?? '').replaceAll('"', '""')}"`).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maktabati-books.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brand">
          <LogoMark />
          <div>
            <h1>{t('appName')}</h1>
            <p>{t('tagline')}</p>
          </div>
        </div>
        <div className="topActions">
          <div className="accountMenu" ref={accountMenuRef}>
            <button
              className="accountButton"
              type="button"
              onClick={() => setShowAccountMenu((value) => !value)}
              aria-expanded={showAccountMenu}
            >
              <span className="accountAvatar"><User size={17} /></span>
              <span className="accountLabel">{userSettings.displayName || t('account')}</span>
              <ChevronDown size={16} />
            </button>
            {showAccountMenu && (
              <div className="accountDropdown">
                <strong>{userSettings.displayName || t('guestUser')}</strong>
                <span>{userSettings.libraryDescription || t('personalLibrary')}</span>
                <button type="button" onClick={() => { setShowProfile(true); setShowAccountMenu(false); }}>{t('profile')}</button>
                <button type="button" onClick={() => { setShowSettings(true); setShowAccountMenu(false); }}>{t('accountSettings')}</button>
                <button type="button" onClick={logoutLocalSession}>{t('logout')}</button>
              </div>
            )}
          </div>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              setUserSettings((current) => ({ ...current, themePreference: nextTheme }));
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? t('lightMode') : t('darkMode')}
          </button>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              const nextLanguage = language === 'ar' ? 'en' : 'ar';
              setLanguage(nextLanguage);
              setUserSettings((current) => ({ ...current, language: nextLanguage }));
            }}
          >
            <Globe2 size={18} /> {language === 'ar' ? t('english') : t('arabic')}
          </button>
          <div className="addBookMenu">
            <button className="primaryButton" type="button" onClick={() => setShowAddMenu((value) => !value)} aria-expanded={showAddMenu}>
              <Plus size={19} /> {t('addBook')}
            </button>
            {showAddMenu && (
              <div className="addBookDropdown">
                <button type="button" onClick={() => { setShowAdd(true); setShowAddMenu(false); }}>
                  <FileText size={16} /> {t('manualAddBook')}
                </button>
                <button type="button" onClick={() => { setImportType('csv'); setShowAddMenu(false); }}>
                  <Download size={16} /> {t('importCsv')}
                </button>
                <button type="button" onClick={() => { setImportType('json'); setShowAddMenu(false); }}>
                  <Download size={16} /> {t('importJson')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {toastMessage && (
        <div className="toastNotice">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')}><X size={15} /></button>
        </div>
      )}

      <main className={activePage === 'library' && !selectedBook ? 'layout noDetailsLayout' : 'layout'}>
        <section className="mainColumn">
          {activePage === 'details' && selectedBook ? (
            <DetailsPanel
              book={selectedBook}
              language={language}
              timeFormat={userSettings.timeFormat}
              categories={categories}
              tags={tags}
              mode="page"
              onClose={() => setActivePage('library')}
              onStatusChange={changeStatus}
              onToggleReadingSession={toggleReadingSession}
              onFeatureMessage={setSoonMessage}
            />
          ) : (
            <>
              <nav className="tabs">
                <button className="active"><BookOpen size={18} /> {t('library')}</button>
                <button className="comingSoonTab" type="button" onClick={() => setSoonMessage(t('smartShelvesSoonMessage'))}>
                  <ListChecks size={18} /> {t('smartShelves')} <span>{t('comingSoon')}</span>
                </button>
                <button type="button" onClick={() => setSoonMessage(t('analyticsSoonMessage'))}><Clock3 size={18} /> {t('analytics')}</button>
                <button className="comingSoonTab" type="button" onClick={() => setSoonMessage(t('knowledgeMapSoonMessage'))}>
                  <Map size={18} /> {t('knowledgeMap')} <span>{t('comingSoon')}</span>
                </button>
              </nav>
              {soonMessage && (
                <div className="soonNotice">
                  <span>{soonMessage}</span>
                  <button type="button" onClick={() => setSoonMessage('')}><X size={15} /></button>
                </div>
              )}

              <section className="summaryGrid">
                <div><strong>{analytics.total}</strong><span>{t('books')}</span></div>
                <div><strong>{analytics.completed}</strong><span>{t('booksRead')}</span></div>
                <div><strong>{analytics.hours}</strong><span>{t('hoursRead')}</span></div>
                <div><strong>{analytics.completion}%</strong><span>{t('completionRate')}</span></div>
              </section>

              <section className="toolbar">
                <div className="searchBox">
                  <Search size={18} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} />
                </div>
                <div className="viewToggle" aria-label={t('displayMode')}>
                  {[
                    ['summary', Rows3, 'summaryView'],
                    ['covers', Images, 'coversView'],
                    ['list', ListChecks, 'listView']
                  ].map(([mode, Icon, label]) => (
                    <button
                      key={mode}
                      className={viewMode === mode ? 'active' : ''}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      title={t(label)}
                    >
                      <Icon size={17} />
                      <span>{t(label)}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="exportBar">
                <div className="exportMenu">
                  <button className="secondaryButton" type="button" onClick={() => setShowExportMenu((value) => !value)}>
                    <Download size={18} /> {t('export')} <ChevronDown size={15} />
                  </button>
                  {showExportMenu && (
                    <div className="exportDropdown">
                      <button type="button" onClick={() => { exportCsv(); setShowExportMenu(false); }}>{t('exportCsv')}</button>
                      <button type="button" onClick={() => { exportJson(); setShowExportMenu(false); }}>{t('exportJson')}</button>
                    </div>
                  )}
                </div>
              </section>

              <section className="filters">
                <span><Filter size={17} /> {t('filters')}</span>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="all">{t('readingStatus')}: {t('all')}</option>
                  {readingStatuses.map((status) => <option key={status.id} value={status.id}>{t(status.labelKey)}</option>)}
                </select>
                <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
                  <option value="all">{t('mainCategory')}: {t('all')}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{safeLocalizedName(category, language)}</option>)}
                </select>
                <select value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}>
                  <option value="all">{t('rating')}: {t('all')}</option>
                  <option value="unrated">{t('unrated')}</option>
                  <option value="1">{t('oneStar')}</option>
                  <option value="2">{t('twoStars')}</option>
                  <option value="3">{t('threeStars')}</option>
                  <option value="4">{t('fourStars')}</option>
                  <option value="5">{t('fiveStars')}</option>
                </select>
                <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                  <option value="all">{t('bookType')}: {t('all')}</option>
                  {bookTypes.map((type) => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                </select>
                <select value={filters.translation} onChange={(event) => setFilters({ ...filters, translation: event.target.value })}>
                  <option value="all">{t('translation')}: {t('all')}</option>
                  <option value="translated">{t('translated')}</option>
                  <option value="notTranslated">{t('notTranslated')}</option>
                </select>
              </section>

              <section className="smartShelfCompact">
                <button className="secondaryButton smartShelfToggle" type="button" onClick={() => setShowSmartShelves((value) => !value)}>
                  <ListChecks size={16} /> {t('smartShelves')}
                  <ChevronDown size={15} />
                </button>
                {showSmartShelves && (
                  <div className="smartShelfDropdown">
                    {['all', 'notStarted', 'reading', 'completed', 'missingCover', 'missingIsbn', 'needsReview'].map((key) => (
                      <button
                        key={key}
                        className={smartShelfValue === key ? 'active' : ''}
                        type="button"
                        onClick={() => { applySmartShelf(key); setShowSmartShelves(false); }}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className={`bookGrid view-${viewMode}`}>
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} language={language} categories={categories} onSelect={openBookDetails} />
                ))}
                {!filteredBooks.length && <div className="emptyState">{t('noBooks')}</div>}
              </section>

              <section className="comingSoonStrip">
                <button type="button" onClick={() => setSoonMessage(t('knowledgeMapSoonMessage'))}>
                  {t('knowledgeMap')} <span>{t('comingSoon')}</span>
                </button>
                <button type="button" onClick={() => setSoonMessage(t('smartShelvesSoonMessage'))}>
                  {t('smartShelves')} <span>{t('comingSoon')}</span>
                </button>
              </section>
            </>
          )}
        </section>

        {activePage === 'library' && (
          <DetailsPanel
            book={selectedBook}
            language={language}
            timeFormat={userSettings.timeFormat}
            categories={categories}
            tags={tags}
            onClose={() => setSelectedBookId(null)}
            onStatusChange={changeStatus}
            onToggleReadingSession={toggleReadingSession}
            onFeatureMessage={setSoonMessage}
          />
        )}
      </main>

      {showAdd && (
        <AddBookModal
          onClose={() => setShowAdd(false)}
          onSave={saveBook}
          language={language}
          timeFormat={userSettings.timeFormat}
          categories={categories}
          tags={tags}
          onAddCategory={addMainCategory}
          onAddSubcategory={addSubcategory}
          onAddTag={addTag}
          defaultCategoryId={userSettings.defaultCategoryId}
          defaultBookType={userSettings.defaultBookType}
        />
      )}
      {showProfile && (
        <ProfileDialog
          settings={userSettings}
          stats={profileStats}
          language={language}
          timeFormat={userSettings.timeFormat}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showSettings && (
        <SettingsDialog
          settings={userSettings}
          categories={categories}
          onClose={() => setShowSettings(false)}
          onSave={saveSettings}
          onExportBackup={exportBackupJson}
          onImportBackup={importBackupJson}
          onClearLocalData={clearLocalData}
        />
      )}
      {importType && (
        <ImportBooksDialog
          type={importType}
          books={books}
          categories={categories}
          language={language}
          onClose={() => setImportType('')}
          onImport={importBooks}
        />
      )}
    </div>
  );
}

export default App;
