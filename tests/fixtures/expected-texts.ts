import type { TranslationId } from '../../src/types';

/**
 * The handful of exact strings a translation has to reproduce.
 *
 * The behavioural tests run for every id in TRANSLATION_IDS, but the wording
 * they compare against is per translation, so it lives here. Enabling a new
 * translation means adding one entry to this table, not touching the tests.
 */
export interface TranslationExpectations {
  /** Exact text of Jn 3:16. */
  john316: string;
  /** Exact text of Zsolt 139:23 and Zsolt 139:24, in that order. */
  psalm139End: [string, string];
  /** How many verses Zsolt 100 has. */
  psalm100Verses: number;
  /** Whether the bundled files carry chapter headings. */
  hasChapterTitles: boolean;
  /** Heading of Genesis 1, when the translation has headings. */
  genesis1Title?: string;
  /** Heading of Zsolt 100, when the translation has headings. */
  psalm100Title?: string;
  /** Opening words of Genesis 1:1, used to exercise anchored regex search. */
  genesisOpening: string;
}

const EXPECTATIONS: Partial<Record<TranslationId, TranslationExpectations>> = {
  RUF: {
    john316:
      'Mert úgy szerette Isten a világot, hogy egyszülött Fiát adta, hogy aki hisz őbenne, el ne vesszen, hanem örök élete legyen.',
    psalm139End: [
      'Vizsgálj meg, Istenem, ismerd meg szívemet! Próbálj meg, és ismerd meg gondolataimat!',
      'Nézd meg, nem járok-e téves úton, és vezess az örökkévalóság útján!',
    ],
    psalm100Verses: 5,
    hasChapterTitles: true,
    genesis1Title: 'A világ teremtése',
    psalm100Title: 'Adjunk hálát alkotónknak!',
    genesisOpening: 'Kezdetben',
  },
};

/** The expectations of one translation, or a pointed failure when they are missing. */
export const expectationsFor = (id: TranslationId): TranslationExpectations => {
  const expectations = EXPECTATIONS[id];
  if (!expectations) {
    throw new Error(
      `No expected texts for translation ${id}. Add an entry to tests/fixtures/expected-texts.ts.`,
    );
  }
  return expectations;
};
