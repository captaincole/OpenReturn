import { countBlocksByDoc, listDocuments, tableCounts } from "../../src/db/corpusStore";
import type { Library } from "../../src/db/libsql";
import type { Command } from "../lib/cli";

export async function checkLibrary(library: Library): Promise<void> {
  const counts = await tableCounts(library);
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table}: count=${count}`);
  }
  for (const doc of await listDocuments(library)) {
    const { blocks, embedded } = await countBlocksByDoc(doc.docId, library);
    console.log(`  ${doc.docId}: blocks=${blocks}, embedded=${embedded}`);
  }
}

export const checkCommand: Command = {
  name: "check",
  summary: "Table row counts + per-doc embedding coverage",
  run: () => checkLibrary("corpus"),
};
