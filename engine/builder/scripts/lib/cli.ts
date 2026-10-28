export interface CliOption {
  flag: string;
  desc: string;
}

export interface Command {
  name: string;
  summary: string;
  usage?: string;
  options?: CliOption[];
  run(argv: string[]): Promise<void>;
}

interface Cli {
  name: string;
  bin: string;
  description: string;
  commands: Command[];
}

function printCliHelp(cli: Cli): void {
  console.log(`${cli.description}\n`);
  console.log(`usage: ${cli.bin} <command> [options]\n`);
  console.log("commands:");
  const width = Math.max(...cli.commands.map((c) => c.name.length));
  for (const c of cli.commands) {
    console.log(`  ${c.name.padEnd(width)}  ${c.summary}`);
  }
  console.log(`\nRun \`${cli.bin} <command> --help\` for that command's options.`);
}

function printCommandHelp(cli: Cli, cmd: Command): void {
  console.log(`${cmd.summary}\n`);
  console.log(
    `usage: ${cli.bin} ${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ""}${cmd.options?.length ? " [options]" : ""}`,
  );
  if (cmd.options?.length) {
    console.log("\noptions:");
    const width = Math.max(...cmd.options.map((o) => o.flag.length));
    for (const o of cmd.options) {
      console.log(`  ${o.flag.padEnd(width)}  ${o.desc}`);
    }
  }
}

export async function runCli(cli: Cli): Promise<void> {
  const [name, ...rest] = process.argv.slice(2);

  if (!name || name === "help" || name === "--help" || name === "-h") {
    printCliHelp(cli);
    return;
  }

  const cmd = cli.commands.find((c) => c.name === name);
  if (!cmd) {
    console.error(`unknown command: ${name}\n`);
    printCliHelp(cli);
    process.exit(1);
  }

  if (rest.includes("--help") || rest.includes("-h")) {
    printCommandHelp(cli, cmd);
    return;
  }

  try {
    await cmd.run(rest);
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
          ? JSON.stringify(err)
          : String(err);
    console.error(`[${cli.name} ${cmd.name}] failed: ${msg}`);
    process.exit(1);
  }
}
