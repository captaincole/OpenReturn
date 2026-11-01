import { countBlocksByDoc, listDocuments, tableCounts } from "../../src/db/corpusStore";
import type { Command } from "../lib/cli";

async function run(): Promise<void> {
  const counts = await tableCounts();
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table}: count=${count}`);
  }
  for (const doc of await listDocuments()) {
    const { blocks, embedded } = await countBlocksByDoc(doc.docId);
    console.log(`  ${doc.docId}: blocks=${blocks}, embedded=${embedded}`);
  }
}

export const checkCommand: Command = {
  name: "check",
  summary: "Table row counts + per-doc embedding coverage",
  run,
};
