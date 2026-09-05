import { biblia } from '../bible';
import { isBibliaError } from '../errors';
import { TRANSLATION_IDS, isTranslationId } from '../translations';
import type { Bible } from '../types';
import { parseArgs, type CliArgs, type CliCommand } from './args';
import { printHelp } from './help';
import {
  printBookDetails,
  printBooks,
  printDailyVerse,
  printPassage,
  printSearchResults,
  printTranslations,
} from './output';
import { startRepl } from './repl';

/** How many hits a single `--search` prints before stopping. */
const SEARCH_LIMIT = 20;

/** Exit code used for every failure: a bad flag, a bad id, or a BibliaError. */
const FAILURE = 1;

/** The commands that need a translation, so the ones {@link run} handles first are gone. */
type BibleCommand = Extract<
  CliCommand,
  { name: 'passage' | 'books' | 'bookDetails' | 'search' | 'today' | 'repl' }
>;

/**
 * Runs one command against an already selected translation.
 *
 * Returns the process exit code. Nothing here catches errors: a BibliaError
 * thrown by the library travels up to {@link main}, which prints its message.
 */
const runWithBible = async (bible: Bible, command: BibleCommand): Promise<number> => {
  switch (command.name) {
    case 'passage':
      printPassage(await bible.getPassage(command.reference), bible.translation);
      return 0;

    case 'books':
      printBooks(bible, command.testament);
      return 0;

    case 'bookDetails':
      printBookDetails(await bible.getBookDetails(command.book));
      return 0;

    case 'search':
      printSearchResults(
        await bible.search(command.query, { limit: SEARCH_LIMIT, testament: command.testament }),
      );
      return 0;

    case 'today':
      printDailyVerse(await bible.getDailyVerse());
      return 0;

    case 'repl':
      startRepl(bible);
      return 0;
  }
};

/** Dispatches one parsed command line and returns the process exit code. */
export const run = async (args: CliArgs): Promise<number> => {
  const { command } = args;

  if (command.name === 'help') {
    printHelp();
    return 0;
  }

  if (command.name === 'error') {
    console.error(command.message);
    console.error('');
    printHelp();
    return FAILURE;
  }

  // Listing the translations must work even when the selected id is bogus.
  if (command.name === 'translations') {
    printTranslations();
    return 0;
  }

  if (!isTranslationId(args.translation)) {
    console.error(`Unknown translation: ${JSON.stringify(args.translation)}.`);
    console.error(`Available translations: ${TRANSLATION_IDS.join(', ')}.`);
    return FAILURE;
  }

  return runWithBible(biblia(args.translation), command);
};

/**
 * Entry point of the `biblia` binary.
 *
 * The exit code is set rather than forced with `process.exit`, so buffered
 * output reaches a pipe before the process ends.
 */
const main = async (): Promise<void> => {
  try {
    process.exitCode = await run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(isBibliaError(error) ? error.message : String(error));
    process.exitCode = FAILURE;
  }
};

void main();
