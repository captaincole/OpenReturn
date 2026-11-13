/*
 * Print one downloaded test case as tables: its input files, its answers
 * (input/remaining_data.json) and its answer key (output.xml, an IRS or state
 * e-file return) with one table per form. A new scenario starts from these
 * tables, not from the raw XML.
 *
 *   npx tsx scripts/dumpCase.ts <case folder>      (from engine/builder)
 */

import { load, type CheerioAPI } from "cheerio";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/* A selection of XML elements; cheerio does not export the element type by name. */
type XmlElements = ReturnType<ReturnType<CheerioAPI["root"]>["children"]>;
type Row = string[];

const cell = (text: string) => text.replaceAll("|", "\\|").replaceAll("\n", " ");

function table(head: string[], rows: Row[]): string {
  if (!rows.length) return "None.";
  const line = (row: Row) => `| ${row.map(cell).join(" | ")} |`;
  return [line(head), line(head.map(() => "---")), ...rows.map(line)].join("\n");
}

/* A value the taxpayer did not give: 0, false, an empty text or list, or nothing. */
function isEmptyAnswer(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return value === 0 || value === false || value === "" || value === null || value === undefined;
}

interface Answer {
  key: string;
  question: string;
  value: unknown;
}

/* An answer is an object with a `value`; its `label` is the question. Anything else is a group. */
function answersIn(node: unknown, key: string): Answer[] {
  if (Array.isArray(node)) return node.flatMap((item, at) => answersIn(item, `${key}[${at}]`));
  if (typeof node !== "object" || node === null) return [{ key, question: "", value: node }];
  const group = node as Record<string, unknown>;
  if ("value" in group) return [{ key, question: String(group.label ?? ""), value: group.value }];
  return Object.entries(group).flatMap(([name, child]) =>
    answersIn(child, key ? `${key}.${name}` : name),
  );
}

function answerTables(file: string): string {
  if (!existsSync(file)) return "No remaining_data.json.";
  const answers = answersIn(JSON.parse(readFileSync(file, "utf8")), "");
  const rows = (list: Answer[]) =>
    list.map((answer) => [answer.key, answer.question, JSON.stringify(answer.value)]);
  const head = ["Key", "Question", "Value"];
  return [
    "### Answers with a value",
    table(head, rows(answers.filter((answer) => !isEmptyAnswer(answer.value)))),
    "### Answers that are 0, false or empty",
    table(head, rows(answers.filter((answer) => isEmptyAnswer(answer.value)))),
  ].join("\n\n");
}

/* One row per element that holds a value. A repeated element gets its position: Dependent[2]. */
function valueRows(xml: CheerioAPI, node: XmlElements, name: string): Row[] {
  const children = node.children().toArray();
  if (!children.length) return [[name, node.text().trim()]];
  const tags = children.map((child) => child.tagName);
  return children.flatMap((child, at) => {
    const tag = tags[at];
    const repeats = tags.filter((other) => other === tag).length > 1;
    const position = tags.slice(0, at).filter((other) => other === tag).length + 1;
    const childName = repeats ? `${tag}[${position}]` : tag;
    return valueRows(xml, xml(child), name ? `${name}/${childName}` : childName);
  });
}

/* The part named …ReturnData… holds the forms; each other part (the header) is one table. */
function keyTables(file: string): string {
  if (!existsSync(file)) return "No output.xml.";
  const xml = load(readFileSync(file, "utf8"), { xml: true });
  const head = ["Element", "Value"];
  const parts = xml.root().children().first().children().toArray();
  return parts
    .flatMap((part) => {
      const forms = part.tagName.includes("ReturnData") ? xml(part).children().toArray() : [part];
      return forms.map((form) => {
        const id = xml(form).attr("documentId");
        const title = id && id !== form.tagName ? `${form.tagName} (${id})` : form.tagName;
        return `### ${title}\n\n${table(head, valueRows(xml, xml(form), ""))}`;
      });
    })
    .join("\n\n");
}

function inputFiles(dir: string): string {
  if (!existsSync(dir)) return "No input folder.";
  return readdirSync(dir)
    .sort()
    .map((file) => `- ${file}`)
    .join("\n");
}

function main() {
  const folder = process.argv[2];
  if (!folder || !existsSync(folder)) {
    throw new Error("usage: tsx scripts/dumpCase.ts <case folder>");
  }
  console.log(
    [
      `# ${path.basename(path.resolve(folder))}`,
      "## Input files",
      inputFiles(path.join(folder, "input")),
      "## Answers (input/remaining_data.json)",
      answerTables(path.join(folder, "input", "remaining_data.json")),
      "## Answer key (output.xml)",
      keyTables(path.join(folder, "output.xml")),
    ].join("\n\n"),
  );
}

main();
