import { findBook as findCanonicalBook, normalizeKey } from './books';
import { loadBook, type LoadBookOptions } from './data/loader';
import { BibliaError } from './errors';
import { getTranslation } from './translations';
import type { BibliaOptions, Book, BookId, CanonicalBook, ChapterData, Translation } from './types';

/**
 * Everything the feature modules need to answer a question about one
 * translation: its metadata, book lookup that honours its own book names, and
 * access to its verse data.
 *
 * This is internal. The public surface is the {@link Bible} object built on top
 * of it in `bible.ts`.
 */
export interface BibleContext {
  readonly translation: Translation;
  /** Resolves a book id, abbreviation, alias or this translation's own name. */
  findBook(input: string): Book | undefined;
  /** Same as {@link BibleContext.findBook}, but throws instead of returning undefined. */
  requireBook(input: string): Book;
  /** Attaches this translation's book name to a canonical entry. */
  toBook(book: CanonicalBook | BookId): Book;
  /** Loads one book's chapters through the memoized loader. */
  load(bookId: BookId): Promise<ChapterData[]>;
}

/**
 * Book name index of one translation, built on first use.
 *
 * Keyed by the translation object rather than its id, so the fake translations
 * the test suite builds get their own index instead of poisoning the real one.
 */
const nameIndexes = new WeakMap<Translation, Map<string, BookId>>();

const getNameIndex = (translation: Translation): Map<string, BookId> => {
  let index = nameIndexes.get(translation);
  if (!index) {
    index = new Map();
    for (const [id, name] of Object.entries(translation.bookNames)) {
      index.set(normalizeKey(name), id as BookId);
    }
    nameIndexes.set(translation, index);
  }
  return index;
};

/**
 * Builds the context for one translation.
 *
 * @throws BibliaError with code UNKNOWN_TRANSLATION when the id is not registered.
 */
export const createContext = (translationId: string, options: BibliaOptions = {}): BibleContext => {
  const translation = getTranslation(translationId);
  const loaderOptions: LoadBookOptions = { dataBaseUrl: options.dataBaseUrl };

  const toBook = (book: CanonicalBook | BookId): Book => {
    const canonical = typeof book === 'string' ? findCanonicalBook(book) : book;
    if (!canonical) {
      throw new BibliaError('UNKNOWN_BOOK', `Ismeretlen könyvazonosító: ${JSON.stringify(book)}.`);
    }
    return {
      ...canonical,
      aliases: [...canonical.aliases],
      name: translation.bookNames[canonical.id],
    };
  };

  const findBook = (input: string): Book | undefined => {
    const canonical = findCanonicalBook(input);
    if (canonical) {
      return toBook(canonical);
    }
    if (typeof input !== 'string') {
      return undefined;
    }
    const id = getNameIndex(translation).get(normalizeKey(input));
    return id ? toBook(id) : undefined;
  };

  const requireBook = (input: string): Book => {
    const book = findBook(input);
    if (!book) {
      throw new BibliaError(
        'UNKNOWN_BOOK',
        `Ismeretlen könyv: ${JSON.stringify(String(input))}. Használj kanonikus azonosítót, ` +
          `rövidítést vagy teljes nevet, például 'JHN', 'Jn' vagy 'János evangéliuma'.`,
      );
    }
    return book;
  };

  return {
    translation,
    findBook,
    requireBook,
    toBook,
    load: (bookId: BookId) => loadBook(translation, bookId, loaderOptions),
  };
};
