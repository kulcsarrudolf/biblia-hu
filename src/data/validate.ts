import type { BookId, ChapterData, Translation, TranslationId } from '../types';
import { BOOKS } from '../books';
import { isBibliaError } from '../errors';
import { loadBook, type LoadBookOptions } from './loader';

/** One thing that is wrong with a book file. */
export interface ValidationError {
  /** Set once the error is attributed to a book, for example by {@link validateTranslation}. */
  book?: BookId;
  message: string;
}

/** What {@link validateTranslation} found in one translation. */
export interface TranslationReport {
  translation: TranslationId;
  /** Books whose file could be read and parsed. */
  books: number;
  chapters: number;
  verses: number;
  errors: ValidationError[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Checks the shape and the numbering of one parsed book file.
 *
 * Chapters must run 1..n and verses 1..m with no gaps and no repeats, every
 * verse id must be a number, every text must be a non empty string, and a
 * chapter title, when present, must be a string.
 */
export const validateBookData = (data: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data)) {
    return [{ message: 'Root must be an array of chapters' }];
  }

  if (data.length === 0) {
    return [{ message: 'Book has no chapters' }];
  }

  data.forEach((rawChapter, chapterIndex) => {
    if (!isObject(rawChapter)) {
      errors.push({ message: `Chapter at index ${chapterIndex} is not an object` });
      return;
    }

    const chapter = rawChapter as unknown as ChapterData;
    const expectedNumber = chapterIndex + 1;

    if (typeof chapter.chapter !== 'number' || !Number.isInteger(chapter.chapter)) {
      errors.push({
        message: `Chapter at index ${chapterIndex} has a missing or non integer "chapter" field`,
      });
    } else if (chapter.chapter !== expectedNumber) {
      errors.push({
        message: `Chapter at index ${chapterIndex} is numbered ${chapter.chapter}, expected ${expectedNumber}`,
      });
    }

    if (chapter.title !== undefined && typeof chapter.title !== 'string') {
      errors.push({ message: `Chapter ${expectedNumber} has a non string "title" field` });
    }

    if (!Array.isArray(chapter.verses)) {
      errors.push({
        message: `Chapter ${expectedNumber} has a missing or non array "verses" field`,
      });
      return;
    }

    if (chapter.verses.length === 0) {
      errors.push({ message: `Chapter ${expectedNumber} has no verses` });
      return;
    }

    chapter.verses.forEach((verse, verseIndex) => {
      if (!isObject(verse)) {
        errors.push({
          message: `Chapter ${expectedNumber}, verse index ${verseIndex} is not an object`,
        });
        return;
      }

      const expectedVerse = verseIndex + 1;
      if (typeof verse.verse !== 'number' || !Number.isInteger(verse.verse)) {
        errors.push({
          message: `Chapter ${expectedNumber}, verse index ${verseIndex} has a missing or non integer "verse" field`,
        });
      } else if (verse.verse !== expectedVerse) {
        errors.push({
          message: `Chapter ${expectedNumber} verse at index ${verseIndex} is numbered ${verse.verse}, expected ${expectedVerse}`,
        });
      }

      if (typeof verse.text !== 'string') {
        errors.push({
          message: `Chapter ${expectedNumber}, verse ${expectedVerse} has a missing or non string "text" field`,
        });
      } else if (verse.text.trim() === '') {
        errors.push({
          message: `Chapter ${expectedNumber}, verse ${expectedVerse} has empty text`,
        });
      }
    });
  });

  return errors;
};

/**
 * Loads all 66 books of a translation and validates each of them.
 *
 * A book that cannot be loaded, or whose chapter count differs from
 * `expectedChapterCounts`, is reported as an error rather than thrown.
 */
export const validateTranslation = async (
  translation: Translation,
  expectedChapterCounts: Record<BookId, number>,
  options: LoadBookOptions = {},
): Promise<TranslationReport> => {
  const report: TranslationReport = {
    translation: translation.id,
    books: 0,
    chapters: 0,
    verses: 0,
    errors: [],
  };

  for (const book of BOOKS) {
    let data: ChapterData[];
    try {
      data = await loadBook(translation, book.id, options);
    } catch (error) {
      report.errors.push({
        book: book.id,
        message: isBibliaError(error) ? error.message : String(error),
      });
      continue;
    }

    report.books += 1;
    report.chapters += data.length;
    report.verses += data.reduce(
      (total, chapter) => total + (Array.isArray(chapter.verses) ? chapter.verses.length : 0),
      0,
    );

    const expected = expectedChapterCounts[book.id];
    if (data.length !== expected) {
      report.errors.push({
        book: book.id,
        message: `Has ${data.length} chapters, expected ${expected}`,
      });
    }

    for (const error of validateBookData(data)) {
      report.errors.push({ ...error, book: book.id });
    }
  }

  return report;
};
