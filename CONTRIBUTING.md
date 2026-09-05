# Contributing

Thanks for your interest in improving `biblia-hu`.

## Getting started

The project uses Node 18 or newer and Yarn 4 through Corepack.
The exact Yarn version is pinned in the `packageManager` field of `package.json`.

1. Fork and clone the repository.
2. Enable Corepack once per machine:
   ```bash
   corepack enable
   ```
3. Install dependencies:
   ```bash
   yarn install
   ```

Installing also sets up the Husky git hooks through the `postinstall` script.

## Scripts

| Script               | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `yarn build`         | Bundle the library and CLI with tsup (CJS, ESM, and type files) |
| `yarn test`          | Run the Jest test suite                                         |
| `yarn test:watch`    | Run Jest in watch mode                                          |
| `yarn coverage`      | Run the tests with a coverage report                            |
| `yarn lint`          | Lint with ESLint                                                |
| `yarn lint:fix`      | Lint and fix what ESLint can fix                                |
| `yarn format`        | Format `src`, `scripts`, and `tests` with Prettier              |
| `yarn format:check`  | Check formatting without writing                                |
| `yarn validate`      | Validate the bundled Bible data                                 |
| `yarn import:ruf`    | Import the RÚF text from a `biblia-ruf` checkout                |
| `yarn scrape:karoli` | Scrape the Revideált Károli text into `json/karoli`             |
| `yarn changeset`     | Add a changeset describing your change                          |

Run the CLI locally with `node bin/biblia.js --help` after `yarn build`.

## Data

The Bible text is not written by hand, it is imported once and then committed as JSON.

`json/ruf/<ID>.json` and `json/karoli/<ID>.json` hold 66 files each, named after the canonical book id.
Each file is `[{ chapter, title?, verses: [{ verse, text }] }]`.
RÚF files carry a chapter `title`, Károli files do not.
Run `yarn validate` after any change to the data.

### RÚF

`yarn import:ruf` converts the `biblia-ruf` checkout into `json/ruf`.
It expects that repository next to this one, or takes the source directory as its first argument.

### Károli

`yarn scrape:karoli` fetches the Revideált Károli text from online-biblia.ro into `json/karoli`.

| Flag                | Meaning                                                 |
| ------------------- | ------------------------------------------------------- |
| `--book=RUT,PHM`    | Comma separated canonical book ids. Defaults to all 66. |
| `--delay=10000`     | Milliseconds between requests. Defaults to 10000.       |
| `--out=json/karoli` | Output directory.                                       |
| `--force`           | Rescrape books that already have a valid output file.   |
| `--verbose`         | Log every chapter as it is fetched.                     |

The site's robots.txt asks for `Crawl-delay: 10`, and the scraper honours it.
Do not lower `--delay` below 10000.
With 66 books and 1189 chapters a full run is about 1255 requests, so it takes roughly three and a half hours.

Always start with a small subset and read the output before committing to the full run:

```bash
yarn scrape:karoli --book=RUT,PHM --out=/tmp/karoli-test
```

Only then run the whole thing:

```bash
yarn scrape:karoli
```

The run is resumable.
A book that already has a valid file on disk is skipped, and a run that ends with failures exits 1 and prints the `--book` list to retry with.
Book files are written to a `.tmp` name and renamed into place, so an interrupted run never leaves a half written book behind.

Never commit a partial scrape.
`json/karoli/` is either absent or complete with all 66 files, otherwise `yarn validate` and the test suite fail for everyone else.

Both translations are copyrighted (Kálvin Kiadó for RÚF, Veritas Kiadó for Károli) and are redistributed here with attribution, see the README.
The scraper lives in `scripts/` and is never part of the published package.

## Git hooks and commits

A Husky pre-commit hook runs lint-staged (ESLint and Prettier on staged files) and the test suite.
Commit messages are validated against [Conventional Commits](https://www.conventionalcommits.org/) by commitlint.
Use the `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, and `build:` types.

## Submitting changes

1. Create a feature branch.
2. Make your change with tests where appropriate.
3. Add a changeset, every pull request needs one:
   ```bash
   yarn changeset
   ```
4. Push and open a pull request against `main`.
   CI runs lint, format check, coverage, build, and data validation on Node 20 and 22.

## Releases

Releases are automated with [Changesets](https://github.com/changesets/changesets).
When pull requests with changesets land on `main`, a "Version Packages" pull request is opened.
Merging it publishes to npm with provenance and updates `CHANGELOG.md`.
