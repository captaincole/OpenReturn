import { getDocument } from "../../src/db/corpusStore";
import { readOutline } from "../../src/db/refSections";
import type { Command } from "../lib/cli";
import { requireCorpus } from "./requireCorpus";

async function run(argv: string[]): Promise<void> {
  await requireCorpus();
  const docId = argv.find((arg) => !arg.startsWith("--"));
  if (!docId) throw new Error("required: a docId (see --help)");
  const doc = await getDocument(docId);
  if (!doc) {
    throw new Error(`${docId} is not in corpus.db: add or sync it with the corpus skill`);
  }
  const sections = await readOutline(docId);
  console.log(`${docId}: ${doc.title}`);
  console.log(
    `${sections.length} sections; read one with: npm run corpus -- read ${docId} <section>\n`,
  );
  const named = sections.map((row) => ({
    ...row,
    name: `${"  ".repeat(row.depth)}${row.section}`,
  }));
  const width = Math.max(...named.map(({ name }) => name.length));
  for (const { name, heading, firstPage, chars } of named) {
    console.log(`${name.padEnd(width)}  p.${firstPage}  ${chars} chars  ${heading}`);
  }
}

export const outlineCommand: Command = {
  name: "outline",
  summary: "List a document's sections (fails when the document is not in corpus.db)",
  usage: "<docId>",
  run,
};
