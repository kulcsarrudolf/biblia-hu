# biblia-hu

## 1.0.1

### Patch Changes

- Fix `npm install biblia-hu` failing with `sh: husky: command not found`.

## 1.0.0

### Major Changes

- 7a2852d: Initial release of biblia-hu with RÚF and Revideált Károli translations.

### Minor Changes

- 6b913d6: Add the Bible API: passages, chapters, book details, search, daily verse.
- bcbef03: Add canonical book model, translation metadata, and reference parser.
- a3b778d: Add the biblia CLI and REPL with translation selection.
- 95a1b33: Add the Revideált Károli scraper tooling.
- 8fce131: Add the Revideált Károli translation. Select it with `biblia('KAROLI')` or `biblia -t KAROLI`.
- e443b84: Bundle the RÚF translation data and add the data loader.
