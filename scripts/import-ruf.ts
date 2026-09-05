/**
 * Imports the RÚF translation from the biblia-ruf repository into json/ruf.
 *
 * The source keeps one file per Hungarian abbreviation with string verse ids,
 * and holds chapter titles only in the biblia.json manifest. This script maps
 * the abbreviations to canonical book ids, drops the handful of junk verses
 * that carry ids like "_388" and empty text, turns verse ids into numbers,
 * merges the chapter titles in and normalizes the whitespace of every text.
 *
 * Run it with `yarn import:ruf`. It is build time tooling and is never shipped.
 */
import * as fs from 'fs';
import * as path from 'path';

import { BOOKS } from '../src/books';
import type { BookId, ChapterData } from '../src/types';
import { normalizeWhitespace } from '../src/utils/text';

/** Where the biblia-ruf checkout lives. Override with the first CLI argument. */
const DEFAULT_SOURCE_DIR = path.resolve(__dirname, '../../biblia-ruf/json');

const TARGET_DIR = path.resolve(__dirname, '../json/ruf');

/** One book entry of the source biblia.json manifest. */
interface SourceBook {
  title: string;
  toc2: string;
  toc3: string;
  slug: string;
  chapter: { number: number; title?: string }[];
}

/** One chapter of a source book file. Verse ids are strings there. */
interface SourceChapter {
  chapter: number;
  verses: { verse: string; text: string }[];
}

const readJSON = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf-8')) as T;

const isCanonicalId = (slug: string): slug is BookId => BOOKS.some((book) => book.id === slug);

/** Source verse ids are decimal strings. Anything else is junk, for example "_388". */
const isVerseId = (id: string): boolean => /^\d+$/.test(id);

const convertBook = (
  source: SourceBook,
  chapters: SourceChapter[],
): { data: ChapterData[]; dropped: number } => {
  const titles = new Map<number, string>();
  for (const chapter of source.chapter) {
    if (chapter.title) {
      titles.set(chapter.number, normalizeWhitespace(chapter.title));
    }
  }

  let dropped = 0;
  const data = chapters.map((chapter) => {
    const verses = chapter.verses
      .filter((verse) => {
        const keep = isVerseId(verse.verse);
        if (!keep) dropped += 1;
        return keep;
      })
      .map((verse) => ({
        verse: Number(verse.verse),
        text: normalizeWhitespace(verse.text),
      }));

    const title = titles.get(chapter.chapter);
    const converted: ChapterData = title
      ? { chapter: chapter.chapter, title, verses }
      : { chapter: chapter.chapter, verses };
    return converted;
  });

  return { data, dropped };
};

const main = (): void => {
  const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE_DIR;
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  const manifest = readJSON<SourceBook[]>(path.join(sourceDir, 'biblia.json'));
  if (manifest.length !== BOOKS.length) {
    console.error(`Manifest has ${manifest.length} books, expected ${BOOKS.length}`);
    process.exit(1);
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  let totalVerses = 0;
  let totalDropped = 0;

  for (const source of manifest) {
    if (!isCanonicalId(source.slug)) {
      console.error(`Unknown book slug in manifest: ${source.slug}`);
      process.exit(1);
    }

    const sourceFile = path.join(sourceDir, `${source.toc3}.json`);
    const chapters = readJSON<SourceChapter[]>(sourceFile);
    const { data, dropped } = convertBook(source, chapters);
    const verses = data.reduce((total, chapter) => total + chapter.verses.length, 0);

    fs.writeFileSync(
      path.join(TARGET_DIR, `${source.slug}.json`),
      `${JSON.stringify(data, null, 2)}\n`,
      'utf-8',
    );

    totalVerses += verses;
    totalDropped += dropped;
    const droppedNote = dropped > 0 ? `, dropped ${dropped}` : '';
    console.log(
      `${source.slug.padEnd(4)} ${source.toc3.padEnd(8)} ${String(data.length).padStart(3)} chapters ${String(verses).padStart(5)} verses${droppedNote}`,
    );
  }

  console.log(`\n${manifest.length} books written to ${TARGET_DIR}`);
  console.log(`${totalVerses} verses total, ${totalDropped} junk verses dropped`);
};

main();
