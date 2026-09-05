import { biblia } from '../src/bible';
import { TRANSLATION_IDS } from '../src/translations';
import { expectBibliaError } from './fixtures/errors';
import { expectationsFor } from './fixtures/expected-texts';

describe.each(TRANSLATION_IDS)('getPassage (%s)', (translationId) => {
  const bible = biblia(translationId);
  const expected = expectationsFor(translationId);

  it('returns a single verse with its text', async () => {
    const passage = await bible.getPassage('Jn 3:16');

    expect(passage.translation).toBe(translationId);
    expect(passage.reference).toBe('Jn 3:16');
    expect(passage.segments).toHaveLength(1);
    expect(passage.verses).toEqual([
      { book: 'JHN', chapter: 3, verse: 16, text: expected.john316 },
    ]);
  });

  it('describes the segment it resolved', async () => {
    const [segment] = (await bible.getPassage('Jn 3:16')).segments;

    expect(segment.book).toBe('JHN');
    expect(segment.chapter).toBe(3);
    expect(segment.startVerse).toBe(16);
    expect(segment.endVerse).toBe(16);
    expect(segment.reference).toBe('Jn 3:16');
    expect(segment.bookInfo.id).toBe('JHN');
    expect(segment.bookInfo.name).toBe(bible.translation.bookNames.JHN);
    expect(segment.verses).toHaveLength(1);
  });

  it('returns a range of verses', async () => {
    const passage = await bible.getPassage('Zsolt 139:23-24');

    expect(passage.reference).toBe('Zsolt 139:23-24');
    expect(passage.verses.map((verse) => verse.text)).toEqual(expected.psalm139End);
    expect(passage.verses.map((verse) => verse.verse)).toEqual([23, 24]);
  });

  it('returns every verse of a whole chapter', async () => {
    const passage = await bible.getPassage('Zsolt 100');
    const [segment] = passage.segments;

    expect(passage.verses).toHaveLength(expected.psalm100Verses);
    expect(segment.startVerse).toBe(1);
    expect(segment.endVerse).toBe(expected.psalm100Verses);
    expect(segment.reference).toBe(`Zsolt 100:1-${expected.psalm100Verses}`);
    expect(passage.verses.every((verse) => verse.text.length > 0)).toBe(true);
  });

  it('resolves every segment of a multi segment reference', async () => {
    const passage = await bible.getPassage('Zsolt 139:3,23-24; Jn 3:16');

    expect(passage.segments.map((segment) => segment.reference)).toEqual([
      'Zsolt 139:3',
      'Zsolt 139:23-24',
      'Jn 3:16',
    ]);
    expect(passage.reference).toBe('Zsolt 139:3; Zsolt 139:23-24; Jn 3:16');
    expect(passage.verses).toHaveLength(4);
    expect(passage.verses.map((verse) => verse.book)).toEqual(['PSA', 'PSA', 'PSA', 'JHN']);
  });

  it('flattens the verses in reference order', async () => {
    const passage = await bible.getPassage('Jn 3:16; Zsolt 100');

    expect(passage.verses).toHaveLength(1 + expected.psalm100Verses);
    expect(passage.verses[0].book).toBe('JHN');
    expect(passage.verses[1].book).toBe('PSA');
  });

  it('accepts a book written the way this translation names it', async () => {
    const name = bible.translation.bookNames.JHN;
    const passage = await bible.getPassage(`${name} 3:16`);

    expect(passage.verses[0].text).toBe(expected.john316);
  });

  it('throws CHAPTER_NOT_FOUND past the last chapter', async () => {
    await expectBibliaError(bible.getPassage('Jn 99'), 'CHAPTER_NOT_FOUND');
  });

  it('throws VERSE_NOT_FOUND past the last verse', async () => {
    await expectBibliaError(bible.getPassage('Jn 3:999'), 'VERSE_NOT_FOUND');
  });

  it('throws VERSE_NOT_FOUND when only the end of the range is out of range', async () => {
    await expectBibliaError(bible.getPassage('Zsolt 100:1-99'), 'VERSE_NOT_FOUND');
  });

  it('throws UNKNOWN_BOOK for a book nobody knows', async () => {
    await expectBibliaError(bible.getPassage('Nincsilyen 1'), 'UNKNOWN_BOOK');
  });

  it('throws INVALID_REFERENCE for a reference it cannot parse', async () => {
    await expectBibliaError(bible.getPassage('csak szöveg'), 'INVALID_REFERENCE');
  });

  it('names the book and the available range in the error message', async () => {
    expect.assertions(2);

    try {
      await bible.getPassage('Jn 3:999');
    } catch (error) {
      expect((error as Error).message).toContain(bible.translation.bookNames.JHN);
      expect((error as Error).message).toContain('1-36');
    }
  });
});

describe.each(TRANSLATION_IDS)('getChapter (%s)', (translationId) => {
  const bible = biblia(translationId);
  const expected = expectationsFor(translationId);

  it('returns the whole chapter', async () => {
    const chapter = await bible.getChapter('Zsolt', 100);

    expect(chapter.chapter).toBe(100);
    expect(chapter.book.id).toBe('PSA');
    expect(chapter.book.name).toBe(bible.translation.bookNames.PSA);
    expect(chapter.verses).toHaveLength(expected.psalm100Verses);
    expect(chapter.verses[0]).toEqual({
      book: 'PSA',
      chapter: 100,
      verse: 1,
      text: expect.any(String),
    });
  });

  it('carries the chapter title exactly when the translation has one', async () => {
    const genesis = await bible.getChapter('1Móz', 1);
    const psalm = await bible.getChapter('Zsolt', 100);

    if (expected.hasChapterTitles) {
      expect(genesis.title).toBe(expected.genesis1Title);
      expect(psalm.title).toBe(expected.psalm100Title);
    } else {
      expect(genesis).not.toHaveProperty('title');
      expect(psalm).not.toHaveProperty('title');
    }
  });

  it('accepts an id, an abbreviation and this translation name', async () => {
    const byId = await bible.getChapter('JHN', 3);
    const byAbbreviation = await bible.getChapter('Jn', 3);
    const byName = await bible.getChapter(bible.translation.bookNames.JHN, 3);

    expect(byAbbreviation).toEqual(byId);
    expect(byName).toEqual(byId);
  });

  it('throws CHAPTER_NOT_FOUND for a chapter the book does not have', async () => {
    await expectBibliaError(bible.getChapter('Zsolt', 151), 'CHAPTER_NOT_FOUND');
  });

  it('throws UNKNOWN_BOOK for an unknown book', async () => {
    await expectBibliaError(bible.getChapter('Nincsilyen', 1), 'UNKNOWN_BOOK');
  });
});
