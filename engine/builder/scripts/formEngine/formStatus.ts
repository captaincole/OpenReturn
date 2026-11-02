import { formatStatus, formStatus } from "../../src/formStatus.js";
import { formTargetFromArgv } from "../../src/formTarget.js";
import type { Command } from "../lib/cli";

async function run(argv: string[]): Promise<void> {
  const status = formStatus(formTargetFromArgv(argv));
  console.log(argv.includes("--json") ? JSON.stringify(status, null, 2) : formatStatus(status));
}

export const formStatusCommand: Command = {
  name: "form-status",
  summary: "Which steps of a form are done: catalog, wiring, and each line's binding",
  usage: "<federal/<short> | state/<st>/<short>>",
  options: [
    { flag: "--json", desc: "print the status as JSON (for agents and scripts)" },
    { flag: "--tax-year=<year>", desc: "default 2025" },
  ],
  run,
};
