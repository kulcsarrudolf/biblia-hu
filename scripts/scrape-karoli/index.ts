/**
 * Scrapes the Revideált Károli translation from online-biblia.ro into
 * `json/karoli`, one file per canonical book.
 *
 * The site asks for a 10 second crawl delay, so a full run over all 66 books
 * and 1189 chapters takes roughly three and a half hours. The run is
 * resumable: a book whose output file already exists and validates is skipped,
 * and a failing run exits 1 listing the books to retry.
 *
 * Run it with `yarn scrape:karoli`. Start with a small subset, for example
 * `yarn scrape:karoli --book=RUT,PHM`, before the full run.
 *
 * Build time tooling, never shipped.
 */
import * as fs from 'fs';
import * as path from 'path';

import { BOOKS } from '../../src/books';
import type { BookId, ChapterData } from '../../src/types';
import { validateBookData } from '../../src/data/validate';
import { expectedChapterCounts } from '../../tests/fixtures/chapter-counts';
import { siteCode } from './book-codes';
import { createFetcher, DEFAULT_DELAY_MS, type FetchHtml } from './http';
import { parseChapter, parseChapterList } from './parse';
import { writeBookJson } from './write';

const BASE_URL = 'https://www.online-biblia.ro/bible/4';

const DEFAULT_OUT_DIR = 'json/karoli';

const EXPECTED_CHAPTERS = expectedChapterCounts('KAROLI');

/** Everything the command line can set. */
interface Options {
  books: BookId[];
  delayMs: number;
  outDir: string;
  force: boolean;
  verbose: boolean;
}

const isBookId = (value: string): value is BookId => BOOKS.some((book) => book.id === value);

const usage = (): string =>
  [
    'Usage: yarn scrape:karoli [options]',
    '',
    '  --book=RUT,PHM     Comma separated canonical book ids. Defaults to all 66.',
    `  --delay=10000      Milliseconds between requests. Defaults to ${DEFAULT_DELAY_MS}.`,
    `  --out=json/karoli  Output directory. Defaults to ${DEFAULT_OUT_DIR}.`,
    '  --force            Rescrape books that already have a valid output file.',
    '  --verbose          Log every chapter as it is fetched.',
  ].join('\n');

const parseArgs = (argv: string[]): Options => {
  const options: Options = {
    books: BOOKS.map((book) => book.id),
    delayMs: DEFAULT_DELAY_MS,
    outDir: DEFAULT_OUT_DIR,
    force: false,
    verbose: false,
  };

  for (const arg of argv) {
    const [flag, rawValue] = arg.split(/=(.*)/s, 2);
    const value = rawValue ?? '';

    switch (flag) {
      case '--book': {
        const ids = value
          .split(',')
          .map((id) => id.trim().toUpperCase())
          .filter((id) => id !== '');
        const unknown = ids.filter((id) => !isBookId(id));
        if (ids.length === 0 || unknown.length > 0) {
          throw new Error(`Unknown book id: ${unknown.join(', ') || '(empty --book)'}`);
        }
        // Keep canonical order regardless of the order on the command line.
        options.books = BOOKS.map((book) => book.id).filter((id) => ids.includes(id));
        break;
      }
      case '--delay': {
        const delay = Number(value);
        if (!Number.isFinite(delay) || delay < 0) throw new Error(`Invalid --delay: ${value}`);
        options.delayMs = delay;
        break;
      }
      case '--out':
        if (value === '') throw new Error('--out needs a directory');
        options.outDir = value;
        break;
      case '--force':
        options.force = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(usage());
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
};

/** Formats a duration as `1h 12m 30s`, dropping the leading zero units. */
const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/** True when the book already has a complete, valid file on disk. */
const hasValidOutput = (outDir: string, id: BookId): boolean => {
  const file = path.resolve(outDir, `${id}.json`);
  if (!fs.existsSync(file)) return false;

  try {
    const data: unknown = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!Array.isArray(data) || data.length === 0) return false;
    return validateBookData(data).length === 0;
  } catch {
    return false;
  }
};

/** Fetches one book and returns its chapters in order. */
const scrapeBook = async (
  fetchHtml: FetchHtml,
  id: BookId,
  options: Options,
  onRequest: () => void,
): Promise<ChapterData[]> => {
  const code = siteCode(id);

  onRequest();
  const chapterNumbers = parseChapterList(await fetchHtml(`${BASE_URL}/${code}`));

  const chapters: ChapterData[] = [];
  for (const number of chapterNumbers) {
    onRequest();
    const verses = parseChapter(await fetchHtml(`${BASE_URL}/${code}/${number}`));
    chapters.push({ chapter: number, verses });
    if (options.verbose) {
      console.log(`  ${id} ${number}: ${verses.length} verses`);
    }
  }

  return chapters;
};

const main = async (): Promise<void> => {
  let options: Options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(`\n${usage()}`);
    process.exit(1);
    return;
  }

  const pending = options.force
    ? options.books
    : options.books.filter((id) => !hasValidOutput(options.outDir, id));
  const skipped = options.books.length - pending.length;

  console.log(`Károli scrape: ${pending.length} books into ${path.resolve(options.outDir)}`);
  if (skipped > 0) console.log(`${skipped} books already present, skipping. Use --force to redo.`);
  if (pending.length === 0) return;

  // One request for the chapter list of each book, plus one per chapter.
  const plannedRequests = pending.reduce((total, id) => total + 1 + EXPECTED_CHAPTERS[id], 0);
  console.log(
    `About ${plannedRequests} requests at ${options.delayMs} ms, roughly ${formatDuration(
      plannedRequests * options.delayMs,
    )}.\n`,
  );

  const fetchHtml = createFetcher({ delayMs: options.delayMs });
  const failed: { id: BookId; message: string }[] = [];
  const warnings: string[] = [];
  let done = 0;

  const started = Date.now();

  for (const [index, id] of pending.entries()) {
    const position = `[${index + 1}/${pending.length}]`;
    const remaining = plannedRequests - done;
    const eta = formatDuration(remaining * options.delayMs);
    console.log(`${position} ${id} (${siteCode(id)}), about ${eta} left`);

    try {
      const chapters = await scrapeBook(fetchHtml, id, options, () => {
        done += 1;
      });

      const errors = validateBookData(chapters);
      if (errors.length > 0) {
        throw new Error(`Invalid data: ${errors.map((error) => error.message).join('; ')}`);
      }

      const expected = EXPECTED_CHAPTERS[id];
      if (chapters.length !== expected) {
        const warning = `${id} has ${chapters.length} chapters, expected ${expected}`;
        warnings.push(warning);
        console.warn(`  warning: ${warning}`);
      }

      const file = writeBookJson(options.outDir, id, chapters);
      const verses = chapters.reduce((total, chapter) => total + chapter.verses.length, 0);
      console.log(`  wrote ${path.basename(file)}: ${chapters.length} chapters, ${verses} verses`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ id, message });
      console.error(`  failed: ${message}`);
    }
  }

  console.log(`\nFinished in ${formatDuration(Date.now() - started)}.`);

  for (const warning of warnings) console.warn(`warning: ${warning}`);

  if (failed.length > 0) {
    console.error(`\n${failed.length} books failed:`);
    for (const failure of failed) console.error(`  ${failure.id}: ${failure.message}`);
    console.error(
      `\nRerun to resume, only the failed books are refetched:\n  yarn scrape:karoli --book=${failed
        .map((failure) => failure.id)
        .join(',')} --out=${options.outDir}`,
    );
    process.exit(1);
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
