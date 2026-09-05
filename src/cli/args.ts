import type { Testament } from '../types';

/** Translation used when no flag and no environment variable selects one. */
export const DEFAULT_TRANSLATION = 'RUF';

/** Environment variable read when no translation flag is given. */
export const TRANSLATION_ENV_VAR = 'BIBLIA_TRANSLATION';

/**
 * The command the flags select, together with its own arguments.
 *
 * `error` carries a message instead of throwing, so the parser stays pure and
 * the caller decides how to report the problem and which exit code to use.
 */
export type CliCommand =
  | { name: 'passage'; reference: string }
  | { name: 'books'; testament?: Testament }
  | { name: 'bookDetails'; book: string }
  | { name: 'search'; query: string; testament?: Testament }
  | { name: 'today' }
  | { name: 'translations' }
  | { name: 'repl' }
  | { name: 'help' }
  | { name: 'error'; message: string };

/** Everything the CLI needs to run, derived from argv and the environment. */
export interface CliArgs {
  /**
   * Requested translation id, uppercased but not validated: the parser has no
   * opinion on which ids exist, so unknown ids reach the caller unchanged.
   */
  translation: string;
  command: CliCommand;
}

/** Reads `--name=value` for any of the given flag names. */
const inlineValue = (arg: string, names: readonly string[]): string | undefined => {
  for (const name of names) {
    const prefix = `${name}=`;
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length);
    }
  }
  return undefined;
};

/** True for anything that cannot serve as the value of a space separated flag. */
const isMissingValue = (value: string | undefined): value is undefined =>
  value === undefined || value.length === 0 || value.startsWith('-');

/** Applies the command precedence rules once every flag has been read. */
const resolveCommand = (state: {
  help: boolean;
  repl: boolean;
  error: string | undefined;
  command: CliCommand | undefined;
}): CliCommand => {
  if (state.help) return { name: 'help' };
  if (state.error !== undefined) return { name: 'error', message: state.error };
  if (state.repl) return { name: 'repl' };
  return state.command ?? { name: 'help' };
};

/**
 * Turns argv into a typed command.
 *
 * `argv` is the argument list without the node binary and the script path, so
 * `process.argv.slice(2)` at the call site. The environment is a parameter so
 * the fallback can be exercised without touching `process.env` in tests.
 *
 * Precedence for the translation is flag, then `BIBLIA_TRANSLATION`, then
 * `RUF`. Of the command flags the first one on the line wins, except that
 * `--help` beats everything and `-i` beats everything but `--help`.
 *
 * @example
 * parseArgs(['--p=Jn 3:16', '-t', 'RUF']);
 * // { translation: 'RUF', command: { name: 'passage', reference: 'Jn 3:16' } }
 */
export const parseArgs = (
  argv: readonly string[],
  env: Record<string, string | undefined> = process.env,
): CliArgs => {
  let translation: string | undefined;
  let command: CliCommand | undefined;
  let error: string | undefined;
  let help = false;
  let repl = false;
  let oldOnly = false;
  let newOnly = false;

  /** Keeps the first command flag, so a second one is a plain no-op. */
  const setCommand = (next: CliCommand): void => {
    command ??= next;
  };

  /** Keeps the first problem: a later flag cannot make an earlier one valid. */
  const fail = (message: string): void => {
    error ??= message;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '-i') {
      repl = true;
    } else if (arg === '--old') {
      oldOnly = true;
    } else if (arg === '--new') {
      newOnly = true;
    } else if (arg === '--showBooks') {
      setCommand({ name: 'books' });
    } else if (arg === '--today') {
      setCommand({ name: 'today' });
    } else if (arg === '--translations') {
      setCommand({ name: 'translations' });
    } else if (arg === '-t') {
      const value = argv[index + 1];
      if (isMissingValue(value)) {
        fail('Missing translation id after -t.');
      } else {
        translation ??= value;
        index += 1;
      }
    } else if (arg === '--bookDetails') {
      const value = argv[index + 1];
      if (isMissingValue(value)) {
        fail('Missing book after --bookDetails.');
      } else {
        setCommand({ name: 'bookDetails', book: value });
        index += 1;
      }
    } else {
      const reference = inlineValue(arg, ['--p', '--passage']);
      const query = inlineValue(arg, ['--search']);
      const book = inlineValue(arg, ['--bookDetails']);
      const requested = inlineValue(arg, ['--translation']);

      if (reference !== undefined) {
        if (reference.length === 0) fail('Missing reference after --p.');
        else setCommand({ name: 'passage', reference });
      } else if (query !== undefined) {
        if (query.length === 0) fail('Missing query after --search.');
        else setCommand({ name: 'search', query });
      } else if (book !== undefined) {
        if (book.length === 0) fail('Missing book after --bookDetails.');
        else setCommand({ name: 'bookDetails', book });
      } else if (requested !== undefined) {
        if (requested.length === 0) fail('Missing translation id after --translation.');
        else translation ??= requested;
      } else if (arg.startsWith('-')) {
        fail(`Unknown option: ${arg}`);
      } else {
        fail(`Unexpected argument: ${JSON.stringify(arg)}`);
      }
    }
  }

  // Asking for both halves of the canon is the same as asking for neither.
  const testament: Testament | undefined =
    oldOnly === newOnly ? undefined : oldOnly ? 'old' : 'new';

  if (testament !== undefined && command?.name === 'books') {
    command = { name: 'books', testament };
  }
  if (testament !== undefined && command?.name === 'search') {
    command = { name: 'search', query: command.query, testament };
  }

  return {
    translation: (translation ?? env[TRANSLATION_ENV_VAR] ?? DEFAULT_TRANSLATION).toUpperCase(),
    command: resolveCommand({ help, repl, error, command }),
  };
};
