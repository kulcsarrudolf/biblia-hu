import { findBook } from './books';
import { BibliaError } from './errors';
import type { Book, CanonicalBook, ParsedReference } from './types';
import { normalizeWhitespace } from './utils/text';

/**
 * Splits a segment into the book token, the chapter and the optional verse spec.
 *
 * The book group is lazy so that everything before the last space and the
 * chapter number counts as the book name. That keeps multi word names such as
 * '1. Móz 3', 'Énekek éneke 2' and 'Jeremiás siralmai 3' working.
 */
const SEGMENT_PATTERN = /^(.+?)\s+(\d+)(?:\s*:\s*(.+))?$/;

/** A single verse ('16') or an inclusive range ('23-24') inside a verse spec. */
const VERSE_PATTERN = /^(\d+)(?:\s*-\s*(\d+))?$/;

// The explicit annotation is what lets TypeScript treat a call as unreachable code.
const invalid: (message: string) => never = (message) => {
  throw new BibliaError('INVALID_REFERENCE', message);
};

/** Parses the part after the colon: a comma separated list of verses and ranges. */
const parseVerseSpec = (spec: string, segment: string): Array<[number, number]> => {
  const parts = spec.split(',');
  const ranges: Array<[number, number]> = [];

  for (const part of parts) {
    const trimmed = part.trim();
    const match = VERSE_PATTERN.exec(trimmed);
    if (!match) {
      invalid(
        `Érvénytelen versmegadás a hivatkozásban: ${JSON.stringify(segment)}. ` +
          `Várt alak: '16', '23-24' vagy '3,23-24'.`,
      );
    }

    const startVerse = Number(match[1]);
    const endVerse = match[2] === undefined ? startVerse : Number(match[2]);

    if (startVerse < 1) {
      invalid(`A versszám 1-nél kisebb nem lehet: ${JSON.stringify(segment)}.`);
    }
    if (endVerse < startVerse) {
      invalid(
        `A verstartomány vége kisebb, mint a kezdete: ${JSON.stringify(segment)}. ` +
          `Írd növekvő sorrendben, például ${endVerse}-${startVerse}.`,
      );
    }

    ranges.push([startVerse, endVerse]);
  }

  return ranges;
};

const parseSegment = (segment: string): ParsedReference[] => {
  const match = SEGMENT_PATTERN.exec(segment);
  if (!match) {
    invalid(
      `Értelmezhetetlen hivatkozás: ${JSON.stringify(segment)}. ` +
        `Várt alak: 'Jn 3', 'Jn 3:16' vagy 'Zsolt 139:3,23-24'.`,
    );
  }

  const [, bookToken, chapterToken, verseSpec] = match;

  const book = findBook(bookToken);
  if (!book) {
    throw new BibliaError(
      'UNKNOWN_BOOK',
      `Ismeretlen könyv: ${JSON.stringify(bookToken.trim())} (a(z) ${JSON.stringify(segment)} ` +
        `hivatkozásban). Használj kanonikus azonosítót, rövidítést vagy teljes nevet, például 'Jn' vagy 'János'.`,
    );
  }

  const chapter = Number(chapterToken);
  if (chapter < 1) {
    invalid(`A fejezetszám 1-nél kisebb nem lehet: ${JSON.stringify(segment)}.`);
  }

  if (verseSpec === undefined) {
    return [{ book: book.id, chapter }];
  }

  return parseVerseSpec(verseSpec, segment).map(([startVerse, endVerse]) => ({
    book: book.id,
    chapter,
    startVerse,
    endVerse,
  }));
};

/**
 * Parses a reference string into one entry per verse range.
 *
 * Segments are separated by semicolons, and a segment without a verse spec
 * names a whole chapter, which leaves `startVerse` and `endVerse` unset.
 * The function is pure and synchronous: it never looks at verse data, so it
 * cannot tell whether the chapter or verse actually exists.
 *
 * @example
 * parseReference('Zsolt 139:3,23-24; Jn 3:16')
 * // [{ book: 'PSA', chapter: 139, startVerse: 3, endVerse: 3 },
 * //  { book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 },
 * //  { book: 'JHN', chapter: 3, startVerse: 16, endVerse: 16 }]
 *
 * @throws BibliaError with code INVALID_REFERENCE or UNKNOWN_BOOK.
 */
export const parseReference = (ref: string): ParsedReference[] => {
  if (typeof ref !== 'string') {
    invalid('A hivatkozásnak szövegnek kell lennie.');
  }

  const segments = ref
    .split(';')
    .map((segment) => normalizeWhitespace(segment))
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    invalid(`Üres hivatkozás. Várt alak: 'Jn 3', 'Jn 3:16' vagy 'Zsolt 139:3,23-24; Zsolt 100'.`);
  }

  return segments.flatMap(parseSegment);
};

const displayName = (segment: ParsedReference, book?: string | CanonicalBook | Book): string => {
  if (typeof book === 'string') {
    return book;
  }
  if (book) {
    return 'name' in book ? book.name : book.abbreviation;
  }

  const canonical = findBook(segment.book);
  if (!canonical) {
    throw new BibliaError(
      'UNKNOWN_BOOK',
      `Ismeretlen könyvazonosító: ${JSON.stringify(segment.book)}.`,
    );
  }
  return canonical.abbreviation;
};

/**
 * Renders a parsed segment back into a reference string.
 *
 * Without a `book` argument the canonical RÚF abbreviation is used. Pass a
 * `Book`, a `CanonicalBook` or a plain string to print a translation specific
 * name instead.
 *
 * @example
 * formatReference({ book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 }); // 'Zsolt 139:23-24'
 * formatReference({ book: 'PSA', chapter: 100 }); // 'Zsolt 100'
 */
export const formatReference = (
  segment: ParsedReference,
  book?: string | CanonicalBook | Book,
): string => {
  const name = displayName(segment, book);
  const startVerse = segment.startVerse ?? segment.endVerse;
  const endVerse = segment.endVerse ?? segment.startVerse;

  if (startVerse === undefined || endVerse === undefined) {
    return `${name} ${segment.chapter}`;
  }
  if (startVerse === endVerse) {
    return `${name} ${segment.chapter}:${startVerse}`;
  }
  return `${name} ${segment.chapter}:${startVerse}-${endVerse}`;
};
