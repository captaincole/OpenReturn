import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkSupport,
  maskKey,
  SIMPLE_FACT_KEYS,
} from "../../../../scripts/compareFiled/support.js";
import { jordanScenario } from "../../../scenarios/jordan/index.js";
import type { Scenario } from "../../../types.js";

const RESOLVERS = ["src/engine/filingInfoResolvers.ts", "src/engine/resolverInputs.ts"];

const MODELED = new Set(
  jordanScenario.forms.map((f) => f.formId).filter((id) => id !== "schedule-d-ca"),
);

describe("checkSupport", () => {
  it("passes jordan", () => {
    expect(checkSupport(jordanScenario, MODELED)).toEqual([]);
  });

  it("flags unknown facts with a masked key, and out-of-scope answers", () => {
    const s: Scenario = {
      ...jordanScenario,
      facts: [
        ...jordanScenario.facts,
        { ...jordanScenario.facts[0], key: "account.some-partnership.k1" },
      ],
      decisions: jordanScenario.decisions.map((d) =>
        d.decisionKey === "decisions.scope.ca_residency" ? { ...d, decision: "part_year" } : d,
      ),
    };
    const issues = checkSupport(s, MODELED).map((i) => `${i.kind} ${i.subject}`);
    expect(issues).toEqual([
      "unknown_fact account.<name>.k1",
      "out_of_scope decisions.scope.ca_residency",
    ]);
  });

  it("masks names in keys", () => {
    expect(maskKey("account.big-broker.trades.bb-d-01")).toBe("account.<name>.trades.<id>");
    expect(maskKey("decisions.trade.bb-d-01.form_8949_box")).toBe(
      "decisions.trade.<id>.form_8949_box",
    );
  });
});

describe("SIMPLE_FACT_KEYS", () => {
  it("lists every single-value fact key the resolvers read", () => {
    const read = RESOLVERS.flatMap((p) =>
      [...readFileSync(p, "utf8").matchAll(/\b(?:num|text)\(inputs, "([a-z0-9_.]+)"/g)].map(
        (m) => m[1],
      ),
    ).filter((k) => !k.startsWith("identity."));
    expect(read.length).toBeGreaterThan(5);
    expect(read.filter((k) => !SIMPLE_FACT_KEYS.has(k))).toEqual([]);
  });
});
