# Master plan: `biblia-hu` (new library) and deprecation of `biblia-ruf`

This file is the master plan.
It has three parts: shared context, the per-PR sub-plans with copy-paste prompts, and the operator checklist.
Phase 1 copies this file into the new repo as `docs/plan.md` and writes a `CLAUDE.md`, so every later instance can read the full context from the repo.

## Part A. Shared context

### Decisions (final)

- Package name `biblia-hu` (free on npm, verified 2026-09-05). CLI binary `biblia`.
- Two translations at launch: `RUF` (Revideált új fordítás, 2014, Magyar Bibliatársulat) and `KAROLI` (Revideált Károli, Veritas, 2011).
- Data strategy: bundle JSON in the npm package, same as `biblia-ruf`. Scraper is a build-time script in `scripts/`, never shipped. Zero runtime dependencies.
- New repo at `/Users/kulcsarrudolf/Projects/oss/biblia-hu`, GitHub `kulcsarrudolf/biblia-hu`, fresh history, MIT 2026.
- API: instance per translation, `const ruf = biblia('RUF'); await ruf.getPassage('Jn 3:16')`.
- Work is split into 8 PRs. Each PR has several conventional commits. Each PR is executed by a separate Claude Code instance with the prompt in Part B.
- Reference repo (read-only source of code and data): `/Users/kulcsarrudolf/Projects/oss/biblia-ruf`.

### Verified facts

- `biblia-ruf` does not scrape at runtime. It reads `json/<HungarianAbbrev>.json` from disk with a fetch fallback to raw.githubusercontent.com.
- RÚF `json/biblia.json` slugs are USFM codes: GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV.
- Károli site codes differ for 17 books: JDG=JUG, 1SA=1SM, 2SA=2SM, 1KI=1KG, 2KI=2KG, PSA=PS, SNG=SON, EZK=EZE, JOL=JOE, NAM=NAH, MRK=MAK, PHP=PHL, 1TH=1TS, 2TH=2TS, 1TI=1TM, 2TI=2TM, JAS=JAM. All other codes are identical.
- Chapter counts differ in two books: Károli Jóel 3 and Malakiás 4; RÚF Jóel 4 and Malakiás 3. Everything else matches the Protestant canon.
- RÚF JSON has 6 junk verses with ids like `_388` and empty text (Lk 9, Lk 17, Jn 16 twice, Jn 19, ApCsel 10). 31176 verses total, 31170 after cleanup. Some texts have trailing or doubled spaces.
- Károli site markup. Book list `https://www.online-biblia.ro/bible/4`: `tr.old-testament span.book a` and `tr.new-testament span.book a`, href `/bible/4/GEN`, text `1. Mózes`. Book page `/bible/4/GEN`: `ul.bible-chapter-list li a`. Chapter page `/bible/4/GEN/1`: `<dl class="bible-chapter-content"><dt><a href="/bible/4/GEN/1#v1">1</a></dt><dd class="bible-context-0" title=""><a class="vers" name="v1">text</a></dd>...</dl>`. No headings, all `dd` are `bible-context-0`, utf-8, Drupal, HTTP cache max-age 1800.
- Invalid book or chapter on the site returns HTTP 200 with an empty `ul` or `dl`. Empty content must be treated as an error.
- `robots.txt` says `Crawl-delay: 10`. 1189 chapters, so a full polite scrape takes about 3.5 hours. It is run once by the user, and must be resumable.
- Toolchain: Node 24 locally, yarn 4.17.1 (`yarn install --immutable`), CI on Node 20 and 22.
- Copyright: both texts are copyrighted (Kálvin Kiadó, Veritas Kiadó). Same situation as today's `biblia-ruf`. README carries attribution for both.

### Target repo layout

```
biblia-hu/
  bin/biblia.js
  json/ruf/GEN.json ... REV.json        # 66 files, canonical ids as filenames
  json/karoli/GEN.json ... REV.json     # 66 files from the scraper
  src/
    index.ts, types.ts, errors.ts
    books.ts            # canonical 66-book table, normalizeKey, findBook
    translations.ts     # TRANSLATIONS metadata + per-translation book names
    bible.ts            # biblia() factory + Bible implementation
    reference.ts        # parseReference / formatReference (pure, sync)
    passage.ts, book-details.ts, search.ts, daily-verse.ts
    data/loader.ts      # loadBook: local read, memo cache, fetch fallback
    data/validate.ts    # validateBookData, validateTranslation
    utils/fs.ts         # findPackageRoot + readJSONFile
    utils/text.ts       # normalizeWhitespace, stripDiacritics
    cli/index.ts, cli/args.ts, cli/repl.ts, cli/help.ts
  scripts/
    import-ruf.ts, verify-data.ts
    scrape-karoli/{index,http,parse,book-codes,write}.ts
  tests/                # jest, reads real json/, no mocks
    fixtures/chapter-counts.ts
    fixtures/karoli/{book-list,RUT,RUT-1,PS-23,empty-chapter}.html
    scraper/{parse,book-codes}.test.ts
  docs/plan.md          # copy of this master plan
  CLAUDE.md
```

### Data shape (both translations)

`json/<dataDir>/<ID>.json` = `[{ chapter: number, title?: string, verses: [{ verse: number, text: string }] }]`.
`verse` is a number. RÚF files carry chapter `title` (from `biblia.json`), Károli files omit it.
No per-translation manifest: book metadata lives in TypeScript.

### Canonical model

```ts
type BookId = 'GEN' | ... | 'REV';   // 66 literals, the RÚF slugs above
interface CanonicalBook { id: BookId; order: number; testament: 'old' | 'new'; abbreviation: string; aliases: string[] }
// abbreviation = biblia-ruf toc3 ('1Móz', 'Jn'); aliases = toc2 ('1Mózes'), Károli site name ('1. Mózes'), RÚF long name
normalizeKey(s)   // trim, remove '.', collapse and remove inner spaces, NFD strip diacritics, lowercase
findBook(input)   // exact match after normalizeKey on id, abbreviation, aliases; no prefix or fuzzy match
type TranslationId = 'RUF' | 'KAROLI';
interface Translation { id; name; shortName; year; publisher; source; attribution; dataDir; bookNames: Record<BookId, string> }
```

### Public API

```ts
biblia(translation: TranslationId, options?: { dataBaseUrl?: string }): Bible
interface Bible {
  readonly translation: Translation;
  getBooks(): Book[]; getOldTestamentBooks(): Book[]; getNewTestamentBooks(): Book[];   // sync
  findBook(input: string): Book | undefined;          // sync, also matches this translation's bookNames
  parseReference(ref: string): ParsedReference[];     // sync, pure
  getPassage(ref: string): Promise<Passage>;
  getChapter(book: string, chapter: number): Promise<Chapter>;
  getBookDetails(book: string): Promise<BookDetails>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getDailyVerse(date?: Date): Promise<DailyVerse>;
}
interface Book extends CanonicalBook { name: string }
interface Verse { book: BookId; chapter: number; verse: number; text: string }
interface Chapter { book: Book; chapter: number; title?: string; verses: Verse[] }
interface ParsedReference { book: BookId; chapter: number; startVerse?: number; endVerse?: number }  // both undefined = whole chapter
interface PassageSegment extends Required<ParsedReference> { bookInfo: Book; reference: string; verses: Verse[] }
interface Passage { translation: TranslationId; reference: string; segments: PassageSegment[]; verses: Verse[] }
interface BookDetails { book: Book; chapters: number; verses: number; versesPerChapter: Record<number, number>; chapterTitles?: Record<number, string> }
interface SearchOptions { testament?: 'old' | 'new'; book?: string; caseSensitive?: boolean; limit?: number; regex?: boolean }
interface SearchResult extends Verse { bookInfo: Book; reference: string }
interface DailyVerse extends Verse { bookInfo: Book; reference: string }
class BibliaError extends Error { code: 'UNKNOWN_BOOK' | 'INVALID_REFERENCE' | 'CHAPTER_NOT_FOUND' | 'VERSE_NOT_FOUND' | 'DATA_UNAVAILABLE' | 'UNKNOWN_TRANSLATION' }
```

Rule: anything touching verse data is async, anything using in-code tables is sync.
`search` matches a literal substring by default and only builds a `RegExp` when `regex: true`.

Reference grammar: segments split on `;`; each segment matches `^(.+?)\s+(\d+)(?::(.+))?$` so the book token is everything before the last space plus chapter number ("1. Móz 3", "Énekek éneke 2", "Jn 3:16", "Zsolt 139:23-24", "Zsolt 100"); verse spec is a comma list of `n` or `n-m`; whole chapter leaves bounds undefined.

### Conventions for every instance (goes into CLAUDE.md)

- Never use em dashes or en dashes anywhere (code, comments, docs, commit messages). Use a period, comma, colon, parentheses, or a plain hyphen.
- In Markdown, start each prose sentence on its own line.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `build:`), several small commits per PR, no `Co-Authored-By` trailers, no agent attribution in PR bodies.
- Every PR adds a changeset in `.changeset/` (`yarn changeset`). Phase 1 adds a `major` changeset; later phases add `minor` ones. Combined result of the first release is 1.0.0.
- Zero runtime `dependencies`. Scraper tooling is devDependencies only.
- Tests read the real `json/` files, no mocks, no network.
- Never run the full Károli scrape and never run anything that hits online-biblia.ro more than a handful of times without asking the user first.
- Never commit partial scrapes. `json/karoli/` is either absent or complete (66 files).
- Do not merge PRs. Open the PR with `gh pr create`, report the URL, and stop.

## Part B. Sub-plans and prompts

### Bootstrap (user does this once, by hand)

```bash
cd ~/Projects/oss && gh repo create kulcsarrudolf/biblia-hu --public --description "Hungarian Bible translations (RÚF 2014, Revideált Károli 2011) library and CLI" --clone && cd biblia-hu
```

Then for each phase: open a new Claude Code instance in `~/Projects/oss/biblia-hu`, pick the suggested model, paste the prompt.
After the PR is merged on GitHub: `git checkout main && git pull` before starting the next phase.

Model suggestions: Sonnet 5 for mechanical phases (1, 3, 5, 7), Opus 5 or Fable 5.1 for design-heavy phases (2, 4, 6), Sonnet 5 with the `human-prose` skill for phase 8.

---

### Phase 1. Scaffold and tooling (PR 1)

Model: Sonnet 5. Branch `chore/scaffold`.

Commits:
1. `chore: init package.json, tsconfig, tsup, jest, eslint, prettier`
2. `chore: add husky, commitlint, lint-staged, changesets`
3. `ci: add test and lint workflow`
4. `docs: add CLAUDE.md, docs/plan.md, README stub, CONTRIBUTING, LICENSE`
5. `feat: placeholder entry point and smoke test`

Acceptance: `yarn install && yarn lint && yarn format:check && yarn test && yarn build` pass locally; CI green on the PR; `npm pack --dry-run` shows only `dist`, `bin`, `README.md`; no `release.yml` yet (added in phase 8 to avoid publishing early).

Prompt:

```
You are bootstrapping a new TypeScript npm library in this empty repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu (GitHub kulcsarrudolf/biblia-hu).
The master plan is at /Users/kulcsarrudolf/.claude/plans/i-want-to-maka-fuzzy-thompson.md. Read it fully first. You are executing "Phase 1. Scaffold and tooling".
The reference repo is /Users/kulcsarrudolf/Projects/oss/biblia-ruf (read-only). Copy and adapt its tooling.

Tasks, on branch chore/scaffold, as separate conventional commits (see the commit list in the plan):
1. package.json: name biblia-hu, version 0.0.0, description "Hungarian Bible translations (RÚF 2014, Revideált Károli 2011) library and CLI", license MIT, author Kulcsar Rudolf, repository/bugs/homepage for kulcsarrudolf/biblia-hu, main/module/types/exports like biblia-ruf (dist/index.js, dist/index.mjs, dist/index.d.ts), bin { biblia: ./bin/biblia.js }, files [dist/**/*, bin/**/*, json/**/*, README.md], engines node >= 18, sideEffects false, packageManager yarn@4.17.1, keywords (biblia, bible, hungarian, magyar, ruf, karoli, veritas, revideált). Scripts: build (tsup), test, test:watch, coverage, lint, lint:fix, format, format:check (include scripts/**/*.ts and tests/**/*.ts), validate ("tsx scripts/verify-data.ts", the script file is added in phase 3, so for now make it a placeholder that prints "no data yet" and exits 0), prepare (husky), changeset, version-packages, release. devDependencies: the same list as biblia-ruf plus tsx and cheerio. No dependencies. Zero runtime deps is a hard rule.
2. Copy and adapt tsconfig.json (drop rootDir, include src, scripts, tests; target es2020), tsup.config.ts (entries src/index.ts and src/cli/index.ts, keep shims: true and splitting: false with their comments; the CLI entry can be a stub file), jest.config.js (roots tests, testMatch **/*.test.ts, coverage from src excluding src/cli, testPathIgnorePatterns tests/fixtures), eslint.config.mjs (ignore dist, coverage, tests/fixtures), .prettierrc, commitlint.config.mjs, .husky/pre-commit (npx lint-staged then yarn test) and .husky/commit-msg, lint-staged config, .changeset/config.json (access public, baseBranch main), .gitignore (plus json/**/*.tmp), .gitattributes (plus "json/** linguist-generated=true"), .editorconfig if present.
3. .github/workflows/ci.yml: on push to main and all PRs, Node 20 and 22 matrix, corepack enable, yarn install --immutable, lint, format:check, coverage, build, validate. Do NOT add release.yml (phase 8).
4. Write CLAUDE.md containing the "Conventions for every instance" section from the master plan verbatim plus a short "Project" paragraph (what the lib is, the layout, the data shape, the sync/async rule, the canonical BookId list). Copy the master plan into docs/plan.md unchanged.
5. LICENSE (MIT, "Copyright (c) 2026 Kulcsár Rudolf"). README.md stub: title, one paragraph saying it is the successor of biblia-ruf with RÚF and Revideált Károli, "work in progress" note. CONTRIBUTING.md adapted from biblia-ruf (yarn 4, scripts table, changeset per PR).
6. bin/biblia.js (shebang, require('../dist/cli/index.js')), src/index.ts exporting a VERSION constant read from package.json or a literal, src/cli/index.ts stub printing "biblia-hu CLI: not implemented yet", tests/smoke.test.ts asserting the export.
7. Add a changeset of type major with the text "Initial release of biblia-hu with RÚF and Revideált Károli translations."
8. Run yarn install, yarn lint, yarn format:check, yarn test, yarn build, npm pack --dry-run. Fix anything red.
9. Push the branch and open a PR with gh pr create (title "chore: scaffold biblia-hu", body summarizing the tooling and the acceptance checks you ran). Do not merge. Report the PR URL.

Rules: no em or en dashes anywhere, one sentence per line in Markdown, conventional commits, no Co-Authored-By trailers, no agent attribution in the PR body.
```

---

### Phase 2. Canonical book model and reference parser (PR 2)

Model: Opus 5 or Fable 5.1. Branch `feat/canonical-model`.

Commits:
1. `feat: add canonical book table with aliases and findBook`
2. `feat: add translation metadata and per-translation book names`
3. `feat: add pure reference parser and formatter`
4. `feat: add BibliaError and shared types`
5. `test: cover books, translations, and reference parsing`
6. `chore: add changeset`

Acceptance: 66 books, 39 OT and 27 NT, unique normalized keys across all ids, abbreviations, and aliases; `findBook` handles `1Móz`, `1Moz`, `1. Mózes`, `GEN`, `gen`, `Zsoltárok`; `parseReference` handles the grammar cases and throws `BibliaError` with codes; coverage of the new modules above 95 percent.

Prompt:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute "Phase 2. Canonical book model and reference parser" on branch feat/canonical-model with the commits listed there.
Reference data: /Users/kulcsarrudolf/Projects/oss/biblia-ruf/json/biblia.json (fields title, toc2, toc3, slug, part) and /Users/kulcsarrudolf/Projects/oss/biblia-ruf/src/books.ts (long names; note the typo "efezusiakkoz" there, use "efezusiakhoz"). Parser to port: /Users/kulcsarrudolf/Projects/oss/biblia-ruf/src/utils/passage-parser.ts.

Deliverables:
1. src/books.ts: BookId union (the 66 RÚF slugs in canonical order), CanonicalBook interface, BOOKS array (id, order 1..66, testament, abbreviation = toc3, aliases = [toc2, Károli site name, RÚF long name, common variants]). The Károli site names in order are: 1. Mózes, 2. Mózes, 3. Mózes, 4. Mózes, 5. Mózes, Józsué, Bírák, Ruth, 1. Sámuel, 2. Sámuel, 1. Királyok, 2. Királyok, 1. Krónikák, 2. Krónikák, Ezsdrás, Nehémiás, Eszter, Jób, Zsoltárok, Példabeszédek, Prédikátor, Énekek éneke, Ézsaiás, Jeremiás, Jeremiás Siralmai, Ezékiel, Dániel, Hóseás, Jóel, Ámós, Abdiás, Jónás, Mikeás, Náhum, Habakuk, Sofóniás, Aggeus, Zakariás, Malakiás, Máté, Márk, Lukács, János, Apostolok Cselekedetei, Róma, 1. Korintus, 2. Korintus, Galata, Efézus, Filippi, Kolossé, 1. Thessalonika, 2. Thessalonika, 1. Timóteus, 2. Timóteus, Titusz, Filemon, Zsidókhoz írt levél, Jakab, 1. Péter, 2. Péter, 1. János, 2. János, 3. János, Júdás, Jelenések. Export normalizeKey and findBook as specified in docs/plan.md (exact match only, no prefix matching, because Ez vs Ezsd and Jn vs Jón must stay unambiguous). Export getBooks, getOldTestamentBooks, getNewTestamentBooks over the canonical table.
2. src/translations.ts: TranslationId, Translation interface, TRANSLATIONS with both RUF (name "Revideált új fordítás", shortName "RÚF", year 2014, publisher "Magyar Bibliatársulat", source "https://abibliamindenkie.hu", dataDir "ruf", bookNames = RÚF long names) and KAROLI (name "Revideált Károli Biblia (Veritas)", shortName "Revideált Károli", year 2011, publisher "Veritas Kiadó", source "https://www.online-biblia.ro/bible/4", dataDir "karoli", bookNames = the site names above). Export TRANSLATION_IDS = ['RUF'] for now (KAROLI is registered in phase 7 once its data exists) and a getTranslation(id) that throws BibliaError UNKNOWN_TRANSLATION for ids not in TRANSLATION_IDS.
3. src/reference.ts: parseReference(ref): ParsedReference[] and formatReference(segment, book?) using the grammar in docs/plan.md. Pure and sync. Throw BibliaError INVALID_REFERENCE or UNKNOWN_BOOK with helpful messages.
4. src/errors.ts (BibliaError with code), src/types.ts (all public interfaces from docs/plan.md), src/utils/text.ts (normalizeWhitespace, stripDiacritics). Update src/index.ts to export the new modules and types.
5. Tests in tests/books.test.ts, tests/translations.test.ts, tests/reference.test.ts covering the acceptance list in docs/plan.md, including the five cases from /Users/kulcsarrudolf/Projects/oss/biblia-ruf/tests/passage-parser.test.ts adapted to the sync API.
6. Changeset (minor): "Add canonical book model, translation metadata, and reference parser."
7. Run yarn lint, yarn format:check, yarn coverage, yarn build. Push and open the PR with gh pr create. Do not merge. Report the URL.

Rules in CLAUDE.md apply (no em or en dashes, one sentence per line in Markdown, conventional commits, no Co-Authored-By).
```

---

### Phase 3. RÚF data import, loader, validation (PR 3)

Model: Sonnet 5. Branch `feat/ruf-data`.

Commits:
1. `feat: add fs helpers and memoized data loader with fetch fallback`
2. `feat: add data validation and chapter count fixture`
3. `build: add import-ruf script`
4. `data: import RÚF translation as json/ruf` (66 files, one commit)
5. `build: wire verify-data script and run validate in CI`
6. `test: cover loader and data integrity`
7. `chore: add changeset`

Acceptance: `json/ruf/` has 66 files named by BookId; 31170 verses total; all verse ids numeric and contiguous per chapter; chapter counts match `tests/fixtures/chapter-counts.ts`; `yarn validate` passes and runs in CI; GEN chapter 1 title is "A világ teremtése".

Prompt:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute "Phase 3. RÚF data import, loader, validation" on branch feat/ruf-data with the commits listed there.
Source data: /Users/kulcsarrudolf/Projects/oss/biblia-ruf/json/ (biblia.json manifest plus 66 files named by Hungarian abbreviation, shape [{chapter:number, verses:[{verse:string, text:string}]}]). Code to copy: /Users/kulcsarrudolf/Projects/oss/biblia-ruf/src/utils/utils.ts (findPackageRoot, readJSONFile) and /Users/kulcsarrudolf/Projects/oss/biblia-ruf/src/utils/validate.ts.

Known data facts: 6 junk verses have ids like "_388" and empty text (Lk 9, Lk 17, Jn 16 twice, Jn 19, ApCsel 10); total 31176 verses, 31170 after dropping them; some texts have trailing or doubled spaces; chapter titles live only in biblia.json chapter[].title; RÚF has Jóel 4 chapters and Malakiás 3.

Deliverables:
1. src/utils/fs.ts: findPackageRoot and readJSONFile copied from biblia-ruf.
2. src/data/loader.ts: loadBook(translation: Translation, bookId: BookId): Promise<ChapterData[]>, memoized per translation and book in a Map; tries readJSONFile(`json/${translation.dataDir}/${bookId}.json`), on failure fetches `${dataBaseUrl}/json/${dataDir}/${bookId}.json` (default base https://raw.githubusercontent.com/kulcsarrudolf/biblia-hu/main), throws BibliaError DATA_UNAVAILABLE when both fail. Export a clearCache() for tests. Keep top-level fs/path imports so tsup shims keep working.
3. src/data/validate.ts: validateBookData(data): ValidationError[] (chapters numbered 1..n contiguously, verses numbered 1..m contiguously, verse ids are numbers, text non-empty, optional string title) and validateTranslation(translation, expectedChapterCounts) that checks all 66 files exist and match expected counts.
4. tests/fixtures/chapter-counts.ts: CANONICAL_CHAPTER_COUNTS derived from biblia.json (Record<BookId, number>) and OVERRIDES = { KAROLI: { JOL: 3, MAL: 4 } }, plus expectedChapterCounts(translationId).
5. scripts/import-ruf.ts (run with tsx): reads ../biblia-ruf/json, maps toc3 to slug, drops verses whose id is not /^\d+$/, converts verse to number, merges chapter titles, applies normalizeWhitespace (trim, collapse runs of whitespace to one space), writes json/ruf/<ID>.json with 2-space JSON and prints per-book and total verse counts. Add script "import:ruf". Run it and commit the 66 files in a single data commit.
6. scripts/verify-data.ts: iterates TRANSLATION_IDS, runs validateTranslation, prints a summary, exits 1 on any error. Replace the phase 1 placeholder "validate" script with "tsx scripts/verify-data.ts". CI already runs yarn validate; confirm it passes.
7. tests/data.test.ts (every RÚF book validates, counts match, total 31170, no empty text, GEN 1 title "A világ teremtése") and tests/loader.test.ts (memo returns the same instance; a fake translation with a missing dataDir and an unreachable dataBaseUrl like http://127.0.0.1:9 rejects with DATA_UNAVAILABLE).
8. Changeset (minor): "Bundle the RÚF translation data and add the data loader."
9. Run yarn lint, yarn format:check, yarn coverage, yarn build, yarn validate. Push, open the PR with gh pr create, do not merge, report the URL.

Rules in CLAUDE.md apply.
```

---

### Phase 4. Bible API (PR 4)

Model: Opus 5 or Fable 5.1. Branch `feat/bible-api`.

Commits:
1. `feat: add biblia() factory and Bible instance`
2. `feat: implement getPassage and getChapter`
3. `feat: implement getBookDetails`
4. `feat: implement search with literal and regex modes`
5. `feat: implement deterministic daily verse`
6. `test: cover the Bible API against RÚF data`
7. `docs: document the API in README`
8. `chore: add changeset`

Acceptance: `biblia('RUF').getPassage('Jn 3:16')` returns the RÚF text; multi-segment references return all segments; whole chapter `Zsolt 100` returns 5 verses; out-of-range throws `CHAPTER_NOT_FOUND` or `VERSE_NOT_FOUND`; `search('(')` does not throw; daily verse is deterministic per date and every curated verse resolves.

Prompt:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute "Phase 4. Bible API" on branch feat/bible-api with the commits listed there.
Reference implementations to port (read-only): /Users/kulcsarrudolf/Projects/oss/biblia-ruf/src/passage.ts, book-details.ts, search.ts, daily-verse.ts (51 curated verses keyed by Hungarian abbreviation; re-key them by BookId) and the tests under /Users/kulcsarrudolf/Projects/oss/biblia-ruf/tests/.

Deliverables, following the Public API section of docs/plan.md exactly:
1. src/bible.ts: biblia(translation, options?) returning a Bible object. Sync methods use the tables from src/books.ts and src/translations.ts; findBook on the instance also matches translation.bookNames. Async methods go through loadBook from src/data/loader.ts.
2. src/passage.ts: getPassage(ref) parses with parseReference, loads each book once, resolves whole-chapter bounds from the loaded chapter, builds segments with normalized reference strings via formatReference, and a flattened verses array. Throw CHAPTER_NOT_FOUND and VERSE_NOT_FOUND with clear messages. getChapter(book, chapter) returns the Chapter with title when present.
3. src/book-details.ts: chapters, total verses, versesPerChapter as a plain object, chapterTitles when the data has titles.
4. src/search.ts: async, literal substring by default (escape the query), RegExp only with regex: true, caseSensitive default false, limit default 100, testament and book filters, results carry bookInfo and reference.
5. src/daily-verse.ts: same hash-of-date algorithm as biblia-ruf over the curated list, async, returns DailyVerse.
6. src/index.ts exports biblia, Bible, all types, BibliaError, TRANSLATIONS, TRANSLATION_IDS, BOOKS, findBook, parseReference, formatReference, normalizeKey.
7. Tests: tests/passage.test.ts, tests/book-details.test.ts, tests/search.test.ts, tests/daily-verse.test.ts, tests/bible.test.ts. Port the assertions from biblia-ruf tests (exact Hungarian text for Jn 3:16 and Zsolt 139:23-24), add multi-segment, whole chapter, error codes, literal search of "(" not throwing, regex mode, daily verse determinism, and a loop asserting every curated daily verse resolves to non-empty text. Write tests as a function of translation id over TRANSLATION_IDS so phase 7 can enable KAROLI without rewriting them.
8. README.md: replace the stub with install, quick start (biblia('RUF')), and an API reference section per method with short examples. Keep a "Translations" section listing RUF only, with a note that Revideált Károli arrives in a later release.
9. Changeset (minor): "Add the Bible API: passages, chapters, book details, search, daily verse."
10. Run yarn lint, yarn format:check, yarn coverage, yarn build, yarn validate. Push, open the PR with gh pr create, do not merge, report the URL.

Rules in CLAUDE.md apply.
```

---

### Phase 5. CLI and REPL (PR 5)

Model: Sonnet 5. Branch `feat/cli`.

Commits:
1. `feat: add testable argument parser with translation flag`
2. `feat: implement CLI commands over the Bible API`
3. `feat: port the REPL with translation switching`
4. `test: cover parseArgs`
5. `docs: document CLI usage`
6. `chore: add changeset`

Acceptance: `node bin/biblia.js --p="Jn 3:16"` prints the RÚF verse; `-t KAROLI` prints a clear error listing valid ids until phase 7; `--translations`, `--showBooks`, `--bookDetails Zsolt`, `--search=szeretet`, `--today`, `-i`, `--help` all work; unknown flags print help and exit 1.

Prompt:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute "Phase 5. CLI and REPL" on branch feat/cli with the commits listed there.
Reference (read-only): /Users/kulcsarrudolf/Projects/oss/biblia-ruf/src/cli/index.ts, repl.ts, help.ts and the CLI section of its README.md.

Deliverables:
1. src/cli/args.ts: parseArgs(argv): CliArgs handling --p=/--passage=, --showBooks, --old, --new, --bookDetails <book>, --search=, --today, --translations, -i, --help, and the translation selection via --translation=<id>, -t <id>, or env BIBLIA_TRANSLATION, default RUF. Return a typed object; no runtime dependencies.
2. src/cli/index.ts: dispatch on parseArgs, create the Bible with biblia(id), print passages as "<normalized reference> (<translation shortName>)" then "n. text" lines, book lists with translation-specific names, bookDetails as a table, search results as "reference: text", today as reference then text, --translations as a table of id, name, year, publisher. Unknown translation prints the valid ids and exits 1. Errors print the BibliaError message and exit 1.
3. src/cli/repl.ts: prompt "biblia(RUF)> ", commands: a reference (prints the passage), "search <query>", "today", "books", "translation <id>" (switches the instance and prompt), "help", "exit". No dashes in the banner text.
4. src/cli/help.ts: usage text covering every flag.
5. tests/cli-args.test.ts covering every flag, -t and --translation=, env fallback, default RUF.
6. README.md: CLI section (global install, every flag with an example, REPL transcript) and mention -t.
7. Changeset (minor): "Add the biblia CLI and REPL with translation selection."
8. Run yarn lint, yarn format:check, yarn coverage, yarn build, then smoke test the built CLI with node bin/biblia.js for each command. Push, open the PR with gh pr create, do not merge, report the URL.

Rules in CLAUDE.md apply.
```

---

### Phase 6. Károli scraper (PR 6)

Model: Opus 5 or Fable 5.1. Branch `build/karoli-scraper`.

Commits:
1. `build: add throttled fetcher with retry for the scraper`
2. `build: add cheerio parsers for book list, chapter list, and chapter`
3. `build: add Károli site code map and atomic JSON writer`
4. `build: add scrape-karoli CLI with resume and validation`
5. `test: add HTML fixtures and scraper parser tests`
6. `docs: describe data provenance and scraping policy in CONTRIBUTING`
7. `chore: add changeset`

Acceptance: fixture tests pass offline; `yarn scrape:karoli --book=PHM --out=/tmp/karoli-test` (1 chapter, run only after asking the user) produces a valid file; no `json/karoli/` committed in this PR.

Prompt:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute "Phase 6. Károli scraper" on branch build/karoli-scraper with the commits listed there.
Site facts, markup selectors, the 17 site code overrides, the empty-page behaviour, and the robots.txt crawl delay are all in docs/plan.md under "Verified facts". Follow them exactly.

Deliverables (all under scripts/scrape-karoli/, run with tsx, cheerio as devDependency, never shipped):
1. http.ts: createFetcher({ delayMs = 10000, retries = 3, userAgent }) returning fetchHtml(url). Enforce delayMs between request starts, exponential backoff (2s, 4s, 8s) on network errors, 429 and 5xx, throw immediately on other 4xx, User-Agent "biblia-hu-scraper/1.0 (+https://github.com/kulcsarrudolf/biblia-hu)". Node built-in fetch.
2. parse.ts: parseBookList(html) -> { code, name, testament }[] from tr.old-testament span.book a and tr.new-testament span.book a; parseChapterList(html) -> number[] from ul.bible-chapter-list li a; parseChapter(html) -> { verse: number, text: string }[] from dl.bible-chapter-content pairing each dt a number with the following dd text (cheerio .text() decodes entities), then normalizeWhitespace from src/utils/text.ts. Empty results throw EmptyPageError.
3. book-codes.ts: KAROLI_SITE_CODES: Partial<Record<BookId, string>> with the 17 overrides and siteCode(id).
4. write.ts: writeBookJson(outDir, id, chapters) writing <id>.json.tmp then renaming, 2-space JSON, shape [{ chapter, verses: [{ verse, text }] }] (no title).
5. index.ts: flags --book=RUT,PHM (comma list of BookIds, default all 66), --delay=10000, --out=json/karoli, --force, --verbose. Per book: skip if the output exists and validateBookData passes with a non-zero chapter count unless --force; fetch the chapter list; fetch each chapter; validate; write; compare the chapter count with expectedChapterCounts('KAROLI') from tests/fixtures/chapter-counts.ts and warn on mismatch. Log progress with an ETA. Exit 1 listing failed books so a rerun resumes. Add script "scrape:karoli": "tsx scripts/scrape-karoli/index.ts".
6. Fixtures: before fetching anything from online-biblia.ro, ask the user for permission. Then save with curl, waiting at least 10 seconds between requests: tests/fixtures/karoli/book-list.html (/bible/4), RUT.html (/bible/4/RUT), RUT-1.html (/bible/4/RUT/1), PS-23.html (/bible/4/PS/23), empty-chapter.html (/bible/4/RUT/99). That is 5 requests total.
7. Tests: tests/scraper/parse.test.ts (66 books with 39 old and 27 new, RUT chapters [1,2,3,4], RUT 1 has 22 verses and verse 1 is non-empty, PS 23 verse 1 keeps its bracketed title text, empty chapter throws EmptyPageError, no "&amp;" remains) and tests/scraper/book-codes.test.ts (codes from the book list fixture equal BOOKS.map(siteCode) in order).
8. CONTRIBUTING.md: a "Data" section (where JSON lives, import-ruf, scrape-karoli usage, the 10 s crawl delay, subset first then full run, never commit partial scrapes).
9. Changeset (minor): "Add the Revideált Károli scraper tooling."
10. Do NOT run the full scrape and do NOT commit any json/karoli files. Optionally, with explicit user permission, run yarn scrape:karoli --book=PHM --out=/tmp/karoli-test to prove the pipeline (one chapter). Run yarn lint, yarn format:check, yarn coverage, yarn build. Push, open the PR with gh pr create, do not merge, report the URL.

Rules in CLAUDE.md apply.
```

---

### Phase 7. Károli data and registration (PR 7)

Model: Sonnet 5 (mostly operator work). Branch `feat/karoli-data`.

Commits:
1. `data: add Revideált Károli translation as json/karoli` (66 files, one commit)
2. `feat: register KAROLI translation`
3. `test: run data and API tests over both translations`
4. `docs: add translations table with attribution`
5. `chore: add changeset`

Operator steps before starting the instance (user runs these by hand, they take hours):

```bash
yarn scrape:karoli --book=RUT,PHM
```

Inspect `json/karoli/RUT.json` and `json/karoli/PHM.json`, then:

```bash
caffeinate -i yarn scrape:karoli
```

Rerun the same command after any interruption until it reports 66/66. Then start the instance.

Acceptance: `json/karoli/` has 66 files; `yarn validate` reports both translations valid with JOL 3 and MAL 4 for KAROLI; `biblia('KAROLI').getPassage('Jn 3:16')` returns the Károli text; all phase 4 tests pass for both ids; total Károli verses above 31000.

Prompt:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute "Phase 7. Károli data and registration" on branch feat/karoli-data with the commits listed there.
The user has already run the scraper. Verify first: json/karoli/ must contain exactly 66 files named by BookId. If any are missing, stop and tell the user which ones, do not scrape yourself.

Deliverables:
1. Commit the 66 json/karoli files in a single data commit.
2. src/translations.ts: add 'KAROLI' to TRANSLATION_IDS.
3. Run yarn validate; expect both translations valid with Károli JOL 3 chapters and MAL 4 chapters (overrides already in tests/fixtures/chapter-counts.ts).
4. Extend tests: the data, passage, book-details, search, daily-verse tests iterate TRANSLATION_IDS, so add KAROLI-specific snapshot assertions (Jn 3:16 text, GEN 1 has no title, JOL 3 chapters, MAL 4 chapters, total Károli verses above 31000, every curated daily verse resolves in KAROLI). Confirm tests/cli-args and the CLI -t KAROLI path work with node bin/biblia.js -t KAROLI --p="Jn 3:16".
5. README.md: "Translations" section becomes a table (id, name, year, publisher, source URL, attribution line) and the quick start shows both biblia('RUF') and biblia('KAROLI').
6. Changeset (minor): "Add the Revideált Károli (Veritas 2011) translation."
7. Run yarn lint, yarn format:check, yarn coverage, yarn build, yarn validate. Push, open the PR with gh pr create, do not merge, report the URL.

Rules in CLAUDE.md apply.
```

---

### Phase 8. Release and deprecation (PR 8 in biblia-hu, PR 9 in biblia-ruf)

Model: Sonnet 5 with the `human-prose` skill for README text. Branches `docs/release-1.0` (biblia-hu) and `docs/deprecate` (biblia-ruf).

Commits in biblia-hu:
1. `docs: finalize README with migration guide from biblia-ruf`
2. `ci: add changesets release workflow`
3. `chore: verify npm pack contents`

Commits in biblia-ruf:
1. `docs: add deprecation notice pointing to biblia-hu`
2. `chore: mark package description as deprecated`
3. `chore: add changeset`

User actions: add the `NPM_TOKEN` secret to the biblia-hu repo before merging PR 8; merge the "Version Packages" PR that changesets opens to publish 1.0.0; after it is live, run:

```bash
npm deprecate biblia-ruf@"*" "Superseded by biblia-hu: https://www.npmjs.com/package/biblia-hu"
```

Then archive the biblia-ruf GitHub repo.

Acceptance: `npm pack --dry-run` lists only dist, bin, json/ruf, json/karoli, README.md; ESM and CJS import smoke tests pass from a packed tarball; biblia-ruf README shows the banner and 2.0.7 is published by its own release workflow.

Prompt for biblia-hu:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-hu. Read CLAUDE.md and docs/plan.md first, then execute the biblia-hu part of "Phase 8. Release and deprecation" on branch docs/release-1.0 with the commits listed there. Use the human-prose skill for README prose.

Deliverables:
1. README.md final: badges (npm version, license, downloads, CI), intro naming both translations, "Migrating from biblia-ruf" section with a table mapping every old export (getBiblePassage, getBibleBooks, getBibleBooksOldTestament, getBibleBooksNewTestament, getBookDetails, searchBible, getDailyVerse, CLI flags) to the new API, noting that search and getDailyVerse are now async and verse ids are numbers, install, quick start, API reference, translations table with attribution, CLI, REPL, TypeScript types, data provenance and scraping policy (10 s crawl delay, one-time scrape), license.
2. .github/workflows/release.yml copied from /Users/kulcsarrudolf/Projects/oss/biblia-ruf/.github/workflows/release.yml, adapted to yarn 4 (corepack enable, yarn install --immutable), keeping changesets/action with NPM_TOKEN and NPM_CONFIG_PROVENANCE. Tell the user in the PR body that the NPM_TOKEN secret must exist before merging.
3. Verify: yarn build, npm pack --dry-run (only dist, bin, json/ruf, json/karoli, README.md), then in a temp directory npm install the packed tarball and run both `node -e "const {biblia}=require('biblia-hu'); biblia('KAROLI').getPassage('Jn 3:16').then(p=>console.log(p.verses[0].text))"` and the ESM equivalent with --input-type=module. Paste the outputs into the PR body.
4. No new changeset is needed (the major one from phase 1 plus the minors produce 1.0.0). Confirm with yarn changeset status.
5. Push, open the PR with gh pr create, do not merge, report the URL, and remind the user of the three manual steps: add NPM_TOKEN, merge this PR, merge the Version Packages PR.

Rules in CLAUDE.md apply.
```

Prompt for biblia-ruf:

```
Repo: /Users/kulcsarrudolf/Projects/oss/biblia-ruf. This package is being deprecated in favour of biblia-hu (https://github.com/kulcsarrudolf/biblia-hu, npm biblia-hu). Work on branch docs/deprecate with three conventional commits: docs, chore, chore (changeset).

Deliverables:
1. README.md: add a "Deprecated" banner at the very top: this package is superseded by biblia-hu, which bundles RÚF and Revideált Károli, with a link and a short migration table (getBiblePassage -> biblia('RUF').getPassage, getBibleBooks -> biblia('RUF').getBooks, getBookDetails -> getBookDetails, searchBible -> search (async), getDailyVerse -> getDailyVerse (async), CLI -> same flags plus -t).
2. package.json: prefix description with "DEPRECATED: superseded by biblia-hu. ".
3. src/cli/help.ts: print a one-line deprecation notice at the top of the help text. Keep tests green.
4. Add a patch changeset: "Deprecate biblia-ruf in favour of biblia-hu."
5. Run yarn lint, yarn format:check, yarn test, yarn build. Push, open the PR with gh pr create, do not merge, report the URL. Remind the user that after biblia-hu 1.0.0 is on npm they must run: npm deprecate biblia-ruf@"*" "Superseded by biblia-hu: https://www.npmjs.com/package/biblia-hu"

Rules: no em or en dashes, one sentence per line in Markdown, conventional commits, no Co-Authored-By trailers, no agent attribution in the PR body.
```

## Part C. Operator checklist

1. Bootstrap the repo (Part B, bootstrap block).
2. Phase 1 instance. Merge PR 1. Pull main.
3. Phase 2 instance. Merge PR 2. Pull main.
4. Phase 3 instance. Merge PR 3. Pull main.
5. Phase 4 instance. Merge PR 4. Pull main.
6. Phase 5 instance. Merge PR 5. Pull main.
7. Phase 6 instance (grant the 5 fixture requests when asked). Merge PR 6. Pull main.
8. Run the subset scrape, inspect, run the full scrape (about 3.5 h). Phase 7 instance. Merge PR 7. Pull main.
9. Add `NPM_TOKEN` to the biblia-hu repo. Phase 8 biblia-hu instance. Merge PR 8. Merge the Version Packages PR. Confirm `biblia-hu@1.0.0` on npm.
10. Phase 8 biblia-ruf instance. Merge PR 9. Run `npm deprecate`. Archive the biblia-ruf repo.

Verification at the end: `npx biblia-hu -t KAROLI --p="Jn 3:16"` and `npx biblia-hu --p="Jn 3:16"` print the two different renderings; `npm view biblia-ruf deprecated` shows the message.
