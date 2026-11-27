/*
 * The rows of California's law tables as the Legislative Counsel publishes
 * them (pubinfo, one .dat file per table): one row per line, tab between
 * fields, text in backticks, NULL for no value. The column order is the
 * one the official load scripts name. Pure: no files here.
 */

export const CODES_TABLE = "CODES_TBL.dat";
export const TOC_TABLE = "LAW_TOC_TBL.dat";
export const TOC_SECTIONS_TABLE = "LAW_TOC_SECTIONS_TBL.dat";
export const SECTION_TABLE = "LAW_SECTION_TBL.dat";

export const TOC_COLUMNS = [
  "law_code",
  "division",
  "title",
  "part",
  "chapter",
  "article",
  "heading",
  "active_flg",
  "trans_uid",
  "trans_update",
  "node_sequence",
  "node_level",
  "node_position",
  "node_treepath",
  "contains_law_sections",
  "history_note",
  "op_statues",
  "op_chapter",
  "op_section",
] as const;

export const TOC_SECTION_COLUMNS = [
  "id",
  "law_code",
  "node_treepath",
  "section_num",
  "section_order",
  "title",
  "op_statues",
  "op_chapter",
  "op_section",
  "trans_uid",
  "trans_update",
  "law_section_version_id",
  "seq_num",
] as const;

export const SECTION_COLUMNS = [
  "id",
  "law_code",
  "section_num",
  "op_statues",
  "op_chapter",
  "op_section",
  "effective_date",
  "law_section_version_id",
  "division",
  "title",
  "part",
  "chapter",
  "article",
  "history",
  "content_xml",
  "active_flg",
  "trans_uid",
  "trans_update",
] as const;

export type Row<Columns extends readonly string[]> = Record<Columns[number], string | null>;
export type TocRow = Row<typeof TOC_COLUMNS>;
export type TocSectionRow = Row<typeof TOC_SECTION_COLUMNS>;
export type SectionRow = Row<typeof SECTION_COLUMNS>;

const FIELD_JOINT = "\t";
const QUOTE = "`";
const NULL_FIELD = "NULL";

const fieldValue = (raw: string): string | null => {
  if (raw === NULL_FIELD) return null;
  const quoted = raw.length >= 2 && raw.startsWith(QUOTE) && raw.endsWith(QUOTE);
  return unescaped(quoted ? raw.slice(1, -1) : raw);
};

const ESCAPE = "\\";
const ESCAPED: Record<string, string> = { n: "\n", t: "\t", r: "\r", "0": "" };

/** The tables escape as MySQL does: "\n" is a line break inside a field, "\\" a backslash. */
function unescaped(value: string): string {
  if (!value.includes(ESCAPE)) return value;
  let out = "";
  for (let at = 0; at < value.length; at++) {
    const char = value[at];
    if (char !== ESCAPE || at === value.length - 1) out += char;
    else {
      const next = value[++at];
      out += ESCAPED[next] ?? next;
    }
  }
  return out;
}

/** One line as a row; throws when the line has the wrong number of fields. */
export function parseRow<Columns extends readonly string[]>(
  line: string,
  columns: Columns,
): Row<Columns> {
  const fields = line.split(FIELD_JOINT);
  if (fields.length !== columns.length)
    throw new Error(
      `pubinfo: a row has ${fields.length} fields, ${columns.length} expected: ${line.slice(0, 80)}`,
    );
  return Object.fromEntries(
    columns.map((column, index) => [column, fieldValue(fields[index])]),
  ) as Row<Columns>;
}

/** The lines of a table file, without the empty last line. */
export const tableLines = (text: string): string[] =>
  text.split("\n").filter((line) => line.trim() !== "");

export const parseTable = <Columns extends readonly string[]>(
  text: string,
  columns: Columns,
): Row<Columns>[] => tableLines(text).map((line) => parseRow(line, columns));

/** The line with one field replaced, the others kept as printed. */
export function withField(
  line: string,
  columns: readonly string[],
  column: string,
  value: string,
): string {
  const fields = line.split(FIELD_JOINT);
  fields[columns.indexOf(column)] = value;
  return fields.join(FIELD_JOINT);
}

/** A tree path's parent: "3.20.5.1" → "3.20.5"; the top level has none. */
export const parentPath = (treepath: string): string | null => {
  const cut = treepath.lastIndexOf(".");
  return cut < 0 ? null : treepath.slice(0, cut);
};

/** True when `treepath` is `root` or sits under it: "3.20.5" is under "3.20", "3.200" is not. */
export const isUnder = (treepath: string, root: string): boolean =>
  treepath === root || treepath.startsWith(`${root}.`);
