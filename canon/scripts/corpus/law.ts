import { LawNotInstalledError } from "../../src/law/lawRead";
import type { Command } from "../lib/cli";
import { lawFetchCommand, lawReembedCommand, lawSyncCommand } from "./lawBuild";
import { lawExtractCaCommand } from "./lawExtract";
import { lawCheckCommand, lawReadCommand, lawSearchCommand } from "./lawInspect";
import { lawSplitCommand } from "./lawSplit";

/*
 * `corpus law <subcommand>`: the same jobs as the corpus commands, on the
 * law files, one per jurisdiction (law/federal.db: the Internal Revenue Code
 * and the Treasury regulations; law/ca.db: California's tax law). The plain
 * commands never touch them.
 */

const SUBCOMMANDS: Command[] = [
  lawSyncCommand,
  lawFetchCommand,
  lawCheckCommand,
  lawSearchCommand,
  lawReadCommand,
  lawReembedCommand,
  lawExtractCaCommand,
  lawSplitCommand,
];

async function run(argv: string[]): Promise<void> {
  const [name, ...rest] = argv;
  const sub = SUBCOMMANDS.find((command) => command.name === name);
  if (!sub) {
    console.error(`${name ? `unknown law command: ${name}` : "required: a law command"}\n`);
    console.error(helpText());
    process.exit(1);
  }
  try {
    await sub.run(rest);
  } catch (err) {
    if (!(err instanceof LawNotInstalledError)) throw err;
    console.error(err.message);
    process.exit(1);
  }
}

function helpText(): string {
  const width = Math.max(...SUBCOMMANDS.map((command) => usageOf(command).length));
  const lines = SUBCOMMANDS.map(
    (command) => `  ${usageOf(command).padEnd(width)}  ${command.summary}`,
  );
  return ["law commands:", ...lines].join("\n");
}

const usageOf = (command: Command) =>
  [command.name, command.usage, ...(command.options ?? []).map((option) => `[${option.flag}]`)]
    .filter(Boolean)
    .join(" ");

export const lawCommand: Command = {
  name: "law",
  summary:
    "The law library (one file per jurisdiction: the Internal Revenue Code and the regulations, California's code): sync, fetch, check, search, read, reembed, extract-ca, split",
  usage: "<command>",
  options: SUBCOMMANDS.map((command) => ({ flag: usageOf(command), desc: command.summary })),
  run,
};
