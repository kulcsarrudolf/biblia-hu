import { BibliaError, isBibliaError } from '../src/errors';
import { formatReference, parseReference } from '../src/reference';
import { TRANSLATIONS } from '../src/translations';
import { normalizeWhitespace, stripDiacritics } from '../src/utils/text';

/** Asserts that a call throws a BibliaError with the given code. */
const expectCode = (call: () => unknown, code: string): void => {
  expect(call).toThrow(BibliaError);
  try {
    call();
  } catch (error) {
    expect(isBibliaError(error)).toBe(true);
    expect((error as BibliaError).code).toBe(code);
    expect((error as BibliaError).message.length).toBeGreaterThan(0);
  }
};

describe('parseReference, ported from the biblia-ruf passage parser tests', () => {
  it('parses a full chapter and leaves the verse bounds unset', () => {
    expect(parseReference('Zsolt 139')).toEqual([{ book: 'PSA', chapter: 139 }]);
  });

  it('parses consecutive verses from a chapter', () => {
    expect(parseReference('Zsolt 139:23-24')).toEqual([
      { book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 },
    ]);
  });

  it('parses specific verses from a chapter', () => {
    expect(parseReference('Zsolt 139:3,23-24')).toEqual([
      { book: 'PSA', chapter: 139, startVerse: 3, endVerse: 3 },
      { book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 },
    ]);
  });

  it('parses multiple passages separated by semicolons', () => {
    expect(parseReference('Zsolt 139:3,23-24; Zsolt 100:1-2; Zsolt 1;Péld 10')).toEqual([
      { book: 'PSA', chapter: 139, startVerse: 3, endVerse: 3 },
      { book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 },
      { book: 'PSA', chapter: 100, startVerse: 1, endVerse: 2 },
      { book: 'PSA', chapter: 1 },
      { book: 'PRO', chapter: 10 },
    ]);
  });

  it('parses two single verses', () => {
    expect(parseReference('Zsolt 139:3,23')).toEqual([
      { book: 'PSA', chapter: 139, startVerse: 3, endVerse: 3 },
      { book: 'PSA', chapter: 139, startVerse: 23, endVerse: 23 },
    ]);
  });
});

describe('parseReference grammar', () => {
  it('accepts a book token that contains spaces and dots', () => {
    expect(parseReference('1. Móz 3')).toEqual([{ book: 'GEN', chapter: 3 }]);
    expect(parseReference('Énekek éneke 2')).toEqual([{ book: 'SNG', chapter: 2 }]);
    expect(parseReference('Jeremiás siralmai 3:22-23')).toEqual([
      { book: 'LAM', chapter: 3, startVerse: 22, endVerse: 23 },
    ]);
    expect(parseReference('Apostolok Cselekedetei 2:42')).toEqual([
      { book: 'ACT', chapter: 2, startVerse: 42, endVerse: 42 },
    ]);
  });

  it('accepts a canonical id as the book token', () => {
    expect(parseReference('JHN 3:16')).toEqual([
      { book: 'JHN', chapter: 3, startVerse: 16, endVerse: 16 },
    ]);
  });

  it('tolerates extra whitespace and a trailing semicolon', () => {
    expect(parseReference('  Jn   3 : 16  ;  ')).toEqual([
      { book: 'JHN', chapter: 3, startVerse: 16, endVerse: 16 },
    ]);
  });

  it('treats a single verse range as a one verse range', () => {
    expect(parseReference('Jn 3:16-16')).toEqual([
      { book: 'JHN', chapter: 3, startVerse: 16, endVerse: 16 },
    ]);
  });

  it('throws INVALID_REFERENCE when the chapter is missing', () => {
    expectCode(() => parseReference('Jn'), 'INVALID_REFERENCE');
    expectCode(() => parseReference('Jn :16'), 'INVALID_REFERENCE');
  });

  it('throws INVALID_REFERENCE for an empty reference', () => {
    expectCode(() => parseReference(''), 'INVALID_REFERENCE');
    expectCode(() => parseReference('   '), 'INVALID_REFERENCE');
    expectCode(() => parseReference(';;'), 'INVALID_REFERENCE');
  });

  it('throws INVALID_REFERENCE for a non string input', () => {
    expectCode(() => parseReference(undefined as unknown as string), 'INVALID_REFERENCE');
  });

  it('throws INVALID_REFERENCE for a malformed verse spec', () => {
    expectCode(() => parseReference('Jn 3:16a'), 'INVALID_REFERENCE');
    expectCode(() => parseReference('Jn 3:'), 'INVALID_REFERENCE');
    expectCode(() => parseReference('Jn 3:16,'), 'INVALID_REFERENCE');
  });

  it('throws INVALID_REFERENCE for zero and inverted ranges', () => {
    expectCode(() => parseReference('Jn 0'), 'INVALID_REFERENCE');
    expectCode(() => parseReference('Jn 3:0'), 'INVALID_REFERENCE');
    expectCode(() => parseReference('Jn 3:0-2'), 'INVALID_REFERENCE');
    expectCode(() => parseReference('Jn 3:5-2'), 'INVALID_REFERENCE');
  });

  it('throws UNKNOWN_BOOK for a book it cannot resolve', () => {
    expectCode(() => parseReference('Xyz 3'), 'UNKNOWN_BOOK');
    expectCode(() => parseReference('Zsolt 1; Xyz 3'), 'UNKNOWN_BOOK');
  });

  it('does not accept a prefix of a book name', () => {
    expectCode(() => parseReference('Zsolta 1'), 'UNKNOWN_BOOK');
  });
});

describe('formatReference', () => {
  it('prints a whole chapter, a single verse and a range', () => {
    expect(formatReference({ book: 'PSA', chapter: 100 })).toBe('Zsolt 100');
    expect(formatReference({ book: 'PSA', chapter: 139, startVerse: 3, endVerse: 3 })).toBe(
      'Zsolt 139:3',
    );
    expect(formatReference({ book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 })).toBe(
      'Zsolt 139:23-24',
    );
  });

  it('fills in a missing bound from the other one', () => {
    expect(formatReference({ book: 'JHN', chapter: 3, startVerse: 16 })).toBe('Jn 3:16');
    expect(formatReference({ book: 'JHN', chapter: 3, endVerse: 16 })).toBe('Jn 3:16');
  });

  it('accepts a plain name, a canonical book and a translation book', () => {
    const segment = { book: 'JHN' as const, chapter: 3, startVerse: 16, endVerse: 16 };
    expect(formatReference(segment, 'János evangéliuma')).toBe('János evangéliuma 3:16');
    expect(formatReference(segment, canonicalJohn())).toBe('Jn 3:16');
    expect(
      formatReference(segment, { ...canonicalJohn(), name: TRANSLATIONS.KAROLI.bookNames.JHN }),
    ).toBe('János 3:16');
  });

  it('throws UNKNOWN_BOOK for an id that is not in the canon', () => {
    expectCode(() => formatReference({ book: 'NOPE' as never, chapter: 1 }), 'UNKNOWN_BOOK');
  });

  it('round trips every parsed segment', () => {
    for (const ref of ['Zsolt 100', 'Zsolt 139:3', 'Zsolt 139:23-24', 'Jn 3:16']) {
      expect(parseReference(ref).map((segment) => formatReference(segment))).toEqual([ref]);
    }
  });
});

describe('text helpers', () => {
  it('normalizes whitespace', () => {
    expect(normalizeWhitespace('  Kezdetben   teremtette \n Isten  ')).toBe(
      'Kezdetben teremtette Isten',
    );
  });

  it('strips diacritics', () => {
    expect(stripDiacritics('Ézsaiás próféta könyve')).toBe('Ezsaias profeta konyve');
  });
});

describe('BibliaError', () => {
  it('keeps the code, the name and instanceof', () => {
    const error = new BibliaError('CHAPTER_NOT_FOUND', 'nincs ilyen fejezet');
    expect(error).toBeInstanceOf(BibliaError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BibliaError');
    expect(error.code).toBe('CHAPTER_NOT_FOUND');
    expect(isBibliaError(error)).toBe(true);
  });

  it('recognizes a structurally equal error from another realm', () => {
    expect(isBibliaError({ name: 'BibliaError', code: 'UNKNOWN_BOOK' })).toBe(true);
    expect(isBibliaError(new Error('plain'))).toBe(false);
    expect(isBibliaError(null)).toBe(false);
    expect(isBibliaError('nope')).toBe(false);
  });
});

/** The canonical John entry, used to exercise the formatter overloads. */
function canonicalJohn() {
  return {
    id: 'JHN' as const,
    order: 43,
    testament: 'new' as const,
    abbreviation: 'Jn',
    aliases: ['János'],
  };
}
