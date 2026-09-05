/**
 * Trims the input and collapses every run of whitespace into a single space.
 *
 * The bundled JSON keeps a few doubled and trailing spaces from the sources,
 * so both the import scripts and the lookup helpers run text through this.
 */
export const normalizeWhitespace = (input: string): string => input.trim().replace(/\s+/g, ' ');

/**
 * Removes accents by decomposing to NFD and dropping the combining marks.
 *
 * This covers the full Hungarian alphabet, including the double acute letters
 * (o with double acute and u with double acute), which both decompose in NFD.
 */
export const stripDiacritics = (input: string): string =>
  input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
