/* Source: irs-1040-inst-2025, lines 27a–27c (Steps 1–5); Step 4, question 1 is filers-without-a-qualifying::b01. */

import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  EIC_KEYS,
  RENTAL_KEYS,
  SPOUSE_KEYS,
  makeDependentFactKey,
  makeRentalFactKey,
  type DependentFactValue,
  type RentalFactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import {
  MARRIED_HOH_GAP,
  eicTableCredit,
  type EicOutcome,
} from "../../src/federal/schedule-eic/credit.js";
import { eicOutcome } from "../../src/federal/schedule-eic/outcome.js";
import { ROYALTIES_WITH_RENTS_GAP } from "../../src/federal/schedule-eic/worksheet1.js";
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
        : key.startsWith("rental.")
          ? "rental"
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

describe("Form 1040 line 27a for a Schedule E filer (Pub. 596 Worksheet 1)", () => {
  // A passive single-family rental: no real estate professional, actively managed.
  const house = (rentsReceived: number): RentalFactValue => ({
    propertyType: "single_family",
    address: { street: "1 Main St", city: "Town", state: "TX", zip: "75001" },
    fairRentalDays: 365,
    personalUseDays: 0,
    rentsReceived,
    expenses: { repairs: 1_000 },
    activeParticipation: true,
    materiallyParticipated: false,
    allInvestmentAtRisk: true,
    priorYearUnallowedLoss: 0,
  });
  const rentalShape = (rents: number): Shape => ({
    status: "single",
    dependent: "nephew",
    wages: 15_000,
    extra: {
      [makeRentalFactKey("house")]: house(rents),
      [RENTAL_KEYS.paymentsRequire1099]: false,
      [RENTAL_KEYS.realEstateProfessional]: false,
    },
  });

  it("credits a filer whose passive rental income keeps line 14 at $11,950 or less", () => {
    // Line 13: the rental's $8,000; AGI $23,000 is under $23,350, so earned income decides.
    const { outcome, askedEic } = settle(rentalShape(9_000));
    expect(outcome).toEqual({ kind: "credit", amount: eicTableCredit(15_000, 1, false) });
    expect(askedEic).toContain(EIC_KEYS.nonresidentAlien);
  });

  it("stops over $11,950 on line 14, though Step 2's sum is 0", () => {
    expect(settle(rentalShape(13_000)).outcome).toEqual({ kind: "none", checkLine27c: false });
  });

  it("reaches the gap for a property with rents and royalties, asking no EIC answer", () => {
    const shape = rentalShape(9_000);
    const mixed = { ...house(9_000), royaltiesReceived: 500 };
    const { outcome, askedEic } = settle({
      ...shape,
      extra: { ...shape.extra, [makeRentalFactKey("house")]: mixed },
    });
    expect(outcome).toEqual({ kind: "unsupported", reason: ROYALTIES_WITH_RENTS_GAP });
    expect(askedEic.filter((key) => key.startsWith("eic."))).toEqual([]);
  });

  it("leaves a self-rental's nonpassive net income out of line 13 and credits", () => {
    // As a passive rental, $12,000 on line 13 stops the credit; as a self-rental it is "NPA".
    const shape = rentalShape(13_000);
    const selfRental = { ...house(13_000), propertyType: "self_rental" as const };
    const { outcome, askedEic } = settle({
      ...shape,
      extra: { ...shape.extra, [makeRentalFactKey("house")]: selfRental },
    });
    // AGI $27,000 is over $23,350: the smaller of the two table amounts.
    const credit = Math.min(eicTableCredit(15_000, 1, false), eicTableCredit(27_000, 1, false));
    expect(outcome).toEqual({ kind: "credit", amount: credit });
    expect(askedEic).toContain(EIC_KEYS.nonresidentAlien);
  });
});
