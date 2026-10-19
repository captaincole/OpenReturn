/*
 * Top-level test entry point. Runs every registered scenario and every
 * catalog-fill check, then prints one summary table. Designed for
 * pre-commit hooks: fast, deterministic, offline. Exits non-zero on any
 * failure.
 *
 * Positional args filter by check name (case-insensitive substring):
 *   npm test -- alex               → just the alex scenario
 *   npm test -- catalog-fill       → all catalog-fill checks
 *   npm test -- form-540 marcus    → any check matching either
 *
 * To add a scenario: add it to SCENARIOS in tests/scenarios/index.ts.
 *
 * To add a form's catalog-fill check: register the form in the engine
 * registry (src/engine/registry.ts, via its jurisdiction index). CATALOGS
 * in tests/catalogFill.ts mirrors that registry. The first run fails with
 * "no golden — run --update"; bootstrap the snapshot and commit it.
 */

import { CATALOGS, runCatalogFillCheck } from "./catalogFill.js";
import { runScenario } from "./runScenario.js";
import { SCENARIOS } from "./scenarios/index.js";
import type { RunResult } from "./types.js";

const UNVERIFIED = new Set(
  SCENARIOS.filter((s) => s.verification === "unverified").map((s) => s.name),
);

async function main() {
  const filters = process.argv
    .slice(2)
    .filter((a) => !a.startsWith("-"))
    .map((f) => f.toLowerCase());
  const matches = (name: string) =>
    filters.length === 0 || filters.some((f) => name.toLowerCase().includes(f));

  const catalogs = CATALOGS.filter((c) => matches(`catalog-fill:${c.formId}`));
  /* A skipped scenario runs only when a filter names it. */
  const scenarios = SCENARIOS.filter((s) =>
    s.skip ? filters.some((f) => s.name.toLowerCase().includes(f)) : matches(s.name),
  );

  if (catalogs.length + scenarios.length === 0) {
    console.error(`No checks match filter(s): ${filters.join(", ")}`);
    console.error(
      `Available: ${[
        ...SCENARIOS.map((s) => s.name),
        ...CATALOGS.map((c) => `catalog-fill:${c.formId}`),
      ].join(", ")}`,
    );
    process.exit(1);
  }

  const totalChecks = scenarios.length + catalogs.length;
  const colWidth = Math.max(
    16,
    ...scenarios.map((s) => s.name.length),
    ...catalogs.map((c) => `catalog-fill:${c.formId}`.length),
  );

  console.log(
    `Running ${scenarios.length} scenario(s) + ${catalogs.length} catalog-fill check(s)\n`,
  );
  const t0 = Date.now();
  const results: RunResult[] = [];

  const record = (r: RunResult) => {
    results.push(r);
    if (r.passed) {
      const nm =
        (r.knownMismatches?.length ? ` — ${r.knownMismatches.length} known mismatch(es)` : "") +
        (r.notModeled?.length ? ` — ${r.notModeled.length} line(s) not modeled` : "");
      const tag = UNVERIFIED.has(r.name) ? " — unverified (locked engine output)" : "";
      console.log(`✓ ${r.name.padEnd(colWidth)} ${r.durationMs}ms${tag}${nm}`);
      /* The full list only when the scenario was asked for by name. */
      if (filters.length > 0) {
        for (const line of r.knownMismatches ?? []) console.log(`    known: ${line}`);
        for (const line of r.notModeled ?? []) console.log(`    not modeled: ${line}`);
      }
    } else {
      console.error(
        `✗ ${r.name.padEnd(colWidth)} ${r.durationMs}ms — ${r.failures.length} failure(s):`,
      );
      for (const f of r.failures) console.error(`    ${f}`);
      if (filters.length > 0 && r.notModeled?.length) {
        console.error(`    — ${r.notModeled.length} line(s) not modeled:`);
        for (const line of r.notModeled) console.error(`    ${line}`);
      }
    }
  };

  /*
   * Catalog-fill checks run FIRST, before any scenario installs per-field
   * formatter overrides into the engine's global registry. The overrides
   * (e.g. SSN.format on 540 page 2) expect bare-digit input from the
   * production filingInfo path, not the harness's human-readable
   * synthetic. Run on the synthetic, they produce text that does not
   * match the formatter-free golden. Catalog-fill therefore stays a pure
   * catalog→widget check with no bindings registered, and the two test
   * surfaces stay distinct.
   */
  for (const c of catalogs) record(await runCatalogFillCheck(c.formId));
  for (const s of scenarios) record(await runScenario(s));

  const totalMs = Date.now() - t0;
  const passed = results.filter((r) => r.passed).length;
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
