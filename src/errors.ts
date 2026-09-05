/** Machine readable reason for a {@link BibliaError}. */
export type BibliaErrorCode =
  | 'UNKNOWN_BOOK'
  | 'INVALID_REFERENCE'
  | 'CHAPTER_NOT_FOUND'
  | 'VERSE_NOT_FOUND'
  | 'DATA_UNAVAILABLE'
  | 'UNKNOWN_TRANSLATION';

/**
 * The only error type this library throws.
 *
 * Every instance carries a stable `code` so callers can branch on the reason
 * without matching on the human readable message.
 */
export class BibliaError extends Error {
  readonly code: BibliaErrorCode;

  constructor(code: BibliaErrorCode, message: string) {
    super(message);
    this.name = 'BibliaError';
    this.code = code;
    // Keeps `instanceof` working when the output is compiled down to ES5.
    Object.setPrototypeOf(this, BibliaError.prototype);
  }
}

/** Type guard for {@link BibliaError}, usable across module and bundle boundaries. */
export const isBibliaError = (error: unknown): error is BibliaError =>
  error instanceof BibliaError ||
  (typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'BibliaError' &&
    typeof (error as { code?: unknown }).code === 'string');
