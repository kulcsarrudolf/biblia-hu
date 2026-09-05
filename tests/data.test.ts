import { BOOKS } from '../src/books';
import { validateBookData, validateTranslation } from '../src/data/validate';
import { loadBook, clearCache } from '../src/data/loader';
import { TRANSLATIONS } from '../src/translations';
import type { Translation } from '../src/types';
import { expectedChapterCounts } from './fixtures/chapter-counts';

const RUF = TRANSLATIONS.RUF;
const EXPECTED_COUNTS = expectedChapterCounts('RUF');

/** Total verse count of the RÚF text after the 6 junk verses were dropped. */
const EXPECTED_TOTAL_VERSES = 31170;

describe('bundled RÚF data', () => {
  afterAll(() => {
    clearCache();
  });

  it('validates as a whole', async () => {
    const report = await validateTranslation(RUF, EXPECTED_COUNTS);

    expect(report.errors).toEqual([]);
    expect(report.books).toBe(66);
    expect(report.verses).toBe(EXPECTED_TOTAL_VERSES);
  });

  it.each(BOOKS.map((book) => book.id))('%s has no validation errors', async (bookId) => {
    const data = await loadBook(RUF, bookId);

    expect(validateBookData(data)).toEqual([]);
  });

  it.each(BOOKS.map((book) => [book.id, EXPECTED_COUNTS[book.id]] as const))(
    '%s has %i chapters',
    async (bookId, chapters) => {
      const data = await loadBook(RUF, bookId);

      expect(data).toHaveLength(chapters);
    },
  );

  it('has no empty verse text and no stray whitespace', async () => {
    const offenders: string[] = [];

    for (const book of BOOKS) {
      const data = await loadBook(RUF, book.id);
      for (const chapter of data) {
        for (const verse of chapter.verses) {
          if (verse.text.trim() === '' || verse.text !== verse.text.trim().replace(/\s+/g, ' ')) {
            offenders.push(`${book.id} ${chapter.chapter}:${verse.verse}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('carries a chapter title on every chapter', async () => {
    const untitled: string[] = [];

    for (const book of BOOKS) {
      const data = await loadBook(RUF, book.id);
      for (const chapter of data) {
        if (typeof chapter.title !== 'string' || chapter.title === '') {
          untitled.push(`${book.id} ${chapter.chapter}`);
        }
      }
    }

    expect(untitled).toEqual([]);
  });

  it('keeps the RÚF chapter split of Jóel and Malakiás', async () => {
    await expect(loadBook(RUF, 'JOL')).resolves.toHaveLength(4);
    await expect(loadBook(RUF, 'MAL')).resolves.toHaveLength(3);
  });

  it('titles Genesis 1 "A világ teremtése"', async () => {
    const genesis = await loadBook(RUF, 'GEN');

    expect(genesis[0].title).toBe('A világ teremtése');
  });

  it('reads John 3:16', async () => {
    const john = await loadBook(RUF, 'JHN');
    const verse = john[2].verses[15];

    expect(verse.verse).toBe(16);
    expect(verse.text).toContain('Mert úgy szerette Isten a világot');
  });
});

describe('validateBookData', () => {
  it('rejects a non array root', () => {
    expect(validateBookData({})).toEqual([{ message: 'Root must be an array of chapters' }]);
  });

  it('rejects an empty book', () => {
    expect(validateBookData([])).toEqual([{ message: 'Book has no chapters' }]);
  });

  it('rejects a gap in the chapter numbering', () => {
    const data = [
      { chapter: 1, verses: [{ verse: 1, text: 'a' }] },
      { chapter: 3, verses: [{ verse: 1, text: 'b' }] },
    ];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter at index 1 is numbered 3, expected 2' },
    ]);
  });

  it('rejects a gap in the verse numbering', () => {
    const data = [
      {
        chapter: 1,
        verses: [
          { verse: 1, text: 'a' },
          { verse: 3, text: 'b' },
        ],
      },
    ];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter 1 verse at index 1 is numbered 3, expected 2' },
    ]);
  });

  it('rejects a string verse id', () => {
    const data = [{ chapter: 1, verses: [{ verse: '1', text: 'a' }] }];

    expect(validateBookData(data)).toEqual([
      {
        message: 'Chapter 1, verse index 0 has a missing or non integer "verse" field',
      },
    ]);
  });

  it('rejects empty verse text', () => {
    const data = [{ chapter: 1, verses: [{ verse: 1, text: '   ' }] }];

    expect(validateBookData(data)).toEqual([{ message: 'Chapter 1, verse 1 has empty text' }]);
  });

  it('rejects a non string title', () => {
    const data = [{ chapter: 1, title: 7, verses: [{ verse: 1, text: 'a' }] }];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter 1 has a non string "title" field' },
    ]);
  });

  it('accepts a chapter without a title', () => {
    const data = [{ chapter: 1, verses: [{ verse: 1, text: 'a' }] }];

    expect(validateBookData(data)).toEqual([]);
  });

  it('rejects a chapter with no verses', () => {
    const data = [{ chapter: 1, verses: [] }];

    expect(validateBookData(data)).toEqual([{ message: 'Chapter 1 has no verses' }]);
  });

  it('rejects a chapter that is not an object', () => {
    expect(validateBookData(['nope'])).toEqual([
      { message: 'Chapter at index 0 is not an object' },
    ]);
  });

  it('rejects a missing chapter number', () => {
    const data = [{ verses: [{ verse: 1, text: 'a' }] }];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter at index 0 has a missing or non integer "chapter" field' },
    ]);
  });

  it('rejects verses that are not an array', () => {
    const data = [{ chapter: 1, verses: 'a' }];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter 1 has a missing or non array "verses" field' },
    ]);
  });

  it('rejects a verse that is not an object', () => {
    const data = [{ chapter: 1, verses: ['a'] }];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter 1, verse index 0 is not an object' },
    ]);
  });

  it('rejects a missing verse text', () => {
    const data = [{ chapter: 1, verses: [{ verse: 1 }] }];

    expect(validateBookData(data)).toEqual([
      { message: 'Chapter 1, verse 1 has a missing or non string "text" field' },
    ]);
  });
});

describe('validateTranslation', () => {
  it('reports a chapter count mismatch instead of throwing', async () => {
    const report = await validateTranslation(RUF, { ...EXPECTED_COUNTS, GEN: 49 });

    expect(report.errors).toEqual([{ book: 'GEN', message: 'Has 50 chapters, expected 49' }]);
  });

  it('reports every book that cannot be loaded', async () => {
    const missing: Translation = { ...RUF, dataDir: 'nincs-ilyen-konyvtar' };

    const report = await validateTranslation(missing, EXPECTED_COUNTS, {
      dataBaseUrl: 'http://127.0.0.1:9',
    });

    expect(report.books).toBe(0);
    expect(report.errors).toHaveLength(66);
    expect(report.errors[0].book).toBe('GEN');
  });
});
