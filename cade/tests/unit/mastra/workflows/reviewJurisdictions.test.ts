import { evaluateScenario } from "@openreturn/engine";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { jurisdictionOfEngineForm } from "../../../../src/mastra/canon/jurisdictions";
import {
  DECISION_JURISDICTIONS,
  decisionJurisdictions,
  mustFileJurisdictions,
} from "../../../../src/mastra/workflows/reviewDecision/jurisdictions";

/*
 * Every decision key written in Cade's and the engine's source gets its
 * jurisdictions from a rule, never from the default: a new key forces a choice.
 */

const YEAR = 2025;
const ROOTS = ["../../../../src", "../../../../../engine/src"].map((dir) =>
  resolve(__dirname, dir),
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

/* A whole key in quotes or backticks: "decisions.scope.filing_status". A template such as `decisions.trade.${id}` is not whole. */
const QUOTED_DECISION_KEY = /["'`](decisions\.[a-z0-9_.]*[a-z0-9_])["'`]/g;

function decisionKeysIn(text: string): string[] {
  return [...text.matchAll(QUOTED_DECISION_KEY)].map((match) => match[1]);
}

const sourceKeys = [
  ...new Set(
    ROOTS.flatMap(sourceFiles).flatMap((file) => decisionKeysIn(readFileSync(file, "utf8"))),
  ),
].sort();

describe("decision jurisdictions", () => {
  it("finds the decision keys in the source", () => {
    expect(sourceKeys).toContain("decisions.scope.filing_status");
    expect(sourceKeys.length).toBeGreaterThan(30);
  });

  it("gives every key in the source a rule, not the default", () => {
    const defaulted = sourceKeys.filter(
      (key) => decisionJurisdictions(key, YEAR).rule === "default",
    );
    expect(defaulted).toEqual([]);
  });

  it("lists no table row that the source never writes", () => {
    const unused = Object.keys(DECISION_JURISDICTIONS).filter((key) => !sourceKeys.includes(key));
    expect(unused).toEqual([]);
  });

  it("knows the jurisdiction of every engine form", () => {
    const scenario = evaluateScenario({
      filing: { id: "f", taxYear: YEAR },
      facts: [],
      decisions: [],
    });
    const unknown = [...scenario.forms.values()]
      .filter((form) => jurisdictionOfEngineForm(form.jurisdiction) === undefined)
      .map((form) => `${form.formId} (${form.jurisdiction})`);
    expect(unknown).toEqual([]);
    expect(mustFileJurisdictions(YEAR).size).toBe(scenario.forms.size);
  });

  it.each([
    ["decisions.scope.must_file_ca_540", ["CA"], "form"],
    ["decisions.scope.must_file_540nr", ["CA"], "form"],
    ["decisions.scope.must_file_federal", ["federal"], "form"],
    ["decisions.scope.must_file_8949", ["federal"], "form"],
    ["decisions.scope.must_file_schedule_a", ["federal", "CA"], "table"],
    ["decisions.scope.ca_residency", ["CA"], "table"],
    ["decisions.scope.filing_status", ["federal", "CA"], "table"],
    ["decisions.itemize_vs_standard", ["federal", "CA"], "table"],
    ["decisions.trade.t-1.form_8949_box", ["federal"], "prefix"],
    ["decisions.deductions.named.home_office", ["federal", "CA"], "prefix"],
    ["decisions.something_new", ["federal", "CA"], "default"],
  ])("%s → %j (%s)", (key, jurisdictions, rule) => {
    expect(decisionJurisdictions(key, YEAR)).toEqual({ jurisdictions, rule });
  });
});
