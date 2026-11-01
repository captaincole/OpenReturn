/* Positional args filter by check name (case-insensitive substring): npm test -- alex catalog-fill */

import { SCENARIOS } from "../scenarios/index.js";
import type { RunResult } from "../types.js";
import { CATALOGS, runCatalogFillCheck } from "./catalogFill.js";
import { runScenario } from "./runScenario.js";

const UNVERIFIED = new Set(
  SCENARIOS.filter((scenario) => scenario.verification === "unverified").map(
    (scenario) => scenario.name,
  ),
);

async function main() {
  const filters = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("-"))
    .map((arg) => arg.toLowerCase());
  const matches = (name: string) =>
    filters.length === 0 || filters.some((filter) => name.toLowerCase().includes(filter));

  const catalogs = CATALOGS.filter((catalog) => matches(`catalog-fill:${catalog.formId}`));
  /* A skipped scenario runs only when a filter names it. */
  const scenarios = SCENARIOS.filter((scenario) =>
    scenario.skip
      ? filters.some((filter) => scenario.name.toLowerCase().includes(filter))
      : matches(scenario.name),
  );

  if (catalogs.length + scenarios.length === 0) {
    console.error(`No checks match filter(s): ${filters.join(", ")}`);
    console.error(
      `Available: ${[
        ...SCENARIOS.map((scenario) => scenario.name),
        ...CATALOGS.map((catalog) => `catalog-fill:${catalog.formId}`),
      ].join(", ")}`,
    );
    process.exit(1);
  }

  const totalChecks = scenarios.length + catalogs.length;
  const colWidth = Math.max(
    16,
    ...scenarios.map((scenario) => scenario.name.length),
    ...catalogs.map((catalog) => `catalog-fill:${catalog.formId}`.length),
  );

  console.log(
    `Running ${scenarios.length} scenario(s) + ${catalogs.length} catalog-fill check(s)\n`,
  );
  const t0 = Date.now();
  const results: RunResult[] = [];

  const record = (result: RunResult) => {
    results.push(result);
    if (result.passed) {
      const nm =
        (result.knownMismatches?.length
          ? ` — ${result.knownMismatches.length} known mismatch(es)`
          : "") +
        (result.notModeled?.length ? ` — ${result.notModeled.length} line(s) not modeled` : "");
      const tag = UNVERIFIED.has(result.name) ? " — unverified (locked engine output)" : "";
      console.log(`✓ ${result.name.padEnd(colWidth)} ${result.durationMs}ms${tag}${nm}`);
      if (filters.length > 0) {
        for (const line of result.knownMismatches ?? []) console.log(`    known: ${line}`);
        for (const line of result.notModeled ?? []) console.log(`    not modeled: ${line}`);
      }
    } else {
      console.error(
        `✗ ${result.name.padEnd(colWidth)} ${result.durationMs}ms — ${result.failures.length} failure(s):`,
      );
      for (const failure of result.failures) console.error(`    ${failure}`);
      if (filters.length > 0 && result.notModeled?.length) {
        console.error(`    — ${result.notModeled.length} line(s) not modeled:`);
        for (const line of result.notModeled) console.error(`    ${line}`);
      }
    }
  };

  /*
   * Catalog-fill runs FIRST: scenarios register formatter overrides in a global
   * registry (e.g. SSN.format on 540 page 2), and those break the synthetic values.
   */
  for (const catalog of catalogs) record(await runCatalogFillCheck(catalog.formId));
  for (const scenario of scenarios) record(await runScenario(scenario));

  const totalMs = Date.now() - t0;
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  console.log("");
  console.log(
    `${passed}/${totalChecks} checks passed in ${totalMs}ms${failed > 0 ? ` — ${failed} FAILED` : ""}.`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[runAll] fatal:", err);
  process.exit(1);
});
