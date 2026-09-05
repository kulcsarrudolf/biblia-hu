import { DEFAULT_TRANSLATION, TRANSLATION_ENV_VAR, parseArgs, type CliArgs } from '../src/cli/args';

/** Every case runs against an empty environment unless it tests the fallback. */
const parse = (argv: string[], env: Record<string, string | undefined> = {}): CliArgs =>
  parseArgs(argv, env);

describe('parseArgs commands', () => {
  it('reads a passage from --p= and from --passage=', () => {
    expect(parse(['--p=Jn 3:16']).command).toEqual({ name: 'passage', reference: 'Jn 3:16' });
    expect(parse(['--passage=Zsolt 139:23-24']).command).toEqual({
      name: 'passage',
      reference: 'Zsolt 139:23-24',
    });
  });

  it('keeps a multi segment reference intact', () => {
    expect(parse(['--p=Jn 3:16; Zsolt 100']).command).toEqual({
      name: 'passage',
      reference: 'Jn 3:16; Zsolt 100',
    });
  });

  it('reads --showBooks with and without a testament filter', () => {
    expect(parse(['--showBooks']).command).toEqual({ name: 'books' });
    expect(parse(['--showBooks', '--old']).command).toEqual({ name: 'books', testament: 'old' });
    expect(parse(['--showBooks', '--new']).command).toEqual({ name: 'books', testament: 'new' });
  });

  it('ignores --old and --new when both are given', () => {
    expect(parse(['--showBooks', '--old', '--new']).command).toEqual({ name: 'books' });
  });

  it('reads --bookDetails with a following word or an inline value', () => {
    expect(parse(['--bookDetails', 'Zsolt']).command).toEqual({
      name: 'bookDetails',
      book: 'Zsolt',
    });
    expect(parse(['--bookDetails=Énekek éneke']).command).toEqual({
      name: 'bookDetails',
      book: 'Énekek éneke',
    });
  });

  it('reads --search with an optional testament filter', () => {
    expect(parse(['--search=szeretet']).command).toEqual({ name: 'search', query: 'szeretet' });
    expect(parse(['--search=Isten', '--new']).command).toEqual({
      name: 'search',
      query: 'Isten',
      testament: 'new',
    });
  });

  it('reads --today, --translations, -i and --help', () => {
    expect(parse(['--today']).command).toEqual({ name: 'today' });
    expect(parse(['--translations']).command).toEqual({ name: 'translations' });
    expect(parse(['-i']).command).toEqual({ name: 'repl' });
    expect(parse(['--help']).command).toEqual({ name: 'help' });
  });

  it('falls back to help when nothing is requested', () => {
    expect(parse([]).command).toEqual({ name: 'help' });
  });

  it('lets --help win over every other command', () => {
    expect(parse(['--today', '--help']).command).toEqual({ name: 'help' });
    expect(parse(['-i', '--help']).command).toEqual({ name: 'help' });
    expect(parse(['--nope', '--help']).command).toEqual({ name: 'help' });
  });

  it('lets -i win over a command flag', () => {
    expect(parse(['--today', '-i']).command).toEqual({ name: 'repl' });
  });

  it('keeps the first command flag when several are given', () => {
    expect(parse(['--today', '--translations']).command).toEqual({ name: 'today' });
  });
});

describe('parseArgs errors', () => {
  it('rejects an unknown option', () => {
    expect(parse(['--nope'])).toMatchObject({
      command: { name: 'error', message: 'Unknown option: --nope' },
    });
  });

  it('rejects a stray positional argument', () => {
    expect(parse(['Jn 3:16'])).toMatchObject({
      command: { name: 'error', message: 'Unexpected argument: "Jn 3:16"' },
    });
  });

  it('rejects a flag whose value is missing', () => {
    expect(parse(['--p='])).toMatchObject({ command: { name: 'error' } });
    expect(parse(['--search='])).toMatchObject({ command: { name: 'error' } });
    expect(parse(['--bookDetails'])).toMatchObject({ command: { name: 'error' } });
    expect(parse(['--bookDetails='])).toMatchObject({ command: { name: 'error' } });
    expect(parse(['--bookDetails', '--today'])).toMatchObject({ command: { name: 'error' } });
    expect(parse(['-t'])).toMatchObject({ command: { name: 'error' } });
    expect(parse(['--translation='])).toMatchObject({ command: { name: 'error' } });
  });

  it('reports the first problem only', () => {
    expect(parse(['--nope', '--nor-this'])).toMatchObject({
      command: { name: 'error', message: 'Unknown option: --nope' },
    });
  });
});

describe('parseArgs translation selection', () => {
  it('defaults to RUF', () => {
    expect(parse(['--today']).translation).toBe('RUF');
    expect(DEFAULT_TRANSLATION).toBe('RUF');
  });

  it('reads -t and --translation=', () => {
    expect(parse(['-t', 'KAROLI', '--today']).translation).toBe('KAROLI');
    expect(parse(['--translation=KAROLI', '--today']).translation).toBe('KAROLI');
  });

  it('uppercases the requested id', () => {
    expect(parse(['-t', 'karoli']).translation).toBe('KAROLI');
    expect(parse(['--translation=ruf']).translation).toBe('RUF');
  });

  it('does not treat the -t value as a command', () => {
    expect(parse(['-t', 'RUF', '--today']).command).toEqual({ name: 'today' });
  });

  it('falls back to the environment variable', () => {
    expect(parse(['--today'], { [TRANSLATION_ENV_VAR]: 'karoli' }).translation).toBe('KAROLI');
  });

  it('lets a flag win over the environment variable', () => {
    expect(parse(['-t', 'RUF'], { [TRANSLATION_ENV_VAR]: 'KAROLI' }).translation).toBe('RUF');
  });

  it('keeps an unknown id so the caller can report it', () => {
    expect(parse(['-t', 'NOPE', '--today']).translation).toBe('NOPE');
  });

  it('reads process.env when no environment is passed', () => {
    const previous = process.env[TRANSLATION_ENV_VAR];
    process.env[TRANSLATION_ENV_VAR] = 'KAROLI';
    try {
      expect(parseArgs(['--today']).translation).toBe('KAROLI');
    } finally {
      if (previous === undefined) delete process.env[TRANSLATION_ENV_VAR];
      else process.env[TRANSLATION_ENV_VAR] = previous;
    }
  });
});
