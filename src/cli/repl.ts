import * as readline from 'node:readline';

import { biblia } from '../bible';
import { isBibliaError } from '../errors';
import { TRANSLATION_IDS, isTranslationId } from '../translations';
import type { Bible } from '../types';
import { printReplHelp } from './help';
import { printBooks, printDailyVerse, printPassage, printSearchResults } from './output';

/** How many hits one `search` command prints inside the REPL. */
const SEARCH_LIMIT = 10;

/** The prompt names the translation, so a switch is visible on every line. */
const promptFor = (bible: Bible): string => `biblia(${bible.translation.id})> `;

/**
 * Starts the interactive mode.
 *
 * The session owns its own `Bible`, so `translation <id>` can replace the
 * instance and the prompt without restarting the process. Every command is
 * handled while the interface is paused, which keeps a slow lookup from
 * interleaving its output with the next prompt.
 *
 * @param initial The translation the command line selected.
 */
export const startRepl = (initial: Bible): void => {
  let bible = initial;
  let closed = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: promptFor(bible),
  });

  /** Switches the session to another translation, or reports the current one. */
  const switchTranslation = (requested: string): void => {
    if (requested.length === 0) {
      console.log(`${bible.translation.name} (${bible.translation.shortName})`);
      return;
    }

    const id = requested.toUpperCase();
    if (!isTranslationId(id)) {
      console.log(`Unknown translation: ${JSON.stringify(id)}.`);
      console.log(`Available translations: ${TRANSLATION_IDS.join(', ')}.`);
      return;
    }

    bible = biblia(id);
    rl.setPrompt(promptFor(bible));
    console.log(`${bible.translation.name} (${bible.translation.shortName})`);
  };

  const handle = async (input: string): Promise<void> => {
    if (input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }

    if (input === 'help') {
      printReplHelp();
      return;
    }

    if (input === 'today') {
      printDailyVerse(await bible.getDailyVerse());
      return;
    }

    if (input === 'books') {
      printBooks(bible);
      return;
    }

    if (input === 'translation' || input.startsWith('translation ')) {
      switchTranslation(input.slice('translation'.length).trim());
      return;
    }

    if (input.startsWith('search ')) {
      const query = input.slice('search '.length).trim();
      if (query.length === 0) {
        console.log('Missing search query.');
        return;
      }
      printSearchResults(await bible.search(query, { limit: SEARCH_LIMIT }));
      return;
    }

    printPassage(await bible.getPassage(input), bible.translation);
  };

  console.log('biblia-hu interactive mode.');
  console.log(`Translation: ${bible.translation.name} (${bible.translation.shortName}).`);
  console.log('Type "help" for the commands, "exit" to leave.');
  console.log('');
  rl.prompt();

  // Lines arrive faster than they are handled when stdin is a pipe, so every
  // command joins a queue instead of racing the ones before it.
  let queue: Promise<void> = Promise.resolve();

  const processLine = async (line: string): Promise<void> => {
    const input = line.trim();

    if (input.length > 0) {
      try {
        await handle(input);
      } catch (error) {
        console.log(isBibliaError(error) ? error.message : String(error));
      }
      if (closed) return;
      console.log('');
    }

    rl.prompt();
  };

  rl.on('line', (line) => {
    queue = queue.then(() => processLine(line));
  });

  rl.on('close', () => {
    closed = true;
    console.log('Viszontlátásra!');
    process.exit(0);
  });
};
