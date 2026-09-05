/**
 * Public type surface of biblia-hu.
 *
 * Everything here is a type only declaration, so this module has no runtime
 * cost and can be imported from anywhere in the package without cycles.
 */

/**
 * Canonical book identifier: the 66 USFM style codes of the Protestant canon,
 * listed in canonical order. These double as the JSON file names under json/.
 */
export type BookId =
  | 'GEN'
  | 'EXO'
  | 'LEV'
  | 'NUM'
  | 'DEU'
  | 'JOS'
  | 'JDG'
  | 'RUT'
  | '1SA'
  | '2SA'
  | '1KI'
  | '2KI'
  | '1CH'
  | '2CH'
  | 'EZR'
  | 'NEH'
  | 'EST'
  | 'JOB'
  | 'PSA'
  | 'PRO'
  | 'ECC'
  | 'SNG'
  | 'ISA'
  | 'JER'
  | 'LAM'
  | 'EZK'
  | 'DAN'
  | 'HOS'
  | 'JOL'
  | 'AMO'
  | 'OBA'
  | 'JON'
  | 'MIC'
  | 'NAM'
  | 'HAB'
  | 'ZEP'
  | 'HAG'
  | 'ZEC'
  | 'MAL'
  | 'MAT'
  | 'MRK'
  | 'LUK'
  | 'JHN'
  | 'ACT'
  | 'ROM'
  | '1CO'
  | '2CO'
  | 'GAL'
  | 'EPH'
  | 'PHP'
  | 'COL'
  | '1TH'
  | '2TH'
  | '1TI'
  | '2TI'
  | 'TIT'
  | 'PHM'
  | 'HEB'
  | 'JAS'
  | '1PE'
  | '2PE'
  | '1JN'
  | '2JN'
  | '3JN'
  | 'JUD'
  | 'REV';

/** Which half of the canon a book belongs to. */
export type Testament = 'old' | 'new';

/** One book of the canon, independent of any translation. */
export interface CanonicalBook {
  /** Canonical identifier, for example `GEN`. */
  id: BookId;
  /** Position in the canon, 1 for Genesis through 66 for Revelation. */
  order: number;
  testament: Testament;
  /** Short RÚF abbreviation, for example `1Móz` or `Jn`. */
  abbreviation: string;
  /** Other accepted spellings: RÚF and Károli names plus common variants. */
  aliases: string[];
}

/** A canonical book resolved against one translation, carrying that translation's name. */
export interface Book extends CanonicalBook {
  /** Book name as the selected translation writes it. */
  name: string;
}

/** Identifier of a bundled translation. */
export type TranslationId = 'RUF' | 'KAROLI';

/** Metadata and per book names of one translation. */
export interface Translation {
  id: TranslationId;
  /** Full name in Hungarian, for example `Revideált új fordítás`. */
  name: string;
  /** Short name used in output, for example `RÚF`. */
  shortName: string;
  /** Year of the edition this text follows. */
  year: number;
  publisher: string;
  /** Where the text was taken from. */
  source: string;
  /** Copyright line to display next to quoted text. */
  attribution: string;
  /** Directory under `json/` that holds this translation's book files. */
  dataDir: string;
  bookNames: Record<BookId, string>;
}

/** A single verse of a translation. */
export interface Verse {
  book: BookId;
  chapter: number;
  verse: number;
  text: string;
}

/** A whole chapter with its verses, and its heading when the translation has one. */
export interface Chapter {
  book: Book;
  chapter: number;
  title?: string;
  verses: Verse[];
}

/**
 * One parsed reference segment.
 *
 * When both `startVerse` and `endVerse` are undefined the reference names a
 * whole chapter, for example `Zsolt 100`.
 */
export interface ParsedReference {
  book: BookId;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

/** A resolved reference segment together with the verses it selects. */
export interface PassageSegment extends Required<ParsedReference> {
  bookInfo: Book;
  /** Human readable form of this segment, for example `Zsolt 139:23-24`. */
  reference: string;
  verses: Verse[];
}

/** The result of resolving a full reference string against a translation. */
export interface Passage {
  translation: TranslationId;
  reference: string;
  segments: PassageSegment[];
  verses: Verse[];
}

/** Structural summary of one book in one translation. */
export interface BookDetails {
  book: Book;
  chapters: number;
  verses: number;
  versesPerChapter: Record<number, number>;
  chapterTitles?: Record<number, string>;
}

/** Options accepted by `search`. */
export interface SearchOptions {
  testament?: Testament;
  book?: string;
  caseSensitive?: boolean;
  limit?: number;
  /** Treat the query as a regular expression instead of a literal substring. */
  regex?: boolean;
}

/** A verse that matched a search, with its book and printable reference. */
export interface SearchResult extends Verse {
  bookInfo: Book;
  reference: string;
}

/** The verse selected for a given day. */
export interface DailyVerse extends Verse {
  bookInfo: Book;
  reference: string;
}

/** Shape of one chapter inside a `json/<dataDir>/<ID>.json` file. */
export interface ChapterData {
  chapter: number;
  title?: string;
  verses: VerseData[];
}

/** Shape of one verse inside a `json/<dataDir>/<ID>.json` file. */
export interface VerseData {
  verse: number;
  text: string;
}

/** Options for the `biblia()` factory. */
export interface BibliaOptions {
  /** Base URL used when a book file is not on disk. */
  dataBaseUrl?: string;
}

/** The per translation API surface returned by `biblia()`. */
export interface Bible {
  readonly translation: Translation;
  getBooks(): Book[];
  getOldTestamentBooks(): Book[];
  getNewTestamentBooks(): Book[];
  findBook(input: string): Book | undefined;
  parseReference(ref: string): ParsedReference[];
  getPassage(ref: string): Promise<Passage>;
  getChapter(book: string, chapter: number): Promise<Chapter>;
  getBookDetails(book: string): Promise<BookDetails>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getDailyVerse(date?: Date): Promise<DailyVerse>;
}
