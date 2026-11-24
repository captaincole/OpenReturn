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
 * entire interest was sold at an overall loss: its released passive losses
 * count once, and its nonpassive amounts (columns (k) and (i)) count once.
 * Single, W-2 $110,000, one rental with active participation and a $15,000
 * loss. Hand figures: line 6 is 110,000 plus the K-1's nonpassive amounts plus
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
  return (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    const found = result.forms.get(formId)?.fields.find((entry) => entry.fieldId === fieldId);
    return found?.result.ok ? found.result.value : undefined;
  };
}

describe("Form 8582 line 6 with a K-1 sold at an overall loss", () => {
  it("counts a passive partner's guaranteed payments once, and the released box 1 loss", () => {
    const value = run(
      facts(
        [
          { box: "1", amount: -6000 },
          { box: "4a", amount: 15000 },
        ],
        { materiallyParticipated: false },
      ),
    );
    // 110,000 + 15,000 guaranteed payments (column (k)) − 6,000 released loss.
    expect(value("form-8582.0.line.6_modified_agi")).toBe(119000);
    expect(value("form-8582.0.line.7_line5_minus_line6")).toBe(31000);
    expect(value("form-8582.0.line.8_half_of_line7")).toBe(15500);
    expect(value("form-8582.0.line.9_special_allowance")).toBe(15000);
    expect(value("schedule-e.0.line.22_deductible_loss_a")).toBe(15000);
  });

  it("counts a working partner's box 1 income once, and the released rental loss", () => {
    const value = run(
      facts(
        [
          { box: "1", amount: 10000 },
          { box: "2", amount: -8000 },
        ],
        { materiallyParticipated: true, carriedLosses: { passive: 2000 } },
      ),
    );
    // 110,000 + 10,000 box 1 (column (k)) − 8,000 − 2,000 released passive losses.
    expect(value("form-8582.0.line.6_modified_agi")).toBe(110000);
    expect(value("form-8582.0.line.7_line5_minus_line6")).toBe(40000);
    expect(value("form-8582.0.line.8_half_of_line7")).toBe(20000);
    expect(value("form-8582.0.line.9_special_allowance")).toBe(15000);
    expect(value("schedule-e.0.line.22_deductible_loss_a")).toBe(15000);
    expect(value("schedule-e.1.line.28_row_a_col_k_nonpassive_income")).toBe(10000);
    expect(value("schedule-e.1.line.28_row_b_col_a_name")).toBe(
      "Andor Mills LP, rental real estate",
    );
    expect(value("schedule-e.1.line.28_row_b_col_g_passive_loss_allowed")).toBe(8000);
    expect(value("schedule-e.1.line.28_row_c_col_a_name")).toBe("PYA Andor Mills LP");
    expect(value("schedule-e.1.line.28_row_c_col_g_passive_loss_allowed")).toBe(2000);
  });
});
