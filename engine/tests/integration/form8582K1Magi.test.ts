import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import {
  RENTAL_KEYS,
  isK1FactKey,
  isK1HoldingFactKey,
  isW2FactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeRentalFactKey,
  type K1Box,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type RentalFactValue,
  type W2FactValue,
} from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { cadsuaneScenario } from "../scenarios/synthetic/cadsuane";

/*
 * Form 8582 line 6 (irs-8582-inst-2025::sec::line-6::b01) with a K-1 whose
 * entire interest was sold at an overall loss. Single, W-2 $110,000, one
 * rental with active participation and a $15,000 loss, so Part II needs line
 * 6. Line 6 is a gap for now (8582/magiGap.ts). Hand figures, the target for
 * the rebuild: line 6 is 110,000 plus the K-1's nonpassive amounts once plus
 * its released passive losses; line 7 is 150,000 less line 6; line 8 half of
 * that; line 9 the smaller of line 4 (15,000) and line 8.
 */

const fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: "form8582-k1-magi",
  taxYear: 2025,
  category,
  key,
  value,
  sourceNote: "made up for this test",
  createdAt: "2026-11-23T00:00:00Z",
});

const rental: RentalFactValue = {
  propertyType: "single_family",
  address: { street: "9 Elm Street", city: "Tampa", state: "FL", zip: "33602" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 10000,
  expenses: { repairs: 25000 },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
  disposedOfEntirely: false,
  qualifiedBusiness: false,
  specifiedService: false,
};

/* Cadsuane's identity and decisions, her W-2 at $110,000, the rental and one sold K-1. */
function facts(boxes: K1Box[], holding: K1HoldingFactValue): TaxFactRow[] {
  const k1: PartnershipK1FactValue = {
    form: "1065",
    entityName: "Andor Mills LP",
    entityEin: "00-0006065",
    finalK1: true,
    partnerType: "limited",
    boxes,
  };
  const own = cadsuaneScenario.facts
    .filter((row) => !isK1FactKey(row.key) && !isK1HoldingFactKey(row.key))
    .map((row) =>
      isW2FactKey(row.key)
        ? { ...row, value: { ...(row.value as W2FactValue), box1: 110000, box5: 110000 } }
        : row,
    );
  return [
    ...own,
    fact("rental", makeRentalFactKey("elm-street"), rental),
    fact("rental", RENTAL_KEYS.realEstateProfessional, false),
    fact("rental", RENTAL_KEYS.paymentsRequire1099, false),
    fact("k1", makePartnershipK1FactKey("andor-mills"), k1),
    fact("k1", makeK1HoldingFactKey("andor-mills"), {
      owner: "taxpayer",
      allInvestmentAtRisk: true,
      realEstateProfessional: false,
      partnershipBasisAtStart: 30000,
      disposedOfEntirely: true,
      gainOnDisposition: 0,
      ...holding,
    }),
  ];
}

function run(rows: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "form8582-k1-magi", taxYear: 2025 },
    facts: rows,
    decisions: cadsuaneScenario.decisions,
    authEmail: null,
  });
  const field = (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    return result.forms.get(formId)?.fields.find((entry) => entry.fieldId === fieldId)?.result;
  };
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  return { field, value };
}

/*
 * Line 6 is not rebuilt yet (QUESTIONS.md item 43): on a return with a Part IV
 * rental loss and a K-1, line 6 and every line that reads it are a gap.
 */
const LINE_6_READERS = [
  "form-8582.0.line.6_modified_agi",
  "form-8582.0.line.7_line5_minus_line6",
  "form-8582.0.line.8_half_of_line7",
  "form-8582.0.line.9_special_allowance",
  "form-8582.0.line.11_total_losses_allowed",
  "form-8582.1.part6.row_1_col_a_loss",
  "form-8582.1.part6.total_col_c_special_allowance",
  "schedule-e.0.line.22_deductible_loss_a",
  "schedule-e.0.line.25_losses",
  "schedule-e.0.line.26_total_income_or_loss",
  "schedule-e.1.line.41_total_income_or_loss",
];

function expectLine6Gap(field: ReturnType<typeof run>["field"]) {
  for (const fieldId of LINE_6_READERS) {
    const result = field(fieldId);
    expect(result?.ok, fieldId).toBe(false);
    if (result && !result.ok) expect(result.reason, fieldId).toContain("Form 8582 line 6");
  }
}

describe("Form 8582 line 6 with a K-1 sold at an overall loss", () => {
  it("is a gap with a passive partner's guaranteed payments and released box 1 loss", () => {
    const { field } = run(
      facts(
        [
          { box: "1", amount: -6000 },
          { box: "4a", amount: 15000 },
        ],
        { materiallyParticipated: false },
      ),
    );
    /*
     * Target for the rebuild: line 6 = 110,000 + 15,000 guaranteed payments
     * (column (k)) − 6,000 released loss = 119,000; line 7 31,000; line 8
     * 15,500; line 9 15,000; Schedule E line 22 15,000, the rental loss in full.
     */
    expectLine6Gap(field);
    // Lines that do not read line 6 still compute.
    expect(field("form-8582.0.line.3_combined")).toMatchObject({ ok: true, value: -15000 });
  });

  it("is a gap with a working partner's box 1 income and released rental loss", () => {
    const { field, value } = run(
      facts(
        [
          { box: "1", amount: 10000 },
          { box: "2", amount: -8000 },
        ],
        { materiallyParticipated: true, carriedLosses: { passive: 2000 } },
      ),
    );
    /*
     * Target for the rebuild: line 6 = 110,000 + 10,000 box 1 (column (k))
     * − 8,000 − 2,000 released passive losses = 110,000; line 7 40,000; line 8
     * 20,000; line 9 15,000; Schedule E line 22 15,000.
     */
    expectLine6Gap(field);
    expect(value("schedule-e.1.line.28_row_a_col_k_nonpassive_income")).toBe(10000);
    expect(value("schedule-e.1.line.28_row_b_col_a_name")).toBe(
      "Andor Mills LP, rental real estate",
    );
    expect(value("schedule-e.1.line.28_row_b_col_g_passive_loss_allowed")).toBe(8000);
    expect(value("schedule-e.1.line.28_row_c_col_a_name")).toBe("PYA Andor Mills LP");
    expect(value("schedule-e.1.line.28_row_c_col_g_passive_loss_allowed")).toBe(2000);
  });
});
