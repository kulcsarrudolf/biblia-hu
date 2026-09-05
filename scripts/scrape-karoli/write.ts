/**
 * Atomic writer for the scraped Károli book files.
 *
 * A full scrape takes hours and is meant to be interruptible, so a book file
 * is written to a temporary name first and renamed into place only once it is
 * complete. A half written file would otherwise look like a resumable book.
 *
 * Build time tooling, never shipped.
 */
import * as fs from 'fs';
import * as path from 'path';

import type { BookId, ChapterData } from '../../src/types';

/**
 * Writes one book file as `<outDir>/<id>.json`, creating `outDir` if needed.
 *
 * Károli chapters carry no title, so only `chapter` and `verses` are written.
 * The output is 2 space JSON with a trailing newline, matching `json/ruf`.
 *
 * @returns the absolute path of the file that was written.
 */
export const writeBookJson = (outDir: string, id: BookId, chapters: ChapterData[]): string => {
  const directory = path.resolve(outDir);
  fs.mkdirSync(directory, { recursive: true });

  const target = path.join(directory, `${id}.json`);
  const temporary = `${target}.tmp`;

  const payload = chapters.map((chapter) => ({
    chapter: chapter.chapter,
    verses: chapter.verses.map((verse) => ({ verse: verse.verse, text: verse.text })),
  }));

  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  fs.renameSync(temporary, target);

  return target;
};
