import { BOOKS, findBook } from '../src/books';
import { BibliaError } from '../src/errors';
import {
  TRANSLATIONS,
  TRANSLATION_IDS,
  getTranslation,
  isTranslationId,
} from '../src/translations';
import type { TranslationId } from '../src/types';

describe('the translation table', () => {
  it('describes RUF and KAROLI', () => {
    expect(Object.keys(TRANSLATIONS).sort()).toEqual(['KAROLI', 'RUF']);
  });

  it('carries the RÚF metadata', () => {
    expect(TRANSLATIONS.RUF).toMatchObject({
      id: 'RUF',
      name: 'Revideált új fordítás',
      shortName: 'RÚF',
      year: 2014,
      publisher: 'Magyar Bibliatársulat',
      source: 'https://abibliamindenkie.hu',
      dataDir: 'ruf',
    });
    expect(TRANSLATIONS.RUF.attribution.length).toBeGreaterThan(0);
  });

  it('carries the Revideált Károli metadata', () => {
    expect(TRANSLATIONS.KAROLI).toMatchObject({
      id: 'KAROLI',
      name: 'Revideált Károli Biblia (Veritas)',
      shortName: 'Revideált Károli',
      year: 2011,
      publisher: 'Veritas Kiadó',
      source: 'https://www.online-biblia.ro/bible/4',
      dataDir: 'karoli',
    });
    expect(TRANSLATIONS.KAROLI.attribution.length).toBeGreaterThan(0);
  });

  it('names all 66 books in every translation', () => {
    for (const id of Object.keys(TRANSLATIONS) as TranslationId[]) {
      const names = TRANSLATIONS[id].bookNames;
      expect(Object.keys(names).sort()).toEqual(BOOKS.map((book) => book.id).sort());
      for (const book of BOOKS) {
        expect(names[book.id].trim()).toBe(names[book.id]);
        expect(names[book.id].length).toBeGreaterThan(0);
      }
    }
  });

  it('uses the corrected RÚF spelling for Ephesians', () => {
    expect(TRANSLATIONS.RUF.bookNames.EPH).toBe('Pál levele az efezusiakhoz');
  });

  it('uses the Károli site spelling for the books that differ', () => {
    expect(TRANSLATIONS.KAROLI.bookNames.GEN).toBe('1. Mózes');
    expect(TRANSLATIONS.KAROLI.bookNames.ACT).toBe('Apostolok Cselekedetei');
    expect(TRANSLATIONS.KAROLI.bookNames.HAG).toBe('Aggeus');
    expect(TRANSLATIONS.KAROLI.bookNames.ZEP).toBe('Sofóniás');
    expect(TRANSLATIONS.KAROLI.bookNames.HEB).toBe('Zsidókhoz írt levél');
  });

  it('resolves every translation book name through the alias table', () => {
    for (const id of Object.keys(TRANSLATIONS) as TranslationId[]) {
      for (const book of BOOKS) {
        expect(findBook(TRANSLATIONS[id].bookNames[book.id])?.id).toBe(book.id);
      }
    }
  });
});

describe('getTranslation', () => {
  it('registers only RUF for now', () => {
    expect(TRANSLATION_IDS).toEqual(['RUF']);
    expect(isTranslationId('RUF')).toBe(true);
    expect(isTranslationId('KAROLI')).toBe(false);
  });

  it('returns the registered translation', () => {
    expect(getTranslation('RUF')).toBe(TRANSLATIONS.RUF);
  });

  it('throws UNKNOWN_TRANSLATION for KAROLI until its data lands', () => {
    expect(() => getTranslation('KAROLI')).toThrow(BibliaError);
    try {
      getTranslation('KAROLI');
    } catch (error) {
      expect((error as BibliaError).code).toBe('UNKNOWN_TRANSLATION');
      expect((error as BibliaError).message).toContain('KAROLI');
    }
  });

  it('throws UNKNOWN_TRANSLATION for an unknown id', () => {
    expect(() => getTranslation('NIV')).toThrow(/Ismeretlen fordítás/);
    expect(() => getTranslation('ruf')).toThrow(BibliaError);
  });
});
