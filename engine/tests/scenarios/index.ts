/*
 * Every folder here that has an index.ts is a scenario. No list names them: a
 * new folder is in the golden and integration suites by itself. Loading is
 * async because tsx and vitest share no synchronous way to import a module by path.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Scenario } from "../types.js";

export type { Scenario };

export function scenarioNames(): string[] {
  return readdirSync(__dirname, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(__dirname, entry.name, "index.ts")))
    .map((entry) => entry.name)
    .sort();
}

/* The scenario is the export whose name matches the folder, whatever the export is called. */
export async function loadScenario(name: string): Promise<Scenario> {
  const names = scenarioNames();
  if (!names.includes(name)) {
    throw new Error(`loadScenario("${name}"): no such scenario. Scenarios: ${names.join(", ")}`);
  }
  const mod: Record<string, unknown> = await import(`./${name}/index.ts`);
  const found = Object.values(mod).find(
    (value): value is Scenario => (value as Scenario | undefined)?.name === name,
  );
  if (!found) throw new Error(`loadScenario("${name}"): no export has name "${name}"`);
  return found;
}

export function loadScenarios(): Promise<Scenario[]> {
  return Promise.all(scenarioNames().map(loadScenario));
}
