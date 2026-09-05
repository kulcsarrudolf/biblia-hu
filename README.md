# biblia-hu

Hungarian Bible translations (RÚF 2014, Revideált Károli 2011) library and CLI.

`biblia-hu` is the successor of [`biblia-ruf`](https://github.com/kulcsarrudolf/biblia-ruf).
It bundles Hungarian translations behind one API: passages, chapters, book details, full text search, and a verse of the day.
Verse data ships inside the npm package as JSON, so the library has zero runtime dependencies and never fetches at runtime.

> **Work in progress.**
> The package is being built in phases and has not been published yet.
> See [docs/plan.md](docs/plan.md) for the roadmap and [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.

## Install

```bash
yarn add biblia-hu
```

```bash
npm install biblia-hu
```

Node 18 or newer.
The package ships both CommonJS and ES module builds with type declarations.

## Quick start

```ts
import { biblia } from 'biblia-hu';

const ruf = biblia('RUF');

const passage = await ruf.getPassage('Jn 3:16');
console.log(passage.reference);
// 'Jn 3:16'
console.log(passage.verses[0].text);
// 'Mert úgy szerette Isten a világot, hogy egyszülött Fiát adta, ...'
```

The same in CommonJS:

```js
const { biblia } = require('biblia-hu');

const ruf = biblia('RUF');
ruf.getPassage('Zsolt 100').then((passage) => console.log(passage.verses.length));
// 5
```

One instance serves one translation, so you pick the translation once instead of passing it to every call.
Methods that only read the in code book tables are synchronous.
Everything that touches verse text is asynchronous and reads the bundled JSON through a cache, so the second call for the same book costs nothing.

## Translations

| Id    | Name                  | Year | Publisher             |
| ----- | --------------------- | ---- | --------------------- |
| `RUF` | Revideált új fordítás | 2014 | Magyar Bibliatársulat |

`TRANSLATION_IDS` lists the translations whose data is bundled, and `biblia()` throws `UNKNOWN_TRANSLATION` for anything else.
The Revideált Károli (Veritas, 2011) arrives in a later release, so `KAROLI` is not usable yet.

## References

A reference is one or more segments separated by semicolons.

| Reference            | Meaning                                     |
| -------------------- | ------------------------------------------- |
| `Jn 3:16`            | one verse                                   |
| `Zsolt 139:23-24`    | an inclusive range                          |
| `Zsolt 139:3,23-24`  | a list of verses and ranges                 |
| `Zsolt 100`          | a whole chapter                             |
| `Jn 3:16; Zsolt 100` | two segments, resolved in the order written |

The book token is everything before the chapter number, so multi word names work: `1. Móz 3`, `Énekek éneke 2`, `Jeremiás siralmai 3`.
Books are matched exactly after normalization (dots and inner spaces removed, accents stripped, lowercased), with no prefix or fuzzy matching.
`Ez` is Ezékiel and never Ezsdrás, `Jn` is János and never Jónás.

## CLI

The package ships a `biblia` binary.
Install it globally to get the command on your path:

```bash
npm install --global biblia-hu
```

Or run it without installing:

```bash
npx biblia-hu --p="Jn 3:16"
```

Every flag:

```bash
# A passage: --p and --passage are the same flag
biblia --p="Jn 3:16"
biblia --passage="Zsolt 139:23-24"
biblia --p="Zsolt 139:23-24; Jn 3:16"

# The books of the canon, with this translation's names
biblia --showBooks
biblia --showBooks --old
biblia --showBooks --new

# The structure of one book
biblia --bookDetails Zsolt

# Full text search, at most 20 hits
biblia --search="szeretet"
biblia --search="Isten" --new
biblia --search="szeretet" --old

# The verse of the day, the same verse for everyone on a given day
biblia --today

# The translations you can select
biblia --translations

# Interactive mode
biblia -i

# Usage
biblia --help
```

A passage prints the normalized reference with the translation, then one line per verse:

```
$ biblia --p="Jn 3:16"
Jn 3:16 (RÚF)

16. Mert úgy szerette Isten a világot, hogy egyszülött Fiát adta, hogy aki hisz őbenne, el ne vesszen, hanem örök élete legyen.
```

Search prints one `reference: text` line per hit, and `--bookDetails` prints a small table:

```
$ biblia --bookDetails Zsolt
A Zsoltárok könyve (Zsolt)

Field         Value
------------  ----------
Id            PSA
Abbreviation  Zsolt
Testament     Ószövetség
Order         19
Chapters      150
Verses        2527
```

Anything that fails prints the Hungarian error message and exits with code 1.

### Choosing a translation

Three ways, in order of precedence: the `-t` flag, the `--translation=` flag, then the `BIBLIA_TRANSLATION` environment variable.
Without any of them the CLI uses `RUF`.

```bash
biblia -t RUF --p="Jn 3:16"
biblia --translation=RUF --today

export BIBLIA_TRANSLATION=RUF
biblia --p="Jn 3:16"
```

An id whose data is not bundled prints the ids you can use and exits with code 1.
`biblia --translations` lists the same ids with their metadata:

```
$ biblia --translations
Id   Name                   Year  Publisher
---  ---------------------  ----  ---------------------
RUF  Revideált új fordítás  2014  Magyar Bibliatársulat
```

### Interactive mode

`biblia -i` starts a REPL.
The prompt names the current translation, and `translation <id>` switches it without restarting.

```
$ biblia -i
biblia-hu interactive mode.
Translation: Revideált új fordítás (RÚF).
Type "help" for the commands, "exit" to leave.

biblia(RUF)> Jn 3:16
Jn 3:16 (RÚF)

16. Mert úgy szerette Isten a világot, hogy egyszülött Fiát adta, hogy aki hisz őbenne, el ne vesszen, hanem örök élete legyen.

biblia(RUF)> search szeretet
1Móz 19:19: Ha már kegyelmes voltál szolgádhoz, és olyan nagy szeretettel bánsz velem, ...

biblia(RUF)> today
2Kor 5:17

Ezért ha valaki Krisztusban van, új teremtés az: a régi elmúlt, és íme: új jött létre.

biblia(RUF)> translation RUF
Revideált új fordítás (RÚF)

biblia(RUF)> exit
Viszontlátásra!
```

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `<reference>`      | Prints the passage, for example `Jn 3:16` |
| `search <query>`   | Searches the verse text, at most 10 hits  |
| `today`            | Prints the verse of the day               |
| `books`            | Lists every book of the canon             |
| `translation <id>` | Switches to another translation           |
| `help`             | Lists these commands                      |
| `exit`             | Leaves the interactive mode               |

## API reference

### `biblia(translation, options?)`

Creates the API for one translation.
`options.dataBaseUrl` overrides where a book file is fetched from when it is missing on disk, which only matters in unusual bundling setups.

```ts
const ruf = biblia('RUF');
ruf.translation.shortName; // 'RÚF'
ruf.translation.attribution; // copyright line to print next to quoted text
```

Throws `UNKNOWN_TRANSLATION` when the id is not one of `TRANSLATION_IDS`.

### `getBooks()`, `getOldTestamentBooks()`, `getNewTestamentBooks()`

Synchronous.
Return the 66, 39, and 27 books of the canon in canonical order, each carrying the name this translation uses.

```ts
ruf.getBooks()[0];
// { id: 'GEN', order: 1, testament: 'old', abbreviation: '1Móz',
//   aliases: ['1Mózes', 'Mózes első könyve'], name: 'Mózes első könyve' }
```

Every call returns fresh copies, so changing a result cannot corrupt the tables.

### `findBook(input)`

Synchronous.
Resolves a canonical id, an abbreviation, an alias, or the name this translation uses.
Returns `undefined` instead of throwing.

```ts
ruf.findBook('Ézsaiás')?.id; // 'ISA'
ruf.findBook('1. Móz')?.id; // 'GEN'
ruf.findBook('Nincsilyen'); // undefined
```

### `parseReference(ref)`

Synchronous and pure.
Splits a reference into one entry per verse range without looking at verse data, so it cannot tell whether the chapter or verse exists.

```ts
ruf.parseReference('Zsolt 139:23-24; Jn 3:16');
// [{ book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 },
//  { book: 'JHN', chapter: 3, startVerse: 16, endVerse: 16 }]

ruf.parseReference('Zsolt 100');
// [{ book: 'PSA', chapter: 100 }]
```

A whole chapter leaves `startVerse` and `endVerse` unset.
Throws `INVALID_REFERENCE` or `UNKNOWN_BOOK`.

### `getPassage(ref)`

Resolves a reference against the translation.
Each book named in the reference is loaded once, however many segments mention it.

```ts
const passage = await ruf.getPassage('Zsolt 139:23-24; Jn 3:16');

passage.reference; // 'Zsolt 139:23-24; Jn 3:16'
passage.segments.length; // 2
passage.verses.length; // 3
passage.verses[2];
// { book: 'JHN', chapter: 3, verse: 16, text: 'Mert úgy szerette Isten a világot, ...' }
```

Every segment carries its resolved bounds, the book with its translation name, a normalized `reference` string, and its verses.
`passage.verses` is the same verses flattened in reference order.

A whole chapter resolves its bounds from the data, so the segment reports what you actually got:

```ts
const psalm = await ruf.getPassage('Zsolt 100');
psalm.segments[0].reference; // 'Zsolt 100:1-5'
```

Verse bounds are checked rather than clamped: `Zsolt 100:1-99` is an error, not a quiet `Zsolt 100:1-5`.
Throws `INVALID_REFERENCE`, `UNKNOWN_BOOK`, `CHAPTER_NOT_FOUND`, or `VERSE_NOT_FOUND`.

### `getChapter(book, chapter)`

Loads one whole chapter, with its heading when the translation has one.

```ts
const chapter = await ruf.getChapter('Zsolt', 100);

chapter.title; // 'Adjunk hálát alkotónknak!'
chapter.book.name; // 'A Zsoltárok könyve'
chapter.verses[0];
// { book: 'PSA', chapter: 100, verse: 1, text: 'Hálaadó zsoltár. Ujjongjatok az Úr előtt az egész földön!' }
```

The book argument accepts anything `findBook` accepts.
Throws `UNKNOWN_BOOK` or `CHAPTER_NOT_FOUND`.

### `getBookDetails(book)`

Summarizes the structure of one book.

```ts
const ruth = await ruf.getBookDetails('Ruth');

ruth.chapters; // 4
ruth.verses; // 85
ruth.versesPerChapter; // { 1: 22, 2: 23, 3: 18, 4: 22 }
ruth.chapterTitles?.[1]; // 'Naomi sorsa Móáb országában'
```

`versesPerChapter` is a plain object keyed by chapter number.
`chapterTitles` is present only when the translation carries headings, which RÚF does.
Throws `UNKNOWN_BOOK`.

### `search(query, options?)`

Searches verse text.
The query is a literal substring by default, so punctuation is safe: `search('(')` looks for a parenthesis and cannot throw.

```ts
const results = await ruf.search('szeretet', { book: 'Jn', limit: 2 });

results[0].reference; // 'Jn 2:17'
results[0].book; // 'JHN'
results[0].bookInfo.name; // 'János evangéliuma'
results[0].text; // the matching verse
```

| Option          | Default | What it does                                           |
| --------------- | ------- | ------------------------------------------------------ |
| `regex`         | `false` | Compile the query as a regular expression              |
| `caseSensitive` | `false` | Match case exactly                                     |
| `limit`         | `100`   | Stop after this many results                           |
| `testament`     | none    | Restrict to `'old'` or `'new'`                         |
| `book`          | none    | Restrict to one book, named the way `findBook` accepts |

```ts
await ruf.search('^Kezdetben', { regex: true, limit: 5 });
```

Books are read in canonical order and only until the limit is reached, so a narrow search never loads the whole canon.
Throws `UNKNOWN_BOOK` when the `book` filter names no book, and a plain `SyntaxError` when `regex` is true and the query is not a valid regular expression.

### `getDailyVerse(date?)`

Picks one verse from a curated list of 51, the same one for every caller on a given date.
The choice comes from a hash of the local calendar date, so it turns over at local midnight and needs no state.

```ts
const verse = await ruf.getDailyVerse(new Date(2024, 0, 1));

verse.reference; // '1Móz 1:1'
verse.text; // 'Kezdetben teremtette Isten az eget és a földet.'
verse.bookInfo.name; // 'Mózes első könyve'
```

Called without an argument it uses today.

## Errors

Everything the library throws on its own is a `BibliaError` with a stable `code`, so you can branch on the reason instead of matching on the message.
Messages are in Hungarian and name what was wrong and what was available.

```ts
import { biblia, BibliaError } from 'biblia-hu';

try {
  await biblia('RUF').getPassage('Jn 3:999');
} catch (error) {
  if (error instanceof BibliaError && error.code === 'VERSE_NOT_FOUND') {
    console.error(error.message);
  }
}
```

| Code                  | When                                              |
| --------------------- | ------------------------------------------------- |
| `UNKNOWN_TRANSLATION` | `biblia()` got an id whose data is not bundled    |
| `UNKNOWN_BOOK`        | A book name matched nothing                       |
| `INVALID_REFERENCE`   | A reference string could not be parsed            |
| `CHAPTER_NOT_FOUND`   | The book has no such chapter in this translation  |
| `VERSE_NOT_FOUND`     | The chapter has no such verse in this translation |
| `DATA_UNAVAILABLE`    | A book file could not be read or fetched          |

## Also exported

`TRANSLATIONS` and `TRANSLATION_IDS` for translation metadata, `BOOKS` and `findBook` for the canonical book table, `parseReference` and `formatReference` for reference strings, `normalizeKey` for the lookup normalization, and every type in the public surface.

```ts
import { BOOKS, formatReference, normalizeKey, TRANSLATION_IDS } from 'biblia-hu';

TRANSLATION_IDS; // ['RUF']
BOOKS.length; // 66
formatReference({ book: 'PSA', chapter: 139, startVerse: 23, endVerse: 24 }); // 'Zsolt 139:23-24'
normalizeKey('1. Mózes'); // '1mozes'
```

## License

MIT, see [LICENSE](LICENSE).
The Bible texts remain the copyright of their publishers (Kálvin Kiadó for RÚF, Veritas Kiadó for the Revideált Károli).
