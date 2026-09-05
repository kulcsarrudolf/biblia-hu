/**
 * Cheerio parsers for the three Károli page types on online-biblia.ro.
 *
 * The site is a Drupal install that answers an unknown book or chapter with
 * HTTP 200 and an empty list, so every parser treats an empty result as an
 * error rather than as a valid page.
 *
 * Build time tooling, never shipped.
 */
import * as cheerio from 'cheerio';

import type { Testament } from '../../src/types';
import { normalizeWhitespace } from '../../src/utils/text';

/** One entry of the book list on `/bible/4`. */
export interface SiteBook {
  /** The site code taken from the href, for example `GEN` or `1SM`. */
  code: string;
  /** The Hungarian name as printed on the site, for example `1. Mózes`. */
  name: string;
  testament: Testament;
}

/** One verse of a chapter page. */
export interface SiteVerse {
  verse: number;
  text: string;
}

/**
 * Thrown when a page parses to nothing.
 *
 * The site returns 200 with an empty `ul` or `dl` for an unknown book or
 * chapter, which would otherwise be silently written as an empty file.
 */
export class EmptyPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmptyPageError';
    Object.setPrototypeOf(this, EmptyPageError.prototype);
  }
}

/** Last path segment of an href, without a query string or fragment. */
const lastPathSegment = (href: string): string => {
  const path = href.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  const segments = path.split('/');
  return segments[segments.length - 1] ?? '';
};

/**
 * Reads the book list of `/bible/4`.
 *
 * Old and new testament books live in two rows that carry the testament in
 * their class, and every book is one anchor whose href ends in the site code.
 */
export const parseBookList = (html: string): SiteBook[] => {
  const $ = cheerio.load(html);
  const books: SiteBook[] = [];

  const collect = (rowClass: string, testament: Testament): void => {
    $(`tr.${rowClass} span.book a`).each((_, element) => {
      const href = $(element).attr('href') ?? '';
      const code = lastPathSegment(href);
      const name = normalizeWhitespace($(element).text());
      if (code && name) books.push({ code, name, testament });
    });
  };

  collect('old-testament', 'old');
  collect('new-testament', 'new');

  if (books.length === 0) throw new EmptyPageError('Book list page has no books');

  return books;
};

/**
 * Reads the chapter numbers of a book page such as `/bible/4/GEN`.
 *
 * Anchors that do not end in a number are ignored, which keeps navigation
 * links out of the result.
 */
export const parseChapterList = (html: string): number[] => {
  const $ = cheerio.load(html);
  const chapters: number[] = [];

  $('ul.bible-chapter-list li a').each((_, element) => {
    const text = normalizeWhitespace($(element).text());
    if (/^\d+$/.test(text)) chapters.push(Number(text));
  });

  if (chapters.length === 0) throw new EmptyPageError('Chapter list page has no chapters');

  return chapters;
};

/**
 * Reads the verses of a chapter page such as `/bible/4/GEN/1`.
 *
 * The markup is a definition list where each `dt` holds the verse number and
 * the `dd` right after it holds the text. Cheerio's `.text()` decodes the HTML
 * entities the site emits, and `normalizeWhitespace` flattens the indentation
 * of the source markup into single spaces.
 */
export const parseChapter = (html: string): SiteVerse[] => {
  const $ = cheerio.load(html);
  const verses: SiteVerse[] = [];

  $('dl.bible-chapter-content dt').each((_, element) => {
    const number = normalizeWhitespace($(element).find('a').first().text());
    if (!/^\d+$/.test(number)) return;

    const text = normalizeWhitespace($(element).nextAll('dd').first().text());
    if (text === '') return;

    verses.push({ verse: Number(number), text });
  });

  if (verses.length === 0) throw new EmptyPageError('Chapter page has no verses');

  return verses;
};
