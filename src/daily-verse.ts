import type { BibleContext } from './context';
import { BibliaError } from './errors';
import { formatReference } from './reference';
import type { BookId, DailyVerse } from './types';

/** One entry of the curated rotation, addressed by canonical book id. */
export interface CuratedVerse {
  book: BookId;
  chapter: number;
  verse: number;
}

/**
 * The verses the daily rotation draws from, in a fixed order.
 *
 * This is the list `biblia-ruf` shipped, re-keyed from Hungarian abbreviations
 * to canonical ids. The order is part of the contract: the index comes from a
 * hash of the date, so reordering the list would change which verse a given day
 * gets. Every entry has to exist in every bundled translation, which the test
 * suite checks.
 */
export const CURATED_VERSES: readonly CuratedVerse[] = [
  { book: 'GEN', chapter: 1, verse: 1 },
  { book: 'PSA', chapter: 23, verse: 1 },
  { book: 'PSA', chapter: 27, verse: 1 },
  { book: 'PSA', chapter: 46, verse: 2 },
  { book: 'PSA', chapter: 91, verse: 1 },
  { book: 'PSA', chapter: 100, verse: 1 },
  { book: 'PSA', chapter: 119, verse: 105 },
  { book: 'PSA', chapter: 121, verse: 1 },
  { book: 'PSA', chapter: 139, verse: 23 },
  { book: 'PRO', chapter: 3, verse: 5 },
  { book: 'PRO', chapter: 3, verse: 6 },
  { book: 'PRO', chapter: 16, verse: 3 },
  { book: 'ISA', chapter: 40, verse: 31 },
  { book: 'ISA', chapter: 41, verse: 10 },
  { book: 'JER', chapter: 29, verse: 11 },
  { book: 'MAT', chapter: 5, verse: 16 },
  { book: 'MAT', chapter: 6, verse: 33 },
  { book: 'MAT', chapter: 11, verse: 28 },
  { book: 'MAT', chapter: 28, verse: 20 },
  { book: 'JHN', chapter: 1, verse: 1 },
  { book: 'JHN', chapter: 3, verse: 16 },
  { book: 'JHN', chapter: 8, verse: 12 },
  { book: 'JHN', chapter: 10, verse: 10 },
  { book: 'JHN', chapter: 11, verse: 25 },
  { book: 'JHN', chapter: 14, verse: 6 },
  { book: 'JHN', chapter: 14, verse: 27 },
  { book: 'JHN', chapter: 15, verse: 5 },
  { book: 'ROM', chapter: 5, verse: 8 },
  { book: 'ROM', chapter: 8, verse: 28 },
  { book: 'ROM', chapter: 8, verse: 38 },
  { book: 'ROM', chapter: 12, verse: 2 },
  { book: '1CO', chapter: 10, verse: 13 },
  { book: '1CO', chapter: 13, verse: 4 },
  { book: '1CO', chapter: 13, verse: 13 },
  { book: '2CO', chapter: 5, verse: 17 },
  { book: '2CO', chapter: 12, verse: 9 },
  { book: 'GAL', chapter: 2, verse: 20 },
  { book: 'GAL', chapter: 5, verse: 22 },
  { book: 'EPH', chapter: 2, verse: 8 },
  { book: 'EPH', chapter: 6, verse: 10 },
  { book: 'PHP', chapter: 1, verse: 6 },
  { book: 'PHP', chapter: 4, verse: 6 },
  { book: 'PHP', chapter: 4, verse: 13 },
  { book: 'COL', chapter: 3, verse: 23 },
  { book: '2TI', chapter: 1, verse: 7 },
  { book: 'HEB', chapter: 11, verse: 1 },
  { book: 'HEB', chapter: 12, verse: 2 },
  { book: 'JAS', chapter: 1, verse: 5 },
  { book: '1PE', chapter: 5, verse: 7 },
  { book: '1JN', chapter: 4, verse: 8 },
  { book: 'REV', chapter: 21, verse: 4 },
];

/**
 * Hashes the local calendar date into a non negative integer.
 *
 * This is the algorithm `biblia-ruf` used, kept character for character so that
 * a given day picks the same verse it used to. It reads the local date parts,
 * so the verse turns over at local midnight rather than at UTC midnight.
 */
const hashDate = (date: Date): number => {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let index = 0; index < key.length; index++) {
    hash = (hash << 5) - hash + key.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

/** The curated entry that belongs to a given day. */
export const curatedVerseFor = (date: Date): CuratedVerse =>
  CURATED_VERSES[hashDate(date) % CURATED_VERSES.length];

/**
 * Returns the verse of the day, the same one for every caller on a given date.
 *
 * @example
 * const verse = await getDailyVerse(context, new Date(2024, 0, 1));
 * verse.reference; // always the same for 2024-01-01
 *
 * @throws BibliaError with code CHAPTER_NOT_FOUND, VERSE_NOT_FOUND or
 * DATA_UNAVAILABLE when the translation does not carry the selected verse.
 */
export const getDailyVerse = async (context: BibleContext, date?: Date): Promise<DailyVerse> => {
  const entry = curatedVerseFor(date ?? new Date());
  const bookInfo = context.toBook(entry.book);
  const data = await context.load(entry.book);

  const chapter = data.find((candidate) => candidate.chapter === entry.chapter);
  if (!chapter) {
    throw new BibliaError(
      'CHAPTER_NOT_FOUND',
      `A napi ige (${bookInfo.name} ${entry.chapter}) fejezete hiányzik a(z) ` +
        `${context.translation.shortName} fordításból.`,
    );
  }

  const verse = chapter.verses.find((candidate) => candidate.verse === entry.verse);
  if (!verse) {
    throw new BibliaError(
      'VERSE_NOT_FOUND',
      `A napi ige (${bookInfo.name} ${entry.chapter}:${entry.verse}) hiányzik a(z) ` +
        `${context.translation.shortName} fordításból.`,
    );
  }

  return {
    book: entry.book,
    chapter: entry.chapter,
    verse: entry.verse,
    text: verse.text,
    bookInfo,
    reference: formatReference({
      book: entry.book,
      chapter: entry.chapter,
      startVerse: entry.verse,
      endVerse: entry.verse,
    }),
  };
};
