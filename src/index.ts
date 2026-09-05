import { version } from '../package.json';

/** The package version, read from package.json at build time. */
export const VERSION: string = version;

export * from './types';
export * from './errors';
export * from './books';
export * from './translations';
export * from './reference';
export * from './utils/text';
