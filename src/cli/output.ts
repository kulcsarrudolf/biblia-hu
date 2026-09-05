import { TRANSLATIONS, TRANSLATION_IDS } from '../translations';
import type {
  Bible,
  BookDetails,
  DailyVerse,
  Passage,
  SearchResult,
  Testament,
  Translation,
} from '../types';

/** Hungarian heading for each half of the canon. */
const TESTAMENT_NAMES: Record<Testament, string> = {
  old: 'Ószövetség',
  new: 'Újszövetség',
};

/** Two spaces between columns keeps wide Hungarian book names readable. */
const COLUMN_GAP = '  ';

/**
 * Prints a fixed width table with a header row and a rule under it.
 *
 * The last column is never padded, so no line carries trailing whitespace.
 */
export const printTable = (headers: readonly string[], rows: readonly string[][]): void => {
  const widths = headers.map((header, column) =>
    rows.reduce((width, row) => Math.max(width, row[column].length), header.length),
  );
  const line = (cells: readonly string[]): string =>
    cells
      .map((cell, column) => (column === cells.length - 1 ? cell : cell.padEnd(widths[column])))
      .join(COLUMN_GAP);

  console.log(line(headers));
  console.log(line(widths.map((width) => '-'.repeat(width))));
  for (const row of rows) {
    console.log(line(row));
  }
};

/**
 * Prints a passage under a `<reference> (<shortName>)` header.
 *
 * A reference with several segments gets one sub heading per segment, so the
 * verse numbers stay unambiguous when the segments come from different books.
 */
export const printPassage = (passage: Passage, translation: Translation): void => {
  console.log(`${passage.reference} (${translation.shortName})`);

  for (const segment of passage.segments) {
    console.log('');
    if (passage.segments.length > 1) {
      console.log(`${segment.reference}`);
    }
    for (const verse of segment.verses) {
      console.log(`${verse.verse}. ${verse.text}`);
    }
  }
};

/** Prints the book list of one or both testaments, with this translation's names. */
export const printBooks = (bible: Bible, testament?: Testament): void => {
  const sections: Testament[] = testament === undefined ? ['old', 'new'] : [testament];

  sections.forEach((section, index) => {
    if (index > 0) console.log('');
    console.log(TESTAMENT_NAMES[section]);
    console.log('');
    const books = section === 'old' ? bible.getOldTestamentBooks() : bible.getNewTestamentBooks();
    for (const book of books) {
      console.log(`${book.name} (${book.abbreviation})`);
    }
  });
};

/** Prints the structure of one book as a two column table. */
export const printBookDetails = (details: BookDetails): void => {
  console.log(`${details.book.name} (${details.book.abbreviation})`);
  console.log('');
  printTable(
    ['Field', 'Value'],
    [
      ['Id', details.book.id],
      ['Abbreviation', details.book.abbreviation],
      ['Testament', TESTAMENT_NAMES[details.book.testament]],
      ['Order', String(details.book.order)],
      ['Chapters', String(details.chapters)],
      ['Verses', String(details.verses)],
    ],
  );
};

/** Prints one `reference: text` line per hit, or a note when there is none. */
export const printSearchResults = (results: readonly SearchResult[]): void => {
  if (results.length === 0) {
    console.log('No results found.');
    return;
  }
  for (const result of results) {
    console.log(`${result.reference}: ${result.text}`);
  }
};

/** Prints the verse of the day: the reference, then the text. */
export const printDailyVerse = (verse: DailyVerse): void => {
  console.log(verse.reference);
  console.log('');
  console.log(verse.text);
};

/** Prints the translations that can be selected, as a table. */
export const printTranslations = (): void => {
  printTable(
    ['Id', 'Name', 'Year', 'Publisher'],
    TRANSLATION_IDS.map((id) => {
      const translation = TRANSLATIONS[id];
      return [
        translation.id,
        translation.name,
        String(translation.year),
        translation.publisher,
      ] satisfies string[];
    }),
  );
};
