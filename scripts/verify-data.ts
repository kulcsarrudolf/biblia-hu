/**
 * Validates every bundled translation and fails the build when anything is off.
 *
 * `yarn validate` runs this locally and in CI, so a book file that goes missing,
 * loses a chapter or grows a hole in its verse numbering is caught before release.
 */
import { TRANSLATIONS, TRANSLATION_IDS } from '../src/translations';
import { validateTranslation } from '../src/data/validate';
import { expectedChapterCounts } from '../tests/fixtures/chapter-counts';

const main = async (): Promise<void> => {
  let failed = false;

  for (const id of TRANSLATION_IDS) {
    const translation = TRANSLATIONS[id];
    const report = await validateTranslation(translation, expectedChapterCounts(id));

    console.log(
      `${id}: ${report.books} books, ${report.chapters} chapters, ${report.verses} verses`,
    );

    if (report.errors.length === 0) {
      console.log(`${id}: ok`);
      continue;
    }

    failed = true;
    console.error(`${id}: ${report.errors.length} error(s)`);
    for (const error of report.errors) {
      console.error(`  [${error.book ?? '?'}] ${error.message}`);
    }
  }

  if (failed) {
    process.exit(1);
  }
};

void main();
