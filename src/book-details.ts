import type { BibleContext } from './context';
import type { BookDetails } from './types';

/**
 * Summarizes the structure of one book in one translation.
 *
 * `versesPerChapter` is a plain object keyed by chapter number, so it survives
 * `JSON.stringify` and is easy to print. `chapterTitles` is present only when
 * the translation carries headings: RÚF does, the Revideált Károli does not.
 *
 * @example
 * const details = await getBookDetails(context, 'Zsolt');
 * details.chapters;              // 150
 * details.versesPerChapter[100]; // 5
 *
 * @throws BibliaError with code UNKNOWN_BOOK or DATA_UNAVAILABLE.
 */
export const getBookDetails = async (context: BibleContext, book: string): Promise<BookDetails> => {
  const bookInfo = context.requireBook(book);
  const data = await context.load(bookInfo.id);

  const versesPerChapter: Record<number, number> = {};
  const chapterTitles: Record<number, string> = {};
  let verses = 0;

  for (const chapter of data) {
    versesPerChapter[chapter.chapter] = chapter.verses.length;
    verses += chapter.verses.length;
    if (chapter.title !== undefined) {
      chapterTitles[chapter.chapter] = chapter.title;
    }
  }

  return {
    book: bookInfo,
    chapters: data.length,
    verses,
    versesPerChapter,
    ...(Object.keys(chapterTitles).length > 0 ? { chapterTitles } : {}),
  };
};
