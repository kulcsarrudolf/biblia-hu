# biblia-hu

## Project

`biblia-hu` is a zero-dependency TypeScript library and CLI (`biblia`) that bundles two Hungarian Bible translations as JSON: `RUF` (Revideált új fordítás, 2014, Magyar Bibliatársulat) and `KAROLI` (Revideált Károli, Veritas, 2011).
It is the successor of `biblia-ruf`.
The full master plan, with the per-phase prompts and the verified site and data facts, is in `docs/plan.md`.
Read it before starting any phase.

Layout: `src/` holds the library (`books.ts`, `translations.ts`, `bible.ts`, `reference.ts`, `passage.ts`, `book-details.ts`, `search.ts`, `daily-verse.ts`, `data/loader.ts`, `data/validate.ts`, `utils/`, `cli/`), `scripts/` holds build-time tooling (`import-ruf.ts`, `verify-data.ts`, `scrape-karoli/`) that is never shipped, `json/<dataDir>/<ID>.json` holds the data (`json/ruf/` and `json/karoli/`, 66 files each), `tests/` holds Jest tests that read the real `json/` files, and `bin/biblia.js` is the CLI entry.

Data shape: `json/<dataDir>/<ID>.json` is `[{ chapter: number, title?: string, verses: [{ verse: number, text: string }] }]`.
`verse` is a number.
RÚF files carry chapter `title`, Károli files omit it.
There is no per-translation manifest: book metadata lives in TypeScript.

API rule: anything touching verse data is async (`getPassage`, `getChapter`, `getBookDetails`, `search`, `getDailyVerse`), anything using in-code tables is sync (`getBooks`, `findBook`, `parseReference`).
Usage is one instance per translation: `const ruf = biblia('RUF'); await ruf.getPassage('Jn 3:16')`.

Canonical `BookId` list (66 USFM codes, in canonical order): GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV.

Toolchain: Node 18 or newer (Node 24 locally), Yarn 4.17.1 via Corepack (`yarn install --immutable`), tsup for the dual CJS and ESM build, Jest with ts-jest, ESLint 9 with typescript-eslint, Prettier, Husky, commitlint, lint-staged, Changesets.

## Conventions for every instance

- Never use em dashes or en dashes anywhere (code, comments, docs, commit messages). Use a period, comma, colon, parentheses, or a plain hyphen.
- In Markdown, start each prose sentence on its own line.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `build:`), several small commits per PR, no `Co-Authored-By` trailers, no agent attribution in PR bodies.
- Every PR adds a changeset in `.changeset/` (`yarn changeset`). Phase 1 adds a `major` changeset; later phases add `minor` ones. Combined result of the first release is 1.0.0.
- Zero runtime `dependencies`. Scraper tooling is devDependencies only.
- Tests read the real `json/` files, no mocks, no network.
- Never run the full Károli scrape and never run anything that hits online-biblia.ro more than a handful of times without asking the user first.
- Never commit partial scrapes. `json/karoli/` is either absent or complete (66 files).
- Do not merge PRs. Open the PR with `gh pr create`, report the URL, and stop.
