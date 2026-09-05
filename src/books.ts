import type { CanonicalBook } from './types';
import { normalizeWhitespace, stripDiacritics } from './utils/text';

export type { BookId, CanonicalBook, Testament } from './types';

/**
 * Reduces a book name or abbreviation to a lookup key.
 *
 * Trims, drops abbreviation dots, removes every inner space, strips diacritics
 * and lowercases, so that '1. Mozes', '1Mozes' and '1Mózes' all collapse to
 * '1mozes'.
 */
export const normalizeKey = (input: string): string =>
  stripDiacritics(normalizeWhitespace(input).replace(/\./g, '')).replace(/\s+/g, '').toLowerCase();

/**
 * The 66 books of the Protestant canon in canonical order.
 *
 * `abbreviation` is the short RÚF form. `aliases` holds the longer RÚF form,
 * the name the Károli source site uses, the full RÚF title and the common
 * variants people type. Ids, abbreviations and aliases share one namespace and
 * every normalized key in it is unique, which the test suite enforces.
 */
export const BOOKS: readonly CanonicalBook[] = [
  {
    id: 'GEN',
    order: 1,
    testament: 'old',
    abbreviation: '1Móz',
    aliases: ['1Mózes', 'Mózes első könyve'],
  },
  {
    id: 'EXO',
    order: 2,
    testament: 'old',
    abbreviation: '2Móz',
    aliases: ['2Mózes', 'Mózes második könyve'],
  },
  {
    id: 'LEV',
    order: 3,
    testament: 'old',
    abbreviation: '3Móz',
    aliases: ['3Mózes', 'Mózes harmadik könyve'],
  },
  {
    id: 'NUM',
    order: 4,
    testament: 'old',
    abbreviation: '4Móz',
    aliases: ['4Mózes', 'Mózes negyedik könyve'],
  },
  {
    id: 'DEU',
    order: 5,
    testament: 'old',
    abbreviation: '5Móz',
    aliases: ['5Mózes', 'Mózes ötödik könyve'],
  },
  {
    id: 'JOS',
    order: 6,
    testament: 'old',
    abbreviation: 'Józs',
    aliases: ['Józsué', 'Józsué könyve'],
  },
  {
    id: 'JDG',
    order: 7,
    testament: 'old',
    abbreviation: 'Bír',
    aliases: ['Bírák', 'A bírák könyve', 'Bírák könyve'],
  },
  {
    id: 'RUT',
    order: 8,
    testament: 'old',
    abbreviation: 'Ruth',
    aliases: ['Ruth könyve'],
  },
  {
    id: '1SA',
    order: 9,
    testament: 'old',
    abbreviation: '1Sám',
    aliases: ['1Sámuel', 'Sámuel első könyve'],
  },
  {
    id: '2SA',
    order: 10,
    testament: 'old',
    abbreviation: '2Sám',
    aliases: ['2Sámuel', 'Sámuel második könyve'],
  },
  {
    id: '1KI',
    order: 11,
    testament: 'old',
    abbreviation: '1Kir',
    aliases: ['1Királyok', 'A királyok első könyve'],
  },
  {
    id: '2KI',
    order: 12,
    testament: 'old',
    abbreviation: '2Kir',
    aliases: ['2Királyok', 'A királyok második könyve'],
  },
  {
    id: '1CH',
    order: 13,
    testament: 'old',
    abbreviation: '1Krón',
    aliases: ['1Krónikák', 'A krónikák első könyve'],
  },
  {
    id: '2CH',
    order: 14,
    testament: 'old',
    abbreviation: '2Krón',
    aliases: ['2Krónikák', 'A krónikák második könyve'],
  },
  {
    id: 'EZR',
    order: 15,
    testament: 'old',
    abbreviation: 'Ezsd',
    aliases: ['Ezsdrás', 'Ezsdrás könyve'],
  },
  {
    id: 'NEH',
    order: 16,
    testament: 'old',
    abbreviation: 'Neh',
    aliases: ['Nehémiás', 'Nehémiás könyve'],
  },
  {
    id: 'EST',
    order: 17,
    testament: 'old',
    abbreviation: 'Eszt',
    aliases: ['Eszter', 'Eszter könyve'],
  },
  {
    id: 'JOB',
    order: 18,
    testament: 'old',
    abbreviation: 'Jób',
    aliases: ['Jób könyve'],
  },
  {
    id: 'PSA',
    order: 19,
    testament: 'old',
    abbreviation: 'Zsolt',
    aliases: ['Zsoltárok', 'A Zsoltárok könyve', 'Zsoltárok könyve', 'Zsoltár', 'Zs'],
  },
  {
    id: 'PRO',
    order: 20,
    testament: 'old',
    abbreviation: 'Péld',
    aliases: ['Példabeszédek', 'A példabeszédek könyve', 'Példabeszédek könyve'],
  },
  {
    id: 'ECC',
    order: 21,
    testament: 'old',
    abbreviation: 'Préd',
    aliases: ['Prédikátor', 'A prédikátor könyve', 'Prédikátor könyve'],
  },
  {
    id: 'SNG',
    order: 22,
    testament: 'old',
    abbreviation: 'Énekek',
    aliases: ['Énekek éneke', 'Ének', 'Én'],
  },
  {
    id: 'ISA',
    order: 23,
    testament: 'old',
    abbreviation: 'Ézs',
    aliases: ['Ézsaiás', 'Ézsaiás próféta könyve'],
  },
  {
    id: 'JER',
    order: 24,
    testament: 'old',
    abbreviation: 'Jer',
    aliases: ['Jeremiás', 'Jeremiás próféta könyve'],
  },
  {
    id: 'LAM',
    order: 25,
    testament: 'old',
    abbreviation: 'JSir',
    aliases: ['Jeremiás siralmai'],
  },
  {
    id: 'EZK',
    order: 26,
    testament: 'old',
    abbreviation: 'Ez',
    aliases: ['Ezékiel', 'Ezékiel próféta könyve'],
  },
  {
    id: 'DAN',
    order: 27,
    testament: 'old',
    abbreviation: 'Dán',
    aliases: ['Dániel', 'Dániel próféta könyve'],
  },
  {
    id: 'HOS',
    order: 28,
    testament: 'old',
    abbreviation: 'Hós',
    aliases: ['Hóseás', 'Hóseás próféta könyve'],
  },
  {
    id: 'JOL',
    order: 29,
    testament: 'old',
    abbreviation: 'Jóel',
    aliases: ['Jóel próféta könyve'],
  },
  {
    id: 'AMO',
    order: 30,
    testament: 'old',
    abbreviation: 'Ám',
    aliases: ['Ámósz', 'Ámós', 'Ámósz próféta könyve'],
  },
  {
    id: 'OBA',
    order: 31,
    testament: 'old',
    abbreviation: 'Abd',
    aliases: ['Abdiás', 'Abdiás próféta könyve'],
  },
  {
    id: 'JON',
    order: 32,
    testament: 'old',
    abbreviation: 'Jón',
    aliases: ['Jónás', 'Jónás próféta könyve'],
  },
  {
    id: 'MIC',
    order: 33,
    testament: 'old',
    abbreviation: 'Mik',
    aliases: ['Mikeás', 'Mikeás próféta könyve'],
  },
  {
    id: 'NAM',
    order: 34,
    testament: 'old',
    abbreviation: 'Náh',
    aliases: ['Náhum', 'Náhum próféta könyve'],
  },
  {
    id: 'HAB',
    order: 35,
    testament: 'old',
    abbreviation: 'Hab',
    aliases: ['Habakuk', 'Habakuk próféta könyve'],
  },
  {
    id: 'ZEP',
    order: 36,
    testament: 'old',
    abbreviation: 'Zof',
    aliases: ['Zofóniás', 'Sofóniás', 'Zofóniás próféta könyve', 'Szofóniás'],
  },
  {
    id: 'HAG',
    order: 37,
    testament: 'old',
    abbreviation: 'Hag',
    aliases: ['Haggeus', 'Aggeus', 'Haggeus próféta könyve'],
  },
  {
    id: 'ZEC',
    order: 38,
    testament: 'old',
    abbreviation: 'Zak',
    aliases: ['Zakariás', 'Zakariás próféta könyve'],
  },
  {
    id: 'MAL',
    order: 39,
    testament: 'old',
    abbreviation: 'Mal',
    aliases: ['Malakiás', 'Malakiás próféta könyve'],
  },
  {
    id: 'MAT',
    order: 40,
    testament: 'new',
    abbreviation: 'Mt',
    aliases: ['Máté', 'Máté evangéliuma'],
  },
  {
    id: 'MRK',
    order: 41,
    testament: 'new',
    abbreviation: 'Mk',
    aliases: ['Márk', 'Márk evangéliuma', 'Már'],
  },
  {
    id: 'LUK',
    order: 42,
    testament: 'new',
    abbreviation: 'Lk',
    aliases: ['Lukács', 'Lukács evangéliuma'],
  },
  {
    id: 'JHN',
    order: 43,
    testament: 'new',
    abbreviation: 'Jn',
    aliases: ['János', 'János evangéliuma', 'Ján'],
  },
  {
    id: 'ACT',
    order: 44,
    testament: 'new',
    abbreviation: 'ApCsel',
    aliases: ['Cselekedetek', 'Apostolok Cselekedetei', 'Az apostolok cselekedetei', 'Csel'],
  },
  {
    id: 'ROM',
    order: 45,
    testament: 'new',
    abbreviation: 'Róm',
    aliases: ['Róma', 'Pál levele a rómaiakhoz', 'Rómaiakhoz'],
  },
  {
    id: '1CO',
    order: 46,
    testament: 'new',
    abbreviation: '1Kor',
    aliases: ['1Korinthus', '1. Korintus', 'Pál első levele a korinthusiakhoz'],
  },
  {
    id: '2CO',
    order: 47,
    testament: 'new',
    abbreviation: '2Kor',
    aliases: ['2Korinthus', '2. Korintus', 'Pál második levele a korinthusiakhoz'],
  },
  {
    id: 'GAL',
    order: 48,
    testament: 'new',
    abbreviation: 'Gal',
    aliases: ['Galata', 'Pál levele a galatákhoz', 'Galatákhoz'],
  },
  {
    id: 'EPH',
    order: 49,
    testament: 'new',
    abbreviation: 'Ef',
    aliases: ['Efezus', 'Pál levele az efezusiakhoz', 'Efezusiakhoz'],
  },
  {
    id: 'PHP',
    order: 50,
    testament: 'new',
    abbreviation: 'Fil',
    aliases: ['Filippi', 'Pál levele a filippiekhez', 'Filippiekhez'],
  },
  {
    id: 'COL',
    order: 51,
    testament: 'new',
    abbreviation: 'Kol',
    aliases: ['Kolossé', 'Pál levele a kolosséiakhoz', 'Kolosséiakhoz'],
  },
  {
    id: '1TH',
    order: 52,
    testament: 'new',
    abbreviation: '1Thessz',
    aliases: [
      '1Thesszalonika',
      '1. Thessalonika',
      'Pál első levele a thesszalonikaiakhoz',
      '1Tesszalonika',
      '1Tessz',
    ],
  },
  {
    id: '2TH',
    order: 53,
    testament: 'new',
    abbreviation: '2Thessz',
    aliases: [
      '2Thesszalonika',
      '2. Thessalonika',
      'Pál második levele a thesszalonikaiakhoz',
      '2Tesszalonika',
      '2Tessz',
    ],
  },
  {
    id: '1TI',
    order: 54,
    testament: 'new',
    abbreviation: '1Tim',
    aliases: ['1Timóteus', 'Pál első levele Timóteushoz', '1Timóteushoz'],
  },
  {
    id: '2TI',
    order: 55,
    testament: 'new',
    abbreviation: '2Tim',
    aliases: ['2Timóteus', 'Pál második levele Timóteushoz', '2Timóteushoz'],
  },
  {
    id: 'TIT',
    order: 56,
    testament: 'new',
    abbreviation: 'Tit',
    aliases: ['Titusz', 'Pál levele Tituszhoz', 'Tituszhoz'],
  },
  {
    id: 'PHM',
    order: 57,
    testament: 'new',
    abbreviation: 'Filem',
    aliases: ['Filemon', 'Pál levele Filemonhoz', 'Filemonhoz'],
  },
  {
    id: 'HEB',
    order: 58,
    testament: 'new',
    abbreviation: 'Zsid',
    aliases: ['Zsidók', 'Zsidókhoz írt levél', 'A zsidókhoz írt levél', 'Zsidókhoz'],
  },
  {
    id: 'JAS',
    order: 59,
    testament: 'new',
    abbreviation: 'Jak',
    aliases: ['Jakab', 'Jakab levele'],
  },
  {
    id: '1PE',
    order: 60,
    testament: 'new',
    abbreviation: '1Pt',
    aliases: ['1Péter', 'Péter első levele'],
  },
  {
    id: '2PE',
    order: 61,
    testament: 'new',
    abbreviation: '2Pt',
    aliases: ['2Péter', 'Péter második levele'],
  },
  {
    id: '1JN',
    order: 62,
    testament: 'new',
    abbreviation: '1Jn',
    aliases: ['1János', 'János első levele', '1Ján'],
  },
  {
    id: '2JN',
    order: 63,
    testament: 'new',
    abbreviation: '2Jn',
    aliases: ['2János', 'János második levele', '2Ján'],
  },
  {
    id: '3JN',
    order: 64,
    testament: 'new',
    abbreviation: '3Jn',
    aliases: ['3János', 'János harmadik levele', '3Ján'],
  },
  {
    id: 'JUD',
    order: 65,
    testament: 'new',
    abbreviation: 'Júd',
    aliases: ['Júdás', 'Júdás levele'],
  },
  {
    id: 'REV',
    order: 66,
    testament: 'new',
    abbreviation: 'Jel',
    aliases: ['Jelenések', 'A jelenések könyve', 'Jelenések könyve'],
  },
];

/** Lookup index over ids, abbreviations and aliases, built once on first use. */
let bookIndex: Map<string, CanonicalBook> | undefined;

const getBookIndex = (): Map<string, CanonicalBook> => {
  if (!bookIndex) {
    bookIndex = new Map();
    for (const book of BOOKS) {
      for (const key of [book.id, book.abbreviation, ...book.aliases]) {
        bookIndex.set(normalizeKey(key), book);
      }
    }
  }
  return bookIndex;
};

const clone = (book: CanonicalBook): CanonicalBook => ({ ...book, aliases: [...book.aliases] });

/**
 * Resolves a book id, abbreviation or alias to its canonical entry.
 *
 * The match is exact after normalization, with no prefix or fuzzy fallback:
 * 'Ez' is Ezékiel and never Ezsdrás, 'Jn' is János and never Jónás.
 */
export const findBook = (input: string): CanonicalBook | undefined => {
  if (typeof input !== 'string') {
    return undefined;
  }
  const key = normalizeKey(input);
  if (!key) {
    return undefined;
  }
  const book = getBookIndex().get(key);
  return book ? clone(book) : undefined;
};

/** All 66 books in canonical order. */
export const getBooks = (): CanonicalBook[] => BOOKS.map(clone);

/** The 39 books of the Old Testament, in canonical order. */
export const getOldTestamentBooks = (): CanonicalBook[] =>
  BOOKS.filter((book) => book.testament === 'old').map(clone);

/** The 27 books of the New Testament, in canonical order. */
export const getNewTestamentBooks = (): CanonicalBook[] =>
  BOOKS.filter((book) => book.testament === 'new').map(clone);
