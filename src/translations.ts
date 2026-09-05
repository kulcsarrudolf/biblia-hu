import { BibliaError } from './errors';
import type { BookId, Translation, TranslationId } from './types';

export type { Translation, TranslationId } from './types';

/** Book names as the Revideált új fordítás prints them. */
const RUF_BOOK_NAMES: Record<BookId, string> = {
  GEN: 'Mózes első könyve',
  EXO: 'Mózes második könyve',
  LEV: 'Mózes harmadik könyve',
  NUM: 'Mózes negyedik könyve',
  DEU: 'Mózes ötödik könyve',
  JOS: 'Józsué könyve',
  JDG: 'A bírák könyve',
  RUT: 'Ruth könyve',
  '1SA': 'Sámuel első könyve',
  '2SA': 'Sámuel második könyve',
  '1KI': 'A királyok első könyve',
  '2KI': 'A királyok második könyve',
  '1CH': 'A krónikák első könyve',
  '2CH': 'A krónikák második könyve',
  EZR: 'Ezsdrás könyve',
  NEH: 'Nehémiás könyve',
  EST: 'Eszter könyve',
  JOB: 'Jób könyve',
  PSA: 'A Zsoltárok könyve',
  PRO: 'A példabeszédek könyve',
  ECC: 'A prédikátor könyve',
  SNG: 'Énekek éneke',
  ISA: 'Ézsaiás próféta könyve',
  JER: 'Jeremiás próféta könyve',
  LAM: 'Jeremiás siralmai',
  EZK: 'Ezékiel próféta könyve',
  DAN: 'Dániel próféta könyve',
  HOS: 'Hóseás próféta könyve',
  JOL: 'Jóel próféta könyve',
  AMO: 'Ámósz próféta könyve',
  OBA: 'Abdiás próféta könyve',
  JON: 'Jónás próféta könyve',
  MIC: 'Mikeás próféta könyve',
  NAM: 'Náhum próféta könyve',
  HAB: 'Habakuk próféta könyve',
  ZEP: 'Zofóniás próféta könyve',
  HAG: 'Haggeus próféta könyve',
  ZEC: 'Zakariás próféta könyve',
  MAL: 'Malakiás próféta könyve',
  MAT: 'Máté evangéliuma',
  MRK: 'Márk evangéliuma',
  LUK: 'Lukács evangéliuma',
  JHN: 'János evangéliuma',
  ACT: 'Az apostolok cselekedetei',
  ROM: 'Pál levele a rómaiakhoz',
  '1CO': 'Pál első levele a korinthusiakhoz',
  '2CO': 'Pál második levele a korinthusiakhoz',
  GAL: 'Pál levele a galatákhoz',
  EPH: 'Pál levele az efezusiakhoz',
  PHP: 'Pál levele a filippiekhez',
  COL: 'Pál levele a kolosséiakhoz',
  '1TH': 'Pál első levele a thesszalonikaiakhoz',
  '2TH': 'Pál második levele a thesszalonikaiakhoz',
  '1TI': 'Pál első levele Timóteushoz',
  '2TI': 'Pál második levele Timóteushoz',
  TIT: 'Pál levele Tituszhoz',
  PHM: 'Pál levele Filemonhoz',
  HEB: 'A zsidókhoz írt levél',
  JAS: 'Jakab levele',
  '1PE': 'Péter első levele',
  '2PE': 'Péter második levele',
  '1JN': 'János első levele',
  '2JN': 'János második levele',
  '3JN': 'János harmadik levele',
  JUD: 'Júdás levele',
  REV: 'A jelenések könyve',
};

/** Book names as the Revideált Károli source site prints them. */
const KAROLI_BOOK_NAMES: Record<BookId, string> = {
  GEN: '1. Mózes',
  EXO: '2. Mózes',
  LEV: '3. Mózes',
  NUM: '4. Mózes',
  DEU: '5. Mózes',
  JOS: 'Józsué',
  JDG: 'Bírák',
  RUT: 'Ruth',
  '1SA': '1. Sámuel',
  '2SA': '2. Sámuel',
  '1KI': '1. Királyok',
  '2KI': '2. Királyok',
  '1CH': '1. Krónikák',
  '2CH': '2. Krónikák',
  EZR: 'Ezsdrás',
  NEH: 'Nehémiás',
  EST: 'Eszter',
  JOB: 'Jób',
  PSA: 'Zsoltárok',
  PRO: 'Példabeszédek',
  ECC: 'Prédikátor',
  SNG: 'Énekek éneke',
  ISA: 'Ézsaiás',
  JER: 'Jeremiás',
  LAM: 'Jeremiás Siralmai',
  EZK: 'Ezékiel',
  DAN: 'Dániel',
  HOS: 'Hóseás',
  JOL: 'Jóel',
  AMO: 'Ámós',
  OBA: 'Abdiás',
  JON: 'Jónás',
  MIC: 'Mikeás',
  NAM: 'Náhum',
  HAB: 'Habakuk',
  ZEP: 'Sofóniás',
  HAG: 'Aggeus',
  ZEC: 'Zakariás',
  MAL: 'Malakiás',
  MAT: 'Máté',
  MRK: 'Márk',
  LUK: 'Lukács',
  JHN: 'János',
  ACT: 'Apostolok Cselekedetei',
  ROM: 'Róma',
  '1CO': '1. Korintus',
  '2CO': '2. Korintus',
  GAL: 'Galata',
  EPH: 'Efézus',
  PHP: 'Filippi',
  COL: 'Kolossé',
  '1TH': '1. Thessalonika',
  '2TH': '2. Thessalonika',
  '1TI': '1. Timóteus',
  '2TI': '2. Timóteus',
  TIT: 'Titusz',
  PHM: 'Filemon',
  HEB: 'Zsidókhoz írt levél',
  JAS: 'Jakab',
  '1PE': '1. Péter',
  '2PE': '2. Péter',
  '1JN': '1. János',
  '2JN': '2. János',
  '3JN': '3. János',
  JUD: 'Júdás',
  REV: 'Jelenések',
};

/** Metadata for every translation this package knows how to describe. */
export const TRANSLATIONS: Record<TranslationId, Translation> = {
  RUF: {
    id: 'RUF',
    name: 'Revideált új fordítás',
    shortName: 'RÚF',
    year: 2014,
    publisher: 'Magyar Bibliatársulat',
    source: 'https://abibliamindenkie.hu',
    attribution:
      'Revideált új fordítás (RÚF 2014), Magyar Bibliatársulat. A szöveg szerzői jogi védelem alatt áll.',
    dataDir: 'ruf',
    bookNames: RUF_BOOK_NAMES,
  },
  KAROLI: {
    id: 'KAROLI',
    name: 'Revideált Károli Biblia (Veritas)',
    shortName: 'Revideált Károli',
    year: 2011,
    publisher: 'Veritas Kiadó',
    source: 'https://www.online-biblia.ro/bible/4',
    attribution:
      'Revideált Károli Biblia (2011), Veritas Kiadó. A szöveg szerzői jogi védelem alatt áll.',
    dataDir: 'karoli',
    bookNames: KAROLI_BOOK_NAMES,
  },
};

/**
 * Translations that are ready to use.
 *
 * KAROLI has metadata but no bundled data yet, so it stays out of this list
 * until its json/karoli files land.
 */
export const TRANSLATION_IDS: readonly TranslationId[] = ['RUF'];

/** True when the given id names a translation whose data is bundled. */
export const isTranslationId = (id: string): id is TranslationId =>
  (TRANSLATION_IDS as readonly string[]).includes(id);

/**
 * Looks up a registered translation.
 *
 * @throws BibliaError with code UNKNOWN_TRANSLATION when the id is not registered.
 */
export const getTranslation = (id: string): Translation => {
  if (!isTranslationId(id)) {
    throw new BibliaError(
      'UNKNOWN_TRANSLATION',
      `Ismeretlen fordítás: ${JSON.stringify(id)}. Elérhető fordítások: ${TRANSLATION_IDS.join(', ')}.`,
    );
  }
  return TRANSLATIONS[id];
};
