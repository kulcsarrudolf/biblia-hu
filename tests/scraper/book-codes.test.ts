import * as fs from 'fs';
import * as path from 'path';

import { BOOKS } from '../../src/books';
import { KAROLI_SITE_CODES, siteCode } from '../../scripts/scrape-karoli/book-codes';
import { parseBookList } from '../../scripts/scrape-karoli/parse';

const bookListHtml = fs.readFileSync(
  path.resolve(__dirname, '../fixtures/karoli/book-list.html'),
  'utf-8',
);

describe('siteCode', () => {
  it('returns the canonical id for a book the site does not rename', () => {
    expect(siteCode('GEN')).toBe('GEN');
    expect(siteCode('REV')).toBe('REV');
  });

  it('returns the site code for a renamed book', () => {
    expect(siteCode('JDG')).toBe('JUG');
    expect(siteCode('PSA')).toBe('PS');
    expect(siteCode('JAS')).toBe('JAM');
  });

  it('overrides exactly 17 books', () => {
    expect(Object.keys(KAROLI_SITE_CODES)).toHaveLength(17);
  });
});

describe('the site book list', () => {
  const codes = parseBookList(bookListHtml).map((book) => book.code);

  it('matches the canonical book order code for code', () => {
    expect(codes).toEqual(BOOKS.map((book) => siteCode(book.id)));
  });

  it('has no duplicate codes', () => {
    expect(new Set(codes).size).toBe(codes.length);
  });
});
