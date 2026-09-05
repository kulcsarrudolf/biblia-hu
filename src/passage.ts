import type { BibleContext } from './context';
import { BibliaError } from './errors';
import { formatReference, parseReference } from './reference';
import type {
  Book,
  BookId,
  Chapter,
  ChapterData,
  ParsedReference,
  Passage,
  PassageSegment,
  Verse,
} from './types';

/** Picks one chapter out of a loaded book, or reports what is available. */
const requireChapter = (
  context: BibleContext,
  book: Book,
  data: ChapterData[],
  chapter: number,
): ChapterData => {
  const found = data.find((entry) => entry.chapter === chapter);
  if (!found) {
    throw new BibliaError(
      'CHAPTER_NOT_FOUND',
      `A(z) ${book.name} (${book.id}) könyvnek nincs ${chapter}. fejezete a(z) ` +
        `${context.translation.shortName} fordításban. Fejezetek: 1-${data.length}.`,
    );
  }
  return found;
};

/** First and last verse number of a chapter, used when a reference names no verses. */
const chapterBounds = (chapter: ChapterData): [number, number] => {
  const numbers = chapter.verses.map((verse) => verse.verse);
  return [Math.min(...numbers), Math.max(...numbers)];
};

const toVerse = (
  bookId: BookId,
  chapter: number,
  verse: { verse: number; text: string },
): Verse => ({
  book: bookId,
  chapter,
  verse: verse.verse,
  text: verse.text,
});

/**
 * Turns one parsed segment into a resolved segment.
 *
 * A segment without verse bounds covers the whole chapter, so the bounds come
 * from the loaded chapter. Explicit bounds are checked against the chapter
 * rather than clamped, so `Zsolt 100:1-99` is an error instead of quietly
 * meaning `Zsolt 100:1-5`.
 */
const resolveSegment = (
  context: BibleContext,
  parsed: ParsedReference,
  data: ChapterData[],
): PassageSegment => {
  const book = context.toBook(parsed.book);
  const chapter = requireChapter(context, book, data, parsed.chapter);
  const [firstVerse, lastVerse] = chapterBounds(chapter);

  const startVerse = parsed.startVerse ?? firstVerse;
  const endVerse = parsed.endVerse ?? lastVerse;

  const verses = chapter.verses
    .filter((verse) => verse.verse >= startVerse && verse.verse <= endVerse)
    .map((verse) => toVerse(book.id, chapter.chapter, verse));

  if (verses.length === 0 || startVerse < firstVerse || endVerse > lastVerse) {
    throw new BibliaError(
      'VERSE_NOT_FOUND',
      `A(z) ${book.name} ${chapter.chapter}. fejezetében nincs ` +
        `${startVerse === endVerse ? `${startVerse}. vers` : `${startVerse}-${endVerse}. vers`} a(z) ` +
        `${context.translation.shortName} fordításban. Versek: ${firstVerse}-${lastVerse}.`,
    );
  }

  const resolved = { book: book.id, chapter: chapter.chapter, startVerse, endVerse };

  return { ...resolved, bookInfo: book, reference: formatReference(resolved), verses };
};

/**
 * Resolves a reference string against one translation.
 *
 * Every book named in the reference is loaded once, however many segments
 * mention it. The returned passage carries the resolved segments and, for
 * convenience, every verse of every segment flattened in reference order.
 *
 * @example
 * await getPassage(context, 'Zsolt 139:23-24; Jn 3:16');
 * // reference: 'Zsolt 139:23-24; Jn 3:16', segments: 2, verses: 3
 *
 * @throws BibliaError with code INVALID_REFERENCE, UNKNOWN_BOOK,
 * CHAPTER_NOT_FOUND, VERSE_NOT_FOUND or DATA_UNAVAILABLE.
 */
export const getPassage = async (context: BibleContext, ref: string): Promise<Passage> => {
  const parsed = parseReference(ref);

  const bookIds = [...new Set(parsed.map((segment) => segment.book))];
  const loaded = new Map<BookId, ChapterData[]>(
    await Promise.all(
      bookIds.map(async (bookId): Promise<[BookId, ChapterData[]]> => [
        bookId,
        await context.load(bookId),
      ]),
    ),
  );

  const segments = parsed.map((segment) =>
    resolveSegment(context, segment, loaded.get(segment.book) as ChapterData[]),
  );

  return {
    translation: context.translation.id,
    reference: segments.map((segment) => segment.reference).join('; '),
    segments,
    verses: segments.flatMap((segment) => segment.verses),
  };
};

/**
 * Loads one whole chapter, with its heading when the translation has one.
 *
 * @example
 * const chapter = await getChapter(context, 'Zsolt', 100);
 * chapter.title; // 'Adjunk hálát alkotónknak!'
 *
 * @throws BibliaError with code UNKNOWN_BOOK, CHAPTER_NOT_FOUND or DATA_UNAVAILABLE.
 */
export const getChapter = async (
  context: BibleContext,
  book: string,
  chapter: number,
): Promise<Chapter> => {
  const bookInfo = context.requireBook(book);
  const data = await context.load(bookInfo.id);
  const found = requireChapter(context, bookInfo, data, chapter);

  return {
    book: bookInfo,
    chapter: found.chapter,
    ...(found.title === undefined ? {} : { title: found.title }),
    verses: found.verses.map((verse) => toVerse(bookInfo.id, found.chapter, verse)),
  };
};
