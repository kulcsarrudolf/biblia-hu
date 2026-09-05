import * as fs from 'fs';
import * as path from 'path';

import {
  EmptyPageError,
  parseBookList,
  parseChapter,
  parseChapterList,
} from '../../scripts/scrape-karoli/parse';

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/karoli');

const fixture = (name: string): string =>
  fs.readFileSync(path.join(FIXTURE_DIR, `${name}.html`), 'utf-8');

const bookListHtml = fixture('book-list');
const rutHtml = fixture('RUT');
const rut1Html = fixture('RUT-1');
const ps23Html = fixture('PS-23');
const emptyChapterHtml = fixture('empty-chapter');

describe('parseBookList', () => {
  const books = parseBookList(bookListHtml);

  it('finds all 66 books', () => {
    expect(books).toHaveLength(66);
  });

  it('splits them into 39 old testament and 27 new testament books', () => {
    expect(books.filter((book) => book.testament === 'old')).toHaveLength(39);
    expect(books.filter((book) => book.testament === 'new')).toHaveLength(27);
  });

  it('reads the site code from the href and the name from the link text', () => {
    expect(books[0]).toEqual({ code: 'GEN', name: '1. Mózes', testament: 'old' });
    expect(books[65]).toEqual({ code: 'REV', name: 'Jelenések', testament: 'new' });
  });

  it('keeps the old testament books before the new testament ones', () => {
    const firstNew = books.findIndex((book) => book.testament === 'new');
    expect(firstNew).toBe(39);
    expect(books.slice(firstNew).every((book) => book.testament === 'new')).toBe(true);
  });

  it('throws EmptyPageError when the page has no book list', () => {
    expect(() => parseBookList('<html><body></body></html>')).toThrow(EmptyPageError);
  });
});

describe('parseChapterList', () => {
  it('reads the chapter numbers of Ruth', () => {
    expect(parseChapterList(rutHtml)).toEqual([1, 2, 3, 4]);
  });

  it('reads all 150 chapters of the Psalms from a chapter page', () => {
    expect(parseChapterList(ps23Html)).toHaveLength(150);
  });

  it('throws EmptyPageError when the list is empty', () => {
    expect(() => parseChapterList('<ul class="bible-chapter-list"></ul>')).toThrow(EmptyPageError);
  });
});

describe('parseChapter', () => {
  const rut1 = parseChapter(rut1Html);
  const ps23 = parseChapter(ps23Html);

  it('reads all 22 verses of Ruth 1', () => {
    expect(rut1).toHaveLength(22);
  });

  it('numbers the verses 1..n in order', () => {
    expect(rut1.map((verse) => verse.verse)).toEqual(
      Array.from({ length: 22 }, (_, index) => index + 1),
    );
  });

  it('gives every verse a non empty text', () => {
    expect(rut1[0].text.length).toBeGreaterThan(0);
    expect(rut1.every((verse) => verse.text.trim() !== '')).toBe(true);
  });

  it('keeps the bracketed title of Psalm 23 in verse 1', () => {
    expect(ps23[0].verse).toBe(1);
    expect(ps23[0].text).toContain('[Dávid zsoltára.]');
  });

  it('decodes HTML entities instead of leaving them in the text', () => {
    const texts = [...rut1, ...ps23].map((verse) => verse.text);
    for (const text of texts) {
      expect(text).not.toContain('&amp;');
      expect(text).not.toMatch(/&[a-z]+;|&#\d+;/i);
    }
  });

  it('normalizes the whitespace of the source markup', () => {
    expect(rut1.every((verse) => verse.text === verse.text.trim())).toBe(true);
    expect(rut1.every((verse) => !/\s\s/.test(verse.text))).toBe(true);
  });

  it('throws EmptyPageError for a chapter the site does not have', () => {
    expect(() => parseChapter(emptyChapterHtml)).toThrow(EmptyPageError);
  });
});
