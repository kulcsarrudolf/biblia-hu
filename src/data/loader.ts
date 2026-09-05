import { BibliaError } from '../errors';
import type { BookId, ChapterData, Translation } from '../types';
import { readJSONFile } from '../utils/fs';

/** Where the loader looks for book files that are not on disk. */
export const DEFAULT_DATA_BASE_URL =
  'https://raw.githubusercontent.com/kulcsarrudolf/biblia-hu/main';

/** Options accepted by {@link loadBook}. */
export interface LoadBookOptions {
  /** Base URL of the fetch fallback. Defaults to {@link DEFAULT_DATA_BASE_URL}. */
  dataBaseUrl?: string;
}

/**
 * Resolved book files, keyed by translation and then by book.
 *
 * The value is the promise rather than the array so that concurrent callers
 * share one read. A rejected promise is evicted, so a failed network fallback
 * does not poison the cache.
 */
const cache = new Map<string, Map<BookId, Promise<ChapterData[]>>>();

/**
 * Two translations can share an id in tests but never a data directory, so the
 * directory is part of the key.
 */
const cacheKey = (translation: Translation): string => `${translation.id}:${translation.dataDir}`;

const relativePath = (translation: Translation, bookId: BookId): string =>
  `json/${translation.dataDir}/${bookId}.json`;

const fetchBook = async (url: string): Promise<ChapterData[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as ChapterData[];
};

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const readBook = async (
  translation: Translation,
  bookId: BookId,
  options: LoadBookOptions,
): Promise<ChapterData[]> => {
  const path = relativePath(translation, bookId);
  try {
    return readJSONFile<ChapterData[]>(path);
  } catch (localError) {
    const base = options.dataBaseUrl ?? DEFAULT_DATA_BASE_URL;
    const url = `${base.replace(/\/+$/, '')}/${path}`;
    try {
      return await fetchBook(url);
    } catch (remoteError) {
      throw new BibliaError(
        'DATA_UNAVAILABLE',
        `A(z) ${bookId} könyv nem érhető el a(z) ${translation.id} fordításban. ` +
          `Helyi olvasás (${path}): ${describe(localError)}. ` +
          `Letöltés (${url}): ${describe(remoteError)}.`,
      );
    }
  }
};

/**
 * Loads one book of one translation, preferring the JSON bundled in the package
 * and falling back to a download when the file is missing.
 *
 * The result is memoized per translation and book, so repeated calls return the
 * very same array. Callers must treat it as read only.
 *
 * @throws BibliaError with code DATA_UNAVAILABLE when both sources fail.
 */
export const loadBook = (
  translation: Translation,
  bookId: BookId,
  options: LoadBookOptions = {},
): Promise<ChapterData[]> => {
  const key = cacheKey(translation);
  const existing = cache.get(key);
  const books = existing ?? new Map<BookId, Promise<ChapterData[]>>();
  if (!existing) {
    cache.set(key, books);
  }

  const cached = books.get(bookId);
  if (cached) {
    return cached;
  }

  const pending = readBook(translation, bookId, options).catch((error: unknown) => {
    books.delete(bookId);
    throw error;
  });
  books.set(bookId, pending);
  return pending;
};

/** Empties the memo cache. Used by the test suite, not part of the public API. */
export const clearCache = (): void => {
  cache.clear();
};
