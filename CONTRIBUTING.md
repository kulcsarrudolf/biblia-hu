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

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `yarn build`        | Bundle the library and CLI with tsup (CJS, ESM, and type files) |
| `yarn test`         | Run the Jest test suite                                         |
| `yarn test:watch`   | Run Jest in watch mode                                          |
| `yarn coverage`     | Run the tests with a coverage report                            |
| `yarn lint`         | Lint with ESLint                                                |
| `yarn lint:fix`     | Lint and fix what ESLint can fix                                |
| `yarn format`       | Format `src`, `scripts`, and `tests` with Prettier              |
| `yarn format:check` | Check formatting without writing                                |
| `yarn validate`     | Validate the bundled Bible data                                 |
| `yarn changeset`    | Add a changeset describing your change                          |

Run the CLI locally with `node bin/biblia.js --help` after `yarn build`.

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
