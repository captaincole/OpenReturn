/* Source: irs-1040-inst-2025, lines 27a–27c (Steps 1–5); Step 4, question 1 is filers-without-a-qualifying::b01. */

import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  EIC_KEYS,
  SPOUSE_KEYS,
  makeDependentFactKey,
  type DependentFactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { MARRIED_HOH_GAP, type EicOutcome } from "../../src/federal/schedule-eic/credit.js";
import { eicOutcome } from "../../src/federal/schedule-eic/outcome.js";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { tcbUs002Scenario as base } from "../scenarios/tcb-us-002/index.js";

/*
 * The tcb-us-002 filer (born 1981, one W-2) with every EIC answer removed, so
 * each shape starts with nothing asked: a filing status, a dependent or none,
 * and low or high wages. Line 27a may wait only on an answer something asks.
 */
type Status =
  "single" | "head_of_household" | "married_filing_separately" | "married_filing_jointly";
type Dependent = "none" | "nephew" | "parent" | "student_unknown";
interface Shape {
  status: Status;
  dependent: Dependent;
  wages: number;
  dob?: string;
  extra?: Record<string, unknown>;
}

const DEPENDENT_KEY = makeDependentFactKey("kept");
const NEPHEW: DependentFactValue = {
  firstName: "Kiddo",
  lastName: "Ben",
  ssn: "900-45-6780",
  relationship: "Nephew",
  dob: "02/28/2021",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};
const PARENT: DependentFactValue = {
  ...NEPHEW,
  firstName: "Pat",
  relationship: "Parent",
  dob: "03/01/1955",
};
// Age 20: the EIC age test needs the student answer, which Schedule 8812 does not.
const STUDENT_UNKNOWN: DependentFactValue = {
  ...NEPHEW,
  dob: "03/01/2005",
  fullTimeStudent: undefined,
  permanentlyDisabled: undefined,
};
const DEPENDENTS: Record<Exclude<Dependent, "none">, DependentFactValue> = {
  nephew: NEPHEW,
  parent: PARENT,
  student_unknown: STUDENT_UNKNOWN,
};

/* The answer recorded when line 27a's inputs ask for a key. */
const ANSWERS: Record<string, unknown> = {
  [EIC_KEYS.nonresidentAlien]: false,
  [EIC_KEYS.mainHomeInUs]: true,
  [EIC_KEYS.qualifyingChildOfAnother]: false,
  [EIC_KEYS.claimableAsDependent]: false,
  [EIC_KEYS.deniedInEarlierYear]: false,
  [EIC_KEYS.barredByIrs]: false,
  [SPOUSE_KEYS.firstName]: "Sam",
  [SPOUSE_KEYS.lastName]: "Ben",
  [SPOUSE_KEYS.ssn]: "900-45-6781",
  [SPOUSE_KEYS.dob]: "01/01/1982",
  [SPOUSE_KEYS.itemizesSeparately]: false,
  [SPOUSE_KEYS.livedApartAllYear]: false,
  [SPOUSE_KEYS.livedApartLastSixMonths]: true,
  [DEPENDENT_KEY]: { ...STUDENT_UNKNOWN, fullTimeStudent: true, permanentlyDisabled: false },
};

const fact = (key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category: key.startsWith("identity.")
    ? "identity"
    : key.startsWith("filing_status.")
      ? "filing_status"
      : key === DEPENDENT_KEY
        ? "dependents"
        : "other",
  key,
  value,
});

function startingFacts(shape: Shape): Map<string, TaxFactRow> {
  const kept = base.facts.flatMap((row): TaxFactRow[] => {
    if (row.category === "identity") {
      return [row.key === "identity.dob" && shape.dob ? { ...row, value: shape.dob } : row];
    }
    if (row.category !== "wages") return [];
    const w2 = row.value as Record<string, unknown>;
    const wages = shape.wages;
    return [{ ...row, value: { ...w2, box1: wages, box3: wages, box5: wages, box16: wages } }];
  });
  const dependent =
    shape.dependent === "none" ? [] : [fact(DEPENDENT_KEY, DEPENDENTS[shape.dependent])];
  const extra = Object.entries(shape.extra ?? {}).map(([key, value]) => fact(key, value));
  return new Map([...kept, ...dependent, ...extra].map((row) => [row.key, row]));
}

const DECISIONS: Array<[string, unknown]> = [
  ["decisions.scope.must_file_federal", true],
  ["decisions.scope.has_digital_assets", false],
  ["decisions.itemize_vs_standard", "standard"],
  ["decisions.scope.must_file_ca_540", false],
  ["decisions.scope.ca_residency", "non_resident"],
  ["decisions.refund.refund_full_overpayment_federal", true],
];

function decisions(status: Status): AIDecisionRow[] {
  return [...DECISIONS, ["decisions.scope.filing_status", status] as const].map(([key, decision]) =>
    decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision, rationale: "test" }),
  );
}

function evaluate(shape: Shape, facts: Map<string, TaxFactRow>) {
  const scenario = evaluateScenario({
    filing: { id: "eic-line-27a-test", taxYear: base.taxYear },
    facts: [...facts.values()],
    decisions: decisions(shape.status),
    authEmail: null,
  });
  const lines = Object.fromEntries(
    [...scenario.forms.values()].flatMap((form) =>
      form.fields.map((field) => [field.fieldId, field.result.ok ? field.result.value : undefined]),
    ),
  );
  const pending = pendingInputs(scenario);
  return {
    outcome: eicOutcome(lines as Parameters<typeof eicOutcome>[0], scenario.filingInfo),
    asked: [...pending.pendingFacts, ...pending.pendingDecisions],
  };
}

const MAX_ROUNDS = 6;

/* Answer what line 27a's inputs ask until it decides; fails when it waits with nothing asked. */
function settle(shape: Shape): { outcome: EicOutcome; askedEic: string[] } {
  const facts = startingFacts(shape);
  const askedEic: string[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { outcome, asked } = evaluate(shape, facts);
    if (outcome.kind !== "waiting") return { outcome, askedEic };
    const answerable = asked.filter((key) => key in ANSWERS && !askedEic.includes(key));
    expect(answerable, `${JSON.stringify(shape)} waits with nothing asked`).not.toEqual([]);
    for (const key of answerable) {
      askedEic.push(key);
      facts.set(key, fact(key, ANSWERS[key]));
    }
  }
  throw new Error(`${JSON.stringify(shape)} still waits after ${MAX_ROUNDS} rounds`);
}

const STATUSES: Status[] = [
  "single",
  "head_of_household",
  "married_filing_separately",
  "married_filing_jointly",
];
const SHAPES: Shape[] = STATUSES.flatMap((status) =>
  (["none", "nephew", "parent", "student_unknown"] as const).flatMap((dependent) =>
    [15_000, 80_000].map((wages) => ({ status, dependent, wages })),
  ),
);

describe("Form 1040 line 27a never waits on an answer no one asks", () => {
  it.each(SHAPES)("$status, $dependent, wages $wages", (shape) => {
    const { outcome } = settle(shape);
    expect(outcome.kind).not.toBe("waiting");
  });

  it("asks an open dependent's EIC answer when Schedule 8812 does not", () => {
    const { askedEic } = settle({ status: "single", dependent: "student_unknown", wages: 15_000 });
    expect(askedEic).toContain(DEPENDENT_KEY);
  });

  it("stops MFS with no qualifying child at Step 4, question 1, with nothing asked", () => {
    const shape: Shape = { status: "married_filing_separately", dependent: "none", wages: 15_000 };
    const { outcome, askedEic } = settle(shape);
    expect(outcome).toEqual({ kind: "none", checkLine27c: false });
    expect(askedEic.filter((key) => key.startsWith("eic."))).toEqual([]);
  });

  describe("head of household with no qualifying child (a parent as dependent)", () => {
    const hoh: Shape = {
      status: "head_of_household",
      dependent: "parent",
      wages: 15_000,
      dob: "06/01/1985",
    };

    it("reaches the married-head-of-household gap, asking no EIC answer", () => {
      const { outcome, askedEic } = settle(hoh);
      expect(outcome).toEqual({ kind: "unsupported", reason: MARRIED_HOH_GAP });
      expect(askedEic.filter((key) => key.startsWith("eic."))).toEqual([]);
    });

    it("stops when a fact says the filer has a spouse (lived apart the last 6 months)", () => {
      const married = { ...hoh, extra: { [SPOUSE_KEYS.livedApartLastSixMonths]: true } };
      expect(settle(married).outcome).toEqual({ kind: "none", checkLine27c: false });
    });

    it("stops outside ages 25–64 whether or not the filer is married", () => {
      expect(settle({ ...hoh, dob: "06/01/2003" }).outcome).toEqual({
        kind: "none",
        checkLine27c: false,
      });
    });
  });
});
