import { parseArgs } from "node:util";
import { readSections, sectionOfBlock } from "../../src/db/refSections";
import type { Command } from "../lib/cli";

/* <blockId> (from a Canon search hit) reads that block's section; <docId> <section> names it. */
async function target(positionals: string[]): Promise<{ docId: string; section: string }> {
  const [first, second] = positionals;
  if (first && !second) return sectionOfBlock(first);
  if (!first || !second) throw new Error("required: <blockId>, or <docId> <section> (see --help)");
  return { docId: first, section: second };
}

async function run(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { through: { type: "string" } },
    allowPositionals: true,
  });
  const { docId, section } = await target(positionals);
  const blocks = await readSections({ docId, section, through: values.through });
  if (blocks.length === 0) console.log(`(no blocks under ${section} in ${docId})`);
  let current = "";
  for (const block of blocks) {
    if (block.section !== current) {
      current = block.section;
      console.log(`\n## ${current}`);
    }
    console.log(`\n[${block.blockId}] p.${block.page}\n${block.text}`);
  }
}

export const readCommand: Command = {
  name: "read",
  summary: "Print a search hit's whole section, or named sections, with block ids",
  usage: "<blockId> | <docId> <section>",
  options: [
    { flag: "--through <section>", desc: "read every section up to and including this one" },
  ],
  run,
};
