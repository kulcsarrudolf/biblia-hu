import { biblia } from '../src/bible';
import { findBook } from '../src/books';
import { DEFAULT_SEARCH_LIMIT } from '../src/search';
import { TRANSLATION_IDS } from '../src/translations';
import { expectBibliaError } from './fixtures/errors';
import { expectationsFor } from './fixtures/expected-texts';

describe.each(TRANSLATION_IDS)('search (%s)', (translationId) => {
  const bible = biblia(translationId);
  const expected = expectationsFor(translationId);

  it('finds a common word', async () => {
    const results = await bible.search('szeretet', { limit: 10 });

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.text.toLowerCase()).toContain('szeretet');
    }
  });

  it('returns nothing for text that is not there', async () => {
    expect(await bible.search('xyznonexistent12345')).toEqual([]);
  });

  it('returns nothing for an empty query', async () => {
    expect(await bible.search('')).toEqual([]);
  });

  it('returns nothing when the limit leaves no room', async () => {
    expect(await bible.search('Isten', { limit: 0 })).toEqual([]);
  });

  it('stops at the requested limit', async () => {
    const results = await bible.search('az', { limit: 5 });

    expect(results).toHaveLength(5);
  });

  it('stops at 100 results by default', async () => {
    const results = await bible.search('a');

    expect(DEFAULT_SEARCH_LIMIT).toBe(100);
    expect(results).toHaveLength(DEFAULT_SEARCH_LIMIT);
  });

  it('carries the book, the reference and the translation name', async () => {
    const [result] = await bible.search('Isten', { limit: 1 });

    expect(result.bookInfo.id).toBe(result.book);
    expect(result.bookInfo.name).toBe(bible.translation.bookNames[result.book]);
    expect(result.reference).toBe(
      `${findBook(result.book)?.abbreviation} ${result.chapter}:${result.verse}`,
    );
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('treats the query as a literal substring, so punctuation cannot throw', async () => {
    const results = await bible.search('(', { limit: 5 });

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.text).toContain('(');
    }
  });

  it('does not read regular expression syntax in literal mode', async () => {
    expect(await bible.search('szeretet.*')).toEqual([]);
  });

  it('compiles the query as a regular expression with regex true', async () => {
    const results = await bible.search(`^${expected.genesisOpening}`, { regex: true, limit: 5 });

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.text.startsWith(expected.genesisOpening)).toBe(true);
    }
  });

  it('lets an invalid regular expression surface as a SyntaxError', async () => {
    await expect(bible.search('(', { regex: true })).rejects.toThrow(SyntaxError);
  });

  it('ignores case by default and respects it on request', async () => {
    const sensitive = await bible.search('ISTEN', { caseSensitive: true, limit: 50 });
    const insensitive = await bible.search('ISTEN', { limit: 50 });

    expect(insensitive.length).toBeGreaterThan(sensitive.length);
    for (const result of sensitive) {
      expect(result.text).toContain('ISTEN');
    }
    for (const result of insensitive) {
      expect(result.text.toLowerCase()).toContain('isten');
    }
  });

  it('filters by testament', async () => {
    const old = await bible.search('Isten', { testament: 'old', limit: 5 });
    const current = await bible.search('Isten', { testament: 'new', limit: 5 });

    expect(old.length).toBeGreaterThan(0);
    expect(current.length).toBeGreaterThan(0);
    for (const result of old) {
      expect(result.bookInfo.testament).toBe('old');
    }
    for (const result of current) {
      expect(result.bookInfo.testament).toBe('new');
    }
  });

  it('filters by book, by abbreviation or by this translation name', async () => {
    const byAbbreviation = await bible.search('szeretet', { book: 'Jn', limit: 10 });
    const byName = await bible.search('szeretet', {
      book: bible.translation.bookNames.JHN,
      limit: 10,
    });

    expect(byAbbreviation.length).toBeGreaterThan(0);
    expect(byName).toEqual(byAbbreviation);
    for (const result of byAbbreviation) {
      expect(result.book).toBe('JHN');
    }
  });

  it('throws UNKNOWN_BOOK when the book filter names no book', async () => {
    await expectBibliaError(bible.search('Isten', { book: 'Nincsilyen' }), 'UNKNOWN_BOOK');
  });

  it('returns results in canonical order', async () => {
    const results = await bible.search('Isten', { limit: 20 });
    const orders = results.map((result) => result.bookInfo.order);

    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
});
