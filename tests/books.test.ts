import {
  BOOKS,
  findBook,
  getBooks,
  getNewTestamentBooks,
  getOldTestamentBooks,
  normalizeKey,
} from '../src/books';
import type { BookId } from '../src/types';

const CANONICAL_ORDER: BookId[] = [
  'GEN',
  'EXO',
  'LEV',
  'NUM',
  'DEU',
  'JOS',
  'JDG',
  'RUT',
  '1SA',
  '2SA',
  '1KI',
  '2KI',
  '1CH',
  '2CH',
  'EZR',
  'NEH',
  'EST',
  'JOB',
  'PSA',
  'PRO',
  'ECC',
  'SNG',
  'ISA',
  'JER',
  'LAM',
  'EZK',
  'DAN',
  'HOS',
  'JOL',
  'AMO',
  'OBA',
  'JON',
  'MIC',
  'NAM',
  'HAB',
  'ZEP',
  'HAG',
  'ZEC',
  'MAL',
  'MAT',
  'MRK',
  'LUK',
  'JHN',
  'ACT',
  'ROM',
  '1CO',
  '2CO',
  'GAL',
  'EPH',
  'PHP',
  'COL',
  '1TH',
  '2TH',
  '1TI',
  '2TI',
  'TIT',
  'PHM',
  'HEB',
  'JAS',
  '1PE',
  '2PE',
  '1JN',
  '2JN',
  '3JN',
  'JUD',
  'REV',
];

describe('the canonical book table', () => {
  it('holds the 66 books in canonical order', () => {
    expect(BOOKS.map((book) => book.id)).toEqual(CANONICAL_ORDER);
  });

  it('numbers the books 1 through 66', () => {
    expect(BOOKS.map((book) => book.order)).toEqual(CANONICAL_ORDER.map((_, index) => index + 1));
  });

  it('splits into 39 Old Testament and 27 New Testament books', () => {
    expect(getOldTestamentBooks()).toHaveLength(39);
    expect(getNewTestamentBooks()).toHaveLength(27);
    expect(getOldTestamentBooks().every((book) => book.testament === 'old')).toBe(true);
    expect(getNewTestamentBooks().every((book) => book.testament === 'new')).toBe(true);
  });

  it('puts every Old Testament book before every New Testament book', () => {
    const firstNew = BOOKS.findIndex((book) => book.testament === 'new');
    expect(BOOKS[firstNew].id).toBe('MAT');
    expect(BOOKS.slice(0, firstNew).every((book) => book.testament === 'old')).toBe(true);
  });

  it('gives every book a non empty abbreviation and at least one alias', () => {
    for (const book of BOOKS) {
      expect(book.abbreviation.length).toBeGreaterThan(0);
      expect(book.aliases.length).toBeGreaterThan(0);
    }
  });

  it('has a unique normalized key for every id, abbreviation and alias', () => {
    const owners = new Map<string, BookId>();
    const collisions: string[] = [];

    for (const book of BOOKS) {
      for (const key of [book.id, book.abbreviation, ...book.aliases]) {
        const normalized = normalizeKey(key);
        const owner = owners.get(normalized);
        if (owner && owner !== book.id) {
          collisions.push(`${normalized} (${owner} and ${book.id})`);
        }
        owners.set(normalized, book.id);
      }
    }

    expect(collisions).toEqual([]);
  });

  it('returns copies so callers cannot mutate the table', () => {
    const books = getBooks();
    books[0].aliases.push('sabotage');
    books[0].abbreviation = 'sabotage';

    expect(BOOKS[0].abbreviation).toBe('1Móz');
    expect(BOOKS[0].aliases).not.toContain('sabotage');
    expect(getBooks()[0].aliases).not.toContain('sabotage');
  });

  it('lists all 66 books through getBooks', () => {
    expect(getBooks()).toHaveLength(66);
    expect(getBooks().map((book) => book.id)).toEqual([
      ...getOldTestamentBooks().map((book) => book.id),
      ...getNewTestamentBooks().map((book) => book.id),
    ]);
  });
});

describe('normalizeKey', () => {
  it('drops dots, inner spaces, diacritics and case', () => {
    expect(normalizeKey('1. Mózes')).toBe('1mozes');
    expect(normalizeKey('1Mózes')).toBe('1mozes');
    expect(normalizeKey('  ÉNEKEK   ÉNEKE  ')).toBe('enekekeneke');
    expect(normalizeKey('Zsidókhoz írt levél')).toBe('zsidokhozirtlevel');
  });

  it('strips the Hungarian double acute letters', () => {
    expect(normalizeKey('Mózes első könyve')).toBe('mozeselsokonyve');
    expect(normalizeKey('bűnbeesés')).toBe('bunbeeses');
  });
});

describe('findBook', () => {
  it.each([
    ['1Móz', 'GEN'],
    ['1Moz', 'GEN'],
    ['1. Mózes', 'GEN'],
    ['1mozes', 'GEN'],
    ['GEN', 'GEN'],
    ['gen', 'GEN'],
    ['Mózes első könyve', 'GEN'],
    ['Zsoltárok', 'PSA'],
    ['Zsolt', 'PSA'],
    ['zsoltarok', 'PSA'],
    ['Énekek éneke', 'SNG'],
    ['Jeremiás siralmai', 'LAM'],
    ['Apostolok Cselekedetei', 'ACT'],
    ['ApCsel', 'ACT'],
    ['Zsidókhoz írt levél', 'HEB'],
    ['  Jn  ', 'JHN'],
  ])('resolves %s to %s', (input, expected) => {
    expect(findBook(input)?.id).toBe(expected);
  });

  it('keeps the lookalike abbreviations apart', () => {
    expect(findBook('Ez')?.id).toBe('EZK');
    expect(findBook('Ezsd')?.id).toBe('EZR');
    expect(findBook('Ézs')?.id).toBe('ISA');
    expect(findBook('Jn')?.id).toBe('JHN');
    expect(findBook('Jón')?.id).toBe('JON');
    expect(findBook('Jóel')?.id).toBe('JOL');
  });

  it('does not match on a prefix', () => {
    expect(findBook('Zsolta')).toBeUndefined();
    expect(findBook('J')).toBeUndefined();
    expect(findBook('Móz')).toBeUndefined();
  });

  it('returns undefined for input it cannot resolve', () => {
    expect(findBook('nincs ilyen')).toBeUndefined();
    expect(findBook('')).toBeUndefined();
    expect(findBook('   ')).toBeUndefined();
    expect(findBook(undefined as unknown as string)).toBeUndefined();
  });

  it('resolves every id, abbreviation and alias back to its own book', () => {
    for (const book of BOOKS) {
      for (const key of [book.id, book.abbreviation, ...book.aliases]) {
        expect(findBook(key)?.id).toBe(book.id);
      }
    }
  });
});
