import { biblia } from '../src/bible';
import { TRANSLATION_IDS } from '../src/translations';
import { expectBibliaError } from './fixtures/errors';
import { expectationsFor } from './fixtures/expected-texts';
import { expectedChapterCounts } from './fixtures/chapter-counts';

describe.each(TRANSLATION_IDS)('getBookDetails (%s)', (translationId) => {
  const bible = biblia(translationId);
  const expected = expectationsFor(translationId);
  const chapterCounts = expectedChapterCounts(translationId);

  it('summarizes the Psalms', async () => {
    const details = await bible.getBookDetails('Zsolt');

    expect(details.book.id).toBe('PSA');
    expect(details.book.name).toBe(bible.translation.bookNames.PSA);
    expect(details.chapters).toBe(chapterCounts.PSA);
    expect(details.versesPerChapter[100]).toBe(expected.psalm100Verses);
    expect(details.verses).toBeGreaterThan(2000);
  });

  it('summarizes Genesis', async () => {
    const details = await bible.getBookDetails('1Móz');

    expect(details.book.id).toBe('GEN');
    expect(details.chapters).toBe(chapterCounts.GEN);
    expect(details.versesPerChapter[1]).toBe(31);
  });

  it('reports versesPerChapter as a plain object keyed by chapter', async () => {
    const details = await bible.getBookDetails('Ruth');

    expect(Object.getPrototypeOf(details.versesPerChapter)).toBe(Object.prototype);
    expect(Object.keys(details.versesPerChapter)).toHaveLength(details.chapters);
    expect(JSON.parse(JSON.stringify(details.versesPerChapter))).toEqual(details.versesPerChapter);
  });

  it('counts the same verses in the total and per chapter', async () => {
    const details = await bible.getBookDetails('Jn');
    const summed = Object.values(details.versesPerChapter).reduce((sum, count) => sum + count, 0);

    expect(summed).toBe(details.verses);
  });

  it('carries chapter titles exactly when the translation has them', async () => {
    const details = await bible.getBookDetails('1Móz');

    if (expected.hasChapterTitles) {
      expect(details.chapterTitles?.[1]).toBe(expected.genesis1Title);
      expect(Object.keys(details.chapterTitles ?? {})).toHaveLength(details.chapters);
    } else {
      expect(details).not.toHaveProperty('chapterTitles');
    }
  });

  it('accepts an id, an abbreviation and this translation name', async () => {
    const byId = await bible.getBookDetails('JHN');
    const byAbbreviation = await bible.getBookDetails('Jn');
    const byName = await bible.getBookDetails(bible.translation.bookNames.JHN);

    expect(byAbbreviation).toEqual(byId);
    expect(byName).toEqual(byId);
  });

  it('matches the expected chapter count of every book', async () => {
    for (const book of bible.getBooks()) {
      const details = await bible.getBookDetails(book.id);
      expect(details.chapters).toBe(chapterCounts[book.id]);
    }
  });

  it('throws UNKNOWN_BOOK for an unknown book', async () => {
    await expectBibliaError(bible.getBookDetails('InvalidBook'), 'UNKNOWN_BOOK');
  });
});
