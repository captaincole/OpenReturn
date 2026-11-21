/*
 * Every folder here that has an index.ts is a scenario, and so is every such
 * folder in synthetic/. No list names them: a new folder is in the golden and
 * integration suites by itself. Loading is async because tsx and vitest share
 * no synchronous way to import a module by path.
 *
 * synthetic/ holds the taxpayers we made up with no outside source: no filed
 * return, no benchmark case, no IRS test package. Each one is marked
 * verification "unverified" (tests/unit/scenarioFolders.test.ts).
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Scenario } from "../types.js";

export type { Scenario };

export const SYNTHETIC_FOLDER = "synthetic";

function scenarioFoldersIn(parent: string): string[] {
  if (!existsSync(parent)) return [];
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(parent, entry.name, "index.ts")))
    .map((entry) => entry.name);
}

export const syntheticScenarioNames = (): string[] =>
  scenarioFoldersIn(join(__dirname, SYNTHETIC_FOLDER)).sort();

export function scenarioNames(): string[] {
  return [...scenarioFoldersIn(__dirname), ...syntheticScenarioNames()].sort();
}

/* The scenario's folder under tests/scenarios: "<name>" or "synthetic/<name>". */
export const scenarioFolder = (name: string): string =>
  syntheticScenarioNames().includes(name) ? `${SYNTHETIC_FOLDER}/${name}` : name;

/* The scenario is the export whose name matches the folder, whatever the export is called. */
export async function loadScenario(name: string): Promise<Scenario> {
  const names = scenarioNames();
  if (!names.includes(name)) {
    throw new Error(`loadScenario("${name}"): no such scenario. Scenarios: ${names.join(", ")}`);
  }
  const mod: Record<string, unknown> = syntheticScenarioNames().includes(name)
    ? await import(`./synthetic/${name}/index.ts`)
    : await import(`./${name}/index.ts`);
  const found = Object.values(mod).find(
    (value): value is Scenario => (value as Scenario | undefined)?.name === name,
  );
  if (!found) throw new Error(`loadScenario("${name}"): no export has name "${name}"`);
  return found;
}

export function loadScenarios(): Promise<Scenario[]> {
  return Promise.all(scenarioNames().map(loadScenario));
}
