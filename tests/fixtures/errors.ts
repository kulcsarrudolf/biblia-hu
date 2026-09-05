import type { BibliaErrorCode } from '../../src/errors';

/** Asserts that a promise rejects with a BibliaError carrying the given code. */
export const expectBibliaError = async (
  promise: Promise<unknown>,
  code: BibliaErrorCode,
): Promise<void> => {
  await expect(promise).rejects.toMatchObject({ name: 'BibliaError', code });
};
