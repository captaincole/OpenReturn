/* Source: ca-3514-inst-2025, Steps 1–10, the EITC worksheet and the 2025 EITC Table. */

import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  CA_EITC_KEYS,
  EIC_KEYS,
  SPOUSE_KEYS,
  makeDependentFactKey,
  makeInterestFactKey,
  type DependentFactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { tcbCa010Scenario as base } from "../scenarios/tcb-ca-010/index.js";

/*
 * The tcb-ca-010 filer (single, born 2003, one California W-2) with the
 * credit answers removed, so each shape starts with nothing asked.
 */
type Status =
  "single" | "head_of_household" | "married_filing_separately" | "married_filing_jointly";
interface Shape {
  status?: Status;
  wages?: number;
  dob?: string;
  child?: DependentFactValue;
  extra?: Record<string, unknown>;
}

const CHILD_KEY = makeDependentFactKey("kid");
const YOUNG_CHILD: DependentFactValue = {
  firstName: "Kiddo",
  lastName: "Test",
  ssn: "900-45-6780",
  relationship: "Son",
  dob: "02/28/2022",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

/* The answer recorded when the form asks for a key. */
const ANSWERS: Record<string, unknown> = {
  [EIC_KEYS.nonresidentAlien]: false,
  [EIC_KEYS.mainHomeInUs]: true,
  [EIC_KEYS.qualifyingChildOfAnother]: false,
  [EIC_KEYS.claimableAsDependent]: false,
  [EIC_KEYS.deniedInEarlierYear]: false,
  [EIC_KEYS.barredByIrs]: false,
  [CA_EITC_KEYS.ftbDisallowedEarlierYear]: false,
  [CA_EITC_KEYS.fosterYouthTaxpayer]: false,
  [CA_EITC_KEYS.fosterYouthSpouse]: false,
  [SPOUSE_KEYS.firstName]: "Sam",
  [SPOUSE_KEYS.lastName]: "Test",
  [SPOUSE_KEYS.ssn]: "900-45-6781",
  [SPOUSE_KEYS.dob]: "01/01/1990",
  [SPOUSE_KEYS.itemizesSeparately]: false,
  [SPOUSE_KEYS.livedApartAllYear]: false,
  [SPOUSE_KEYS.livedApartLastSixMonths]: true,
};

const CATEGORY_BY_PREFIX: Array<[string, string]> = [
  ["identity.", "identity"],
  ["filing_status.", "filing_status"],
  ["dependent.", "dependents"],
  ["account.", "investment_income"],
  ["payer.", "investment_income"],
];

const fact = (key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category: CATEGORY_BY_PREFIX.find(([prefix]) => key.startsWith(prefix))?.[1] ?? "other",
  key,
  value,
});

const CREDIT_ANSWERS = new Set([...Object.values(EIC_KEYS), ...Object.values(CA_EITC_KEYS)]);

function startingFacts(shape: Shape): Map<string, TaxFactRow> {
  const kept = base.facts.flatMap((row): TaxFactRow[] => {
    if (CREDIT_ANSWERS.has(row.key as never)) return [];
    if (row.key === "identity.dob" && shape.dob) return [{ ...row, value: shape.dob }];
    if (row.category !== "wages" || shape.wages === undefined) return [row];
    const w2 = row.value as Record<string, unknown>;
    const wages = shape.wages;
    return [{ ...row, value: { ...w2, box1: wages, box3: wages, box5: wages, box16: wages } }];
  });
  const child = shape.child ? [fact(CHILD_KEY, shape.child)] : [];
  const extra = Object.entries(shape.extra ?? {}).map(([key, value]) => fact(key, value));
  return new Map([...kept, ...child, ...extra].map((row) => [row.key, row]));
}

function decisions(status: Status): AIDecisionRow[] {
  return base.decisions
    .filter((row) => row.decisionKey !== "decisions.scope.filing_status")
    .concat(
      decisionRow({
        userId: base.userId,
        taxYear: base.taxYear,
        key: "decisions.scope.filing_status",
        decision: status,
        rationale: "test",
      }),
    );
}

function evaluate(shape: Shape, facts: Map<string, TaxFactRow>) {
  const scenario = evaluateScenario({
    filing: { id: "ftb-3514-test", taxYear: base.taxYear },
    facts: [...facts.values()],
    decisions: decisions(shape.status ?? "single"),
    authEmail: null,
  });
  const lines = new Map(
    [...scenario.forms.values()].flatMap((form) =>
      form.fields.map((field) => [field.fieldId, field.result] as const),
    ),
  );
  const pending = pendingInputs(scenario);
  const files = scenario.forms.get("form-3514")?.mustFile;
  return {
    lines,
    files: files?.ok === true && files.value === true,
    asked: [...pending.pendingFacts, ...pending.pendingDecisions],
  };
}

const MAX_ROUNDS = 6;
const settled = (lines: ReturnType<typeof evaluate>["lines"]) =>
  lines.get("form-540.line.78_total_payments")?.ok === true;

/* Answer what the forms ask until Form 540 line 78 is known; fails when it waits with nothing asked. */
function settle(shape: Shape) {
  const facts = startingFacts(shape);
  const asked: string[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const result = evaluate(shape, facts);
    if (settled(result.lines)) return { ...result, askedOverall: asked };
    const answerable = result.asked.filter((key) => key in ANSWERS && !asked.includes(key));
    expect(answerable, `${JSON.stringify(shape)} waits with nothing asked`).not.toEqual([]);
    for (const key of answerable) {
      asked.push(key);
      facts.set(key, fact(key, ANSWERS[key]));
    }
  }
  throw new Error(`${JSON.stringify(shape)} still waits after ${MAX_ROUNDS} rounds`);
}

const value = (lines: ReturnType<typeof evaluate>["lines"], fieldId: string) => {
  const result = lines.get(fieldId);
  return result?.ok ? result.value : undefined;
};

describe("FTB 3514", () => {
  it("credits $183 to a single filer of 22 with $13,000 of wages, and asks its answers", () => {
    const { lines, askedOverall } = settle({});
    expect(value(lines, "form-3514.1.line.20_ca_eitc")).toBe(183);
    expect(value(lines, "form-540.line.75_eitc")).toBe(183);
    expect(askedOverall).toEqual(
      expect.arrayContaining([
        EIC_KEYS.qualifyingChildOfAnother,
        EIC_KEYS.claimableAsDependent,
        CA_EITC_KEYS.ftbDisallowedEarlierYear,
        CA_EITC_KEYS.fosterYouthTaxpayer,
      ]),
    );
  });

  it("looks up federal AGI too when it differs from earned income (worksheet line 5)", () => {
    const interest = { payerName: "Bank", payerTin: "12-3456789", box1: 600 };
    const { lines } = settle({ extra: { [makeInterestFactKey("bank")]: interest } });
    // $13,000 earned: 183; AGI $13,600 (the 13,551–13,600 row): 178.
    expect(value(lines, "form-3514.1.line.19_ca_earned_income")).toBe(13000);
    expect(value(lines, "form-3514.1.line.20_ca_eitc")).toBe(178);
  });

  it("adds the YCTC for a child under six: $30,000 earned, $1,189 less 25.75 × $21.71", () => {
    const { lines } = settle({ wages: 30_000, child: YOUNG_CHILD });
    expect(value(lines, "form-3514.2.line.25_excess_over_threshold")).toBe(2575);
    expect(value(lines, "form-3514.2.line.27_reduction_amount_dollars")).toBe(559);
    expect(value(lines, "form-3514.2.line.27_reduction_amount_cents")).toBe("03");
    expect(value(lines, "form-3514.2.line.28_yctc")).toBe(630);
    expect(value(lines, "form-540.line.76_young_child_tax_credit")).toBe(630);
    expect(value(lines, "form-3514.0.line.5_first_name_child_1")).toBe("Kiddo");
    expect(value(lines, "form-3514.0.line.11_days_lived_in_ca_child_1")).toBe(365);
  });

  it("adds the FYTC for a former foster youth under the threshold: $1,189", () => {
    const extra = {
      [CA_EITC_KEYS.fosterYouthTaxpayer]: true,
      [CA_EITC_KEYS.cdssConsentTaxpayer]: true,
    };
    const { lines } = settle({ extra });
    expect(value(lines, "form-3514.2.line.31a_primary_taxpayer_claims_fytc")).toBe(true);
    expect(value(lines, "form-3514.3.line.39_fytc")).toBe(1189);
    expect(value(lines, "form-540.line.77_foster_youth_tax_credit")).toBe(1189);
    expect(value(lines, "form-540.line.78_total_payments")).toBe(183 + 1189);
  });

  it("does not file with wages of $32,901 or more", () => {
    const { files, lines } = settle({ wages: 32_901 });
    expect(files).toBe(false);
    expect(value(lines, "form-540.line.75_eitc")).toBeUndefined();
  });

  it("does not file for a high earner with a child under six (Step 1, a)", () => {
    const { files } = settle({ wages: 194_000, child: YOUNG_CHILD });
    expect(files).toBe(false);
  });

  it("leaves Form 540 line 78 a gap when FTB 3514's earned income is (W-2 box 11)", () => {
    const facts = startingFacts({});
    const w2 = [...facts.values()].find((row) => row.category === "wages")!;
    facts.set(w2.key, { ...w2, value: { ...(w2.value as object), box11: 500 } });
    for (const [key, answer] of Object.entries(ANSWERS)) facts.set(key, fact(key, answer));
    const { lines } = evaluate({}, facts);
    expect(lines.get("form-3514.1.line.13_ca_wages")).toMatchObject({ ok: true, value: 13000 });
    expect(lines.get("form-540.line.78_total_payments")).toMatchObject({ unsupported: true });
  });

  it("does not file for a married filer filing separately with no qualifying child (Step 1, d)", () => {
    const { files } = settle({ status: "married_filing_separately" });
    expect(files).toBe(false);
  });

  it("stops a filer under 18 with no qualifying child (Step 4, b)", () => {
    const { lines } = settle({ dob: "06/01/2008" });
    expect(value(lines, "form-540.line.75_eitc")).toBeUndefined();
  });
});
