/**
 * Checks that `npm pack` would ship exactly what the package promises.
 *
 * The published tarball has to carry the two builds, the CLI entry, both
 * translations in full, and nothing else. A stray tests or scripts directory
 * would leak build time tooling, and a missing book would ship a broken
 * translation, so this runs before a release rather than after one.
 *
 * Run it with `yarn verify:pack`. It builds nothing: run `yarn build` first.
 */
import { execFileSync } from 'child_process';

import { BOOKS } from '../src/books';
import { TRANSLATIONS, TRANSLATION_IDS } from '../src/translations';

/** One file entry of `npm pack --json`. */
interface PackedFile {
  path: string;
}

interface PackResult {
  entryCount: number;
  unpackedSize: number;
  files: PackedFile[];
}

/** Top level entries the tarball is allowed to contain. */
const ALLOWED_ROOTS = ['dist', 'bin', 'json', 'README.md', 'LICENSE', 'package.json'];

const readPackListing = (): PackResult => {
  // The prepack script prints to stdout, so the JSON starts at the first bracket.
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const parsed = JSON.parse(raw.slice(raw.indexOf('['))) as PackResult[];
  return parsed[0];
};

const main = (): void => {
  const result = readPackListing();
  const paths = new Set(result.files.map((file) => file.path));
  const problems: string[] = [];

  for (const path of paths) {
    const root = path.split('/')[0];
    if (!ALLOWED_ROOTS.includes(root)) problems.push(`Unexpected entry: ${path}`);
  }

  for (const entry of ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts', 'bin/biblia.js']) {
    if (!paths.has(entry)) problems.push(`Missing entry: ${entry}`);
  }

  for (const id of TRANSLATION_IDS) {
    const dir = TRANSLATIONS[id].dataDir;
    const missing = BOOKS.filter((book) => !paths.has(`json/${dir}/${book.id}.json`));
    if (missing.length > 0) {
      problems.push(`${id}: ${missing.length} books missing from json/${dir}`);
    }
  }

  const megabytes = (result.unpackedSize / 1024 / 1024).toFixed(1);
  console.log(`${result.entryCount} entries, ${megabytes} MB unpacked`);
  for (const id of TRANSLATION_IDS) {
    console.log(`  json/${TRANSLATIONS[id].dataDir}: ${BOOKS.length} books`);
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} problems:`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log('pack contents ok');
};

main();
