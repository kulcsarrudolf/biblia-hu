import {
  getBooks as getCanonicalBooks,
  getNewTestamentBooks as getCanonicalNewTestamentBooks,
  getOldTestamentBooks as getCanonicalOldTestamentBooks,
} from './books';
import { getBookDetails } from './book-details';
import { createContext } from './context';
import { getDailyVerse } from './daily-verse';
import { getChapter, getPassage } from './passage';
import { parseReference } from './reference';
import { search } from './search';
import type {
  Bible,
  BibliaOptions,
  Book,
  BookDetails,
  Chapter,
  DailyVerse,
  ParsedReference,
  Passage,
  SearchOptions,
  SearchResult,
  TranslationId,
} from './types';

export type { Bible, BibliaOptions } from './types';

/**
 * Creates the API for one translation.
 *
 * One instance serves one translation, so the translation is chosen once and
 * never repeated at the call site. Methods that only need the in code tables
 * are synchronous; everything that touches verse data is asynchronous and reads
 * the bundled JSON through the memoized loader, so the second call for a book
 * costs nothing.
 *
 * @param translation Id of a bundled translation, currently `RUF`.
 * @param options `dataBaseUrl` overrides where a missing book file is fetched from.
 *
 * @example
 * const ruf = biblia('RUF');
 * const passage = await ruf.getPassage('Jn 3:16');
 * passage.verses[0].text; // 'Mert úgy szerette Isten a világot, ...'
 *
 * @throws BibliaError with code UNKNOWN_TRANSLATION when the id is not registered.
 */
export const biblia = (translation: TranslationId, options: BibliaOptions = {}): Bible => {
  const context = createContext(translation, options);

  const withName = (book: { id: Book['id'] }): Book => context.toBook(book.id);

  return {
    translation: context.translation,

    getBooks: (): Book[] => getCanonicalBooks().map(withName),
    getOldTestamentBooks: (): Book[] => getCanonicalOldTestamentBooks().map(withName),
    getNewTestamentBooks: (): Book[] => getCanonicalNewTestamentBooks().map(withName),
    findBook: (input: string): Book | undefined => context.findBook(input),
    parseReference: (ref: string): ParsedReference[] => parseReference(ref),

    getPassage: (ref: string): Promise<Passage> => getPassage(context, ref),
    getChapter: (book: string, chapter: number): Promise<Chapter> =>
      getChapter(context, book, chapter),
    getBookDetails: (book: string): Promise<BookDetails> => getBookDetails(context, book),
    search: (query: string, searchOptions?: SearchOptions): Promise<SearchResult[]> =>
      search(context, query, searchOptions),
    getDailyVerse: (date?: Date): Promise<DailyVerse> => getDailyVerse(context, date),
  };
};
