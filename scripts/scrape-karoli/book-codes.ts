/**
 * Mapping from canonical book ids to the codes the Károli site uses.
 *
 * The site follows the USFM codes for 49 of the 66 books. The 17 books listed
 * here use an older abbreviation instead, so every URL has to go through
 * {@link siteCode}.
 *
 * Build time tooling, never shipped.
 */
import type { BookId } from '../../src/types';

/** Canonical id to site code, only for the books where the two differ. */
export const KAROLI_SITE_CODES: Partial<Record<BookId, string>> = {
  JDG: 'JUG',
  '1SA': '1SM',
  '2SA': '2SM',
  '1KI': '1KG',
  '2KI': '2KG',
  PSA: 'PS',
  SNG: 'SON',
  EZK: 'EZE',
  JOL: 'JOE',
  NAM: 'NAH',
  MRK: 'MAK',
  PHP: 'PHL',
  '1TH': '1TS',
  '2TH': '2TS',
  '1TI': '1TM',
  '2TI': '2TM',
  JAS: 'JAM',
};

/** The path segment the site uses for a book, for example `1SM` for `1SA`. */
export const siteCode = (id: BookId): string => KAROLI_SITE_CODES[id] ?? id;
