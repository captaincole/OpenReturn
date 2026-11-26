import { LAW_NOT_INSTALLED, LawNotInstalledError } from "../../src/law/lawRead";
import type { Command } from "../lib/cli";
import { lawFetchCommand, lawReembedCommand, lawSyncCommand } from "./lawBuild";
import { lawCheckCommand, lawReadCommand, lawSearchCommand } from "./lawInspect";

/*
 * `corpus law <subcommand>`: the same jobs as the corpus commands, on
 * law.db (the Internal Revenue Code). The plain commands never touch it.
 */

const SUBCOMMANDS: Command[] = [
  lawSyncCommand,
  lawFetchCommand,
  lawCheckCommand,
  lawSearchCommand,
  lawReadCommand,
  lawReembedCommand,
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
    console.error(LAW_NOT_INSTALLED);
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
    "The law library (law.db, the Internal Revenue Code): sync, fetch, check, search, read, reembed",
  usage: "<command>",
  options: SUBCOMMANDS.map((command) => ({ flag: usageOf(command), desc: command.summary })),
  run,
};
