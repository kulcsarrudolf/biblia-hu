import { biblia } from '../src/bible';
import { findBook } from '../src/books';
import { CURATED_VERSES, curatedVerseFor } from '../src/daily-verse';
import { formatReference } from '../src/reference';
import { TRANSLATION_IDS } from '../src/translations';

describe('the curated rotation', () => {
  it('holds 51 entries', () => {
    expect(CURATED_VERSES).toHaveLength(51);
  });

  it('names only canonical books', () => {
    for (const entry of CURATED_VERSES) {
      expect(findBook(entry.book)?.id).toBe(entry.book);
      expect(entry.chapter).toBeGreaterThan(0);
      expect(entry.verse).toBeGreaterThan(0);
    }
  });

  it('picks the entry from the local calendar date, not the clock', () => {
    const morning = new Date(2024, 0, 1, 0, 0, 0);
    const evening = new Date(2024, 0, 1, 23, 59, 59);

    expect(curatedVerseFor(evening)).toEqual(curatedVerseFor(morning));
  });
});

describe.each(TRANSLATION_IDS)('getDailyVerse (%s)', (translationId) => {
  const bible = biblia(translationId);

  it('returns a verse with text', async () => {
    const verse = await bible.getDailyVerse();

    expect(verse.text.length).toBeGreaterThan(0);
    expect(verse.reference.length).toBeGreaterThan(0);
    expect(verse.bookInfo.id).toBe(verse.book);
    expect(verse.bookInfo.name).toBe(bible.translation.bookNames[verse.book]);
  });

  it('returns the same verse for the same date', async () => {
    const date = new Date(2024, 0, 1);

    expect(await bible.getDailyVerse(date)).toEqual(await bible.getDailyVerse(date));
  });

  it('returns the verse the rotation selected for that date', async () => {
    const date = new Date(2024, 5, 15);
    const entry = curatedVerseFor(date);
    const verse = await bible.getDailyVerse(date);

    expect(verse.book).toBe(entry.book);
    expect(verse.chapter).toBe(entry.chapter);
    expect(verse.verse).toBe(entry.verse);
    expect(verse.reference).toBe(
      formatReference({
        book: entry.book,
        chapter: entry.chapter,
        startVerse: entry.verse,
        endVerse: entry.verse,
      }),
    );
  });

  it('spreads different dates over different verses', async () => {
    const references = new Set<string>();
    for (let day = 1; day <= 30; day++) {
      references.add((await bible.getDailyVerse(new Date(2024, 0, day))).reference);
    }

    expect(references.size).toBeGreaterThan(1);
  });

  it('resolves every curated verse to non empty text', async () => {
    for (const entry of CURATED_VERSES) {
      const chapter = await bible.getChapter(entry.book, entry.chapter);
      const verse = chapter.verses.find((candidate) => candidate.verse === entry.verse);

      expect(verse).toBeDefined();
      expect(verse?.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('resolves every entry of the rotation over a year of dates', async () => {
    const seen = new Set<string>();
    for (let day = 0; day < 366; day++) {
      const date = new Date(2024, 0, 1 + day);
      const verse = await bible.getDailyVerse(date);

      expect(verse.text.trim().length).toBeGreaterThan(0);
      seen.add(verse.reference);
    }

    expect(seen.size).toBe(CURATED_VERSES.length);
  });
});
