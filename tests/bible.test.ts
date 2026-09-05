import { biblia } from '../src/bible';
import { BOOKS } from '../src/books';
import { isBibliaError } from '../src/errors';
import { TRANSLATIONS, TRANSLATION_IDS } from '../src/translations';
import type { TranslationId } from '../src/types';
import * as api from '../src/index';

/** An id no release will ever register, so this stays true as translations are added. */
const UNREGISTERED = 'NINCSILYEN' as TranslationId;

describe('biblia', () => {
  it('rejects a translation that is not registered', () => {
    expect(() => biblia(UNREGISTERED)).toThrow(/NINCSILYEN/);

    try {
      biblia(UNREGISTERED);
    } catch (error) {
      expect(isBibliaError(error)).toBe(true);
      expect((error as { code: string }).code).toBe('UNKNOWN_TRANSLATION');
    }
  });

  it('lists the available translations when the id is not registered', () => {
    expect(() => biblia(UNREGISTERED)).toThrow(new RegExp(TRANSLATION_IDS.join(', ')));
  });

  it('accepts a data base url override', () => {
    expect(() => biblia('RUF', { dataBaseUrl: 'https://example.invalid' })).not.toThrow();
  });

  it('is exported from the package entry point together with the rest of the surface', () => {
    expect(api.biblia).toBe(biblia);
    expect(api.BibliaError).toBeDefined();
    expect(api.TRANSLATIONS).toBeDefined();
    expect(api.TRANSLATION_IDS).toBeDefined();
    expect(api.BOOKS).toHaveLength(66);
    expect(typeof api.findBook).toBe('function');
    expect(typeof api.parseReference).toBe('function');
    expect(typeof api.formatReference).toBe('function');
    expect(typeof api.normalizeKey).toBe('function');
  });
});

describe.each(TRANSLATION_IDS)('Bible instance (%s)', (translationId) => {
  const bible = biblia(translationId);

  it('exposes the translation it was created for', () => {
    expect(bible.translation).toBe(TRANSLATIONS[translationId]);
  });

  it('lists all 66 books with this translation names', () => {
    const books = bible.getBooks();

    expect(books).toHaveLength(66);
    expect(books.map((book) => book.id)).toEqual(BOOKS.map((book) => book.id));
    for (const book of books) {
      expect(book.name).toBe(bible.translation.bookNames[book.id]);
    }
  });

  it('splits the canon into 39 and 27 books', () => {
    const old = bible.getOldTestamentBooks();
    const current = bible.getNewTestamentBooks();

    expect(old).toHaveLength(39);
    expect(current).toHaveLength(27);
    expect(old[0].id).toBe('GEN');
    expect(current[0].id).toBe('MAT');
    expect(current[26].id).toBe('REV');
  });

  it('returns copies, so a caller cannot corrupt the tables', () => {
    const first = bible.getBooks();
    first[0].name = 'megváltoztatva';
    first[0].aliases.push('hamis');

    const second = bible.getBooks();
    expect(second[0].name).toBe(bible.translation.bookNames.GEN);
    expect(second[0].aliases).not.toContain('hamis');
  });

  it('finds a book by id, abbreviation, alias and this translation name', () => {
    const byId = bible.findBook('JHN');

    expect(byId?.id).toBe('JHN');
    expect(bible.findBook('Jn')?.id).toBe('JHN');
    expect(bible.findBook('János')?.id).toBe('JHN');
    expect(bible.findBook(bible.translation.bookNames.JHN)?.id).toBe('JHN');
    expect(byId?.name).toBe(bible.translation.bookNames.JHN);
  });

  it('finds a book however it is spaced, dotted or accented', () => {
    expect(bible.findBook('1. Móz')?.id).toBe('GEN');
    expect(bible.findBook('1moz')?.id).toBe('GEN');
    expect(bible.findBook('  jn  ')?.id).toBe('JHN');
  });

  it('returns undefined for a book nobody knows', () => {
    expect(bible.findBook('Nincsilyen')).toBeUndefined();
    expect(bible.findBook('')).toBeUndefined();
  });

  it('survives a caller that passes something other than a string', () => {
    expect(bible.findBook(undefined as unknown as string)).toBeUndefined();
    expect(bible.findBook(42 as unknown as string)).toBeUndefined();
  });

  it('parses references without touching verse data', () => {
    expect(bible.parseReference('Zsolt 139:23-24')).toEqual([
      { book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 },
    ]);
    expect(bible.parseReference('Zsolt 100')).toEqual([{ book: 'PSA', chapter: 100 }]);
  });

  it('keeps two instances of the same translation independent', () => {
    const other = biblia(translationId);

    expect(other).not.toBe(bible);
    expect(other.translation).toBe(bible.translation);
  });

  it('answers every documented method', async () => {
    await expect(bible.getPassage('Jn 3:16')).resolves.toBeDefined();
    await expect(bible.getChapter('Jn', 3)).resolves.toBeDefined();
    await expect(bible.getBookDetails('Jn')).resolves.toBeDefined();
    await expect(bible.search('Isten', { limit: 1 })).resolves.toHaveLength(1);
    await expect(bible.getDailyVerse()).resolves.toBeDefined();
  });
});
