import { DEFAULT_TRANSLATION, TRANSLATION_ENV_VAR } from './args';

/** Width of the flag column, so the descriptions line up. */
const FLAG_COLUMN = 35;

/** Built rather than written out, because the variable name sets its width. */
const ENV_LINE =
  `  ${TRANSLATION_ENV_VAR}=<id>`.padEnd(FLAG_COLUMN) +
  `Used when no flag is given, default ${DEFAULT_TRANSLATION}`;

const USAGE = `biblia-hu, Hungarian Bible translations on the command line.

Usage:
  biblia --p="<reference>"         Print a passage, for example "Jn 3:16"
  biblia --passage="<reference>"   Same as --p
  biblia --showBooks               List every book of the canon
  biblia --showBooks --old         List the Old Testament books only
  biblia --showBooks --new         List the New Testament books only
  biblia --bookDetails <book>      Print the structure of one book
  biblia --search="<query>"        Search the verse text
  biblia --search="<query>" --new  Search the New Testament only
  biblia --today                   Print the verse of the day
  biblia --translations            List the translations you can select
  biblia -i                        Start the interactive mode
  biblia --help                    Print this help, also -h

Translation:
  -t <id>                          Select a translation, for example -t RUF
  --translation=<id>               Same as -t
${ENV_LINE}

References accept Hungarian book names and abbreviations, a chapter, and an
optional verse or verse range: "Zsolt 100", "Jn 3:16", "Zsolt 139:23-24".
Separate several references with a semicolon.

Details: https://github.com/kulcsarrudolf/biblia-hu`;

const REPL_USAGE = `Interactive commands:
  <reference>          Print a passage, for example "Jn 3:16"
  search <query>       Search the verse text
  today                Print the verse of the day
  books                List every book of the canon
  translation <id>     Switch to another translation
  help                 Print this help
  exit                 Leave the interactive mode`;

/** Prints the full command line usage, one line per flag. */
export const printHelp = (): void => {
  console.log(USAGE);
};

/** Prints the commands the REPL understands. */
export const printReplHelp = (): void => {
  console.log(REPL_USAGE);
};
