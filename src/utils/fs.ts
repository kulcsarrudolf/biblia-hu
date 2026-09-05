import * as fs from 'fs';
import * as path from 'path';

/**
 * Walks up from `start` until it finds the directory that holds a package.json.
 *
 * The compiled output lives at different depths (dist/index.js for the library,
 * dist/cli/index.js for the CLI), so the JSON data shipped at the package root
 * has to be located relative to the package rather than to this file.
 */
export const findPackageRoot = (start: string): string => {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return start;
};

const packageRoot = findPackageRoot(__dirname);

/** Absolute path of the package root, resolved once at module load. */
export const getPackageRoot = (): string => packageRoot;

/**
 * Reads and parses a JSON file addressed relative to the package root.
 *
 * @throws whatever `fs.readFileSync` or `JSON.parse` throws. Callers that have
 * a fallback (see the data loader) catch and continue.
 */
export const readJSONFile = <T>(relativePath: string): T => {
  const fullPath = path.resolve(packageRoot, relativePath);
  const rawData = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(rawData) as T;
};
