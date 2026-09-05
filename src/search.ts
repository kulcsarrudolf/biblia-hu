import { BOOKS } from './books';
import type { BibleContext } from './context';
import type { Book, SearchOptions, SearchResult } from './types';
import { formatReference } from './reference';

/** Default number of results, matching the documented `SearchOptions.limit`. */
export const DEFAULT_SEARCH_LIMIT = 100;

/** Escapes every character that means something to the RegExp engine. */
const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Narrows the canon down to the books a single search has to read. */
const booksToSearch = (context: BibleContext, options: SearchOptions): Book[] => {
  if (options.book !== undefined) {
    return [context.requireBook(options.book)];
  }
  return BOOKS.filter(
    (book) => options.testament === undefined || book.testament === options.testament,
  ).map((book) => context.toBook(book));
};

/**
 * Searches the verse text of one translation.
 *
 * The query is a literal substring by default: `search(context, '(')` looks for
 * a parenthesis and cannot throw. Pass `regex: true` to have the query compiled
 * as a regular expression instead. Books are read in canonical order and only
 * until `limit` results are collected, so a narrow search never loads the whole
 * canon.
 *
 * @example
 * await search(context, 'szeretet', { book: 'Jn', limit: 10 });
 * await search(context, '^Bizony', { regex: true, caseSensitive: true });
 *
 * @throws BibliaError with code UNKNOWN_BOOK when the `book` filter names no
 * known book, or DATA_UNAVAILABLE when a book file cannot be read.
 * @throws SyntaxError when `regex` is true and the query is not a valid
 * regular expression.
 */
export const search = async (
  context: BibleContext,
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> => {
  const { caseSensitive = false, limit = DEFAULT_SEARCH_LIMIT, regex = false } = options;

  if (typeof query !== 'string' || query.length === 0 || limit <= 0) {
    return [];
  }

  const pattern = new RegExp(regex ? query : escapeRegExp(query), caseSensitive ? '' : 'i');
  const results: SearchResult[] = [];

  for (const book of booksToSearch(context, options)) {
    if (results.length >= limit) {
      break;
    }

    const data = await context.load(book.id);

    for (const chapter of data) {
      for (const verse of chapter.verses) {
        if (!pattern.test(verse.text)) {
          continue;
        }

        const reference = formatReference({
          book: book.id,
          chapter: chapter.chapter,
          startVerse: verse.verse,
          endVerse: verse.verse,
        });

        results.push({
          book: book.id,
          chapter: chapter.chapter,
          verse: verse.verse,
          text: verse.text,
          bookInfo: book,
          reference,
        });

        if (results.length >= limit) {
          break;
        }
      }

      if (results.length >= limit) {
        break;
      }
    }
  }

  return results;
};
