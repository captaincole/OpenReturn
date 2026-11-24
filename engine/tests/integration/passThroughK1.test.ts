import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  PRIOR_YEAR_KEYS,
  isInterestFactKey,
  isK1FactKey,
  isK1HoldingFactKey,
  isW2FactKey,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
  type TrustK1FactValue,
  type W2FactValue,
} from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { sum } from "../../src/money";
import { lanScenario } from "../scenarios/synthetic/lan";
import { matScenario } from "../scenarios/synthetic/mat";
import { minScenario } from "../scenarios/synthetic/min";
import type { Scenario } from "../types";

function run(scenario: Scenario, facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions: scenario.decisions,
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
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { result, field, value, files };
}

const withoutK1 = (facts: TaxFactRow[]) =>
  facts.filter((fact) => !isK1FactKey(fact.key) && !isK1HoldingFactKey(fact.key));

/* The scenario's K-1 fact with its value changed. */
const editK1 = (
  facts: TaxFactRow[],
  edit: (k1: SCorporationK1FactValue) => SCorporationK1FactValue,
): TaxFactRow[] =>
  facts.map((fact) =>
    isK1FactKey(fact.key) ? { ...fact, value: edit(fact.value as SCorporationK1FactValue) } : fact,
  );

describe("an S corporation K-1 is income, not self-employment or earned income (lan)", () => {
  const withK1 = run(lanScenario, lanScenario.facts);
  const without = run(lanScenario, withoutK1(lanScenario.facts));

  it("adds box 1 to AGI through Schedule E line 41 and Schedule 1 line 5", () => {
    expect(withK1.value("schedule-e.1.line.41_total_income_or_loss")).toBe(15000);
    expect(withK1.value("schedule-1.0.line.5")).toBe(15000);
    const agi = withK1.value("form-1040.line.11a") as number;
    expect(agi - (without.value("form-1040.line.11a") as number)).toBe(15000);
  });

  it("leaves Schedule SE as it is without the K-1", () => {
    for (const line of ["2", "3", "4a", "12", "13"]) {
      const fieldId = `schedule-se.0.line.${line}`;
      expect(withK1.value(fieldId), fieldId).toBe(without.value(fieldId));
    }
    expect(withK1.value("schedule-se.0.line.3")).toBe(5000);
  });

  it("leaves the EIC on the same earned income: the credit does not change", () => {
    expect(withK1.value("form-1040.line.27a")).toBe(3613);
    expect(without.value("form-1040.line.27a")).toBe(3613);
  });

  it("is ready to file with nothing pending", () => {
    expect(pendingInputs(withK1.result)).toEqual({
      pendingDecisions: [],
      pendingFacts: [],
      pendingAssumptions: [],
    });
  });
});

describe("a K-1 item with no route makes the return visibly incomplete", () => {
  const facts = editK1(lanScenario.facts, (k1) => ({
    ...k1,
    boxes: [...k1.boxes, { box: "6", amount: 900 }],
  }));
  const withRoyalties = run(lanScenario, facts);

  it("reports it on Schedule E line 41 with the entity and the item type", () => {
    const line41 = withRoyalties.field("schedule-e.1.line.41_total_income_or_loss");
    expect(line41?.ok).toBe(false);
    if (line41 && !line41.ok) {
      expect(line41.unsupported).toBe(true);
      expect(line41.reason).toContain("Malkier Fencing Academy, Inc. (S corporation K-1)");
      expect(line41.reason).toContain("royalties (box 6)");
    }
  });

  it("reports it on the row's amount column too, and AGI stays blank", () => {
    const column = withRoyalties.field("schedule-e.1.line.28_row_a_col_k_nonpassive_income");
    expect(column?.ok === false && column.unsupported).toBe(true);
    expect(withRoyalties.value("form-1040.line.11a")).toBeUndefined();
  });

  it("reports a trust K-1's unrouted item on line 41, and still lists its interest", () => {
    const trust: TaxFactRow = {
      ...lanScenario.facts[0],
      id: "f-trust",
      category: "k1",
      key: "k1.trust.ash-family",
      value: {
        form: "1041",
        entityName: "Ash Family Trust",
        entityEin: "00-0001041",
        boxes: [
          { box: "1", amount: 250 },
          { box: "13", code: "C", amount: 75 },
        ],
      },
    };
    const withTrust = run(lanScenario, [...lanScenario.facts, trust]);
    const line41 = withTrust.field("schedule-e.1.line.41_total_income_or_loss");
    expect(line41?.ok === false && line41.reason).toContain(
      "Ash Family Trust (estate or trust K-1): credit (box 13 code C)",
    );
    const own = run(lanScenario, lanScenario.facts).value("form-1040.line.2b");
    expect(withTrust.value("form-1040.line.2b")).toBe(sum(own, 250));
  });
});

describe("an S corporation's foreign taxes need Schedule K-3 (lan)", () => {
  // Foreign taxes reduce basis (Form 7203 line 46), so the holding gives the stock basis.
  const facts = editK1(lanScenario.facts, (k1) => ({
    ...k1,
    boxes: [...k1.boxes, { box: "16", code: "F", amount: 120 }],
  })).map((fact) =>
    isK1HoldingFactKey(fact.key)
      ? { ...fact, value: { ...(fact.value as K1HoldingFactValue), stockBasisAtStart: 20000 } }
      : fact,
  );
  const withTax = run(lanScenario, facts);

  it("names the S corporation on Schedule 3 line 1, and Schedule E still computes", () => {
    expect(withTax.files("schedule-3")).toBe(true);
    const line1 = withTax.field("schedule-3.0.line.1");
    expect(line1?.ok === false && line1.unsupported).toBe(true);
    expect(line1?.ok === false && line1.reason).toContain(
      "Malkier Fencing Academy, Inc. (S corporation K-1): the foreign tax credit for these taxes comes from Schedule K-3",
    );
    expect(withTax.value("schedule-e.1.line.41_total_income_or_loss")).toBe(15000);
  });
});

describe("the section 199A statement makes the K-1 a QBI business (min)", () => {
  const withStatement = run(minScenario, minScenario.facts);

  it("adds the statement's QBI as a business on Form 8995", () => {
    expect(withStatement.value("form-8995.0.line.1i_a")).toBe("Baerlon Bindery, Inc.");
    expect(withStatement.value("form-8995.0.line.1i_b")).toBe("00-0001121");
    expect(withStatement.value("form-8995.0.line.1i_c")).toBe(3200);
    expect(withStatement.value("form-1040.line.13a")).toBe(640);
  });

  it("names a statement with W-2 wages and UBIA but no QBI amount on the QBI line", () => {
    const facts = editK1(minScenario.facts, (k1) => ({
      ...k1,
      section199A: { ...k1.section199A, qualifiedBusinessIncome: undefined },
    }));
    const noQbi = run(minScenario, facts);
    expect(noQbi.files("form-8995")).toBe(true);
    expect(noQbi.value("form-8995.0.line.1i_a")).toBe("Baerlon Bindery, Inc.");
    const line1c = noQbi.field("form-8995.0.line.1i_c");
    expect(line1c?.ok === false && line1c.unsupported).toBe(true);
    expect(line1c?.ok === false && line1c.reason).toContain(
      "gives W-2 wages or UBIA of qualified property but no QBI amount",
    );
    expect(noQbi.value("form-1040.line.13a")).toBeUndefined();
  });

  it("adds nothing to the deduction without a statement", () => {
    const facts = editK1(minScenario.facts, (k1) => ({
      ...k1,
      boxes: k1.boxes.filter((entry) => entry.box !== "17"),
      section199A: undefined,
    }));
    const without = run(minScenario, facts);
    expect(without.files("form-8995")).toBe(false);
    expect(without.value("schedule-e.1.line.41_total_income_or_loss")).toBe(3200);
  });
});

/* The mat scenario's trust K-1 with its value changed. */
const editTrust = (
  facts: TaxFactRow[],
  edit: (k1: TrustK1FactValue) => TrustK1FactValue,
): TaxFactRow[] =>
  facts.map((fact) =>
    isK1FactKey(fact.key) ? { ...fact, value: edit(fact.value as TrustK1FactValue) } : fact,
  );

const withBoxes = (...boxes: TrustK1FactValue["boxes"]) =>
  editTrust(matScenario.facts, (k1) => ({ ...k1, boxes: [...k1.boxes, ...boxes] }));

/* A prior-year answer on the mat return. */
const priorYear = (key: string, value: unknown): TaxFactRow => ({
  ...matScenario.facts[0],
  id: `f-${key}`,
  category: "other",
  key,
  value,
});

/* Each mat W-2's box 1, raised by the same amount. */
const raiseWages = (facts: TaxFactRow[], raise: number): TaxFactRow[] =>
  facts.map((fact) =>
    isW2FactKey(fact.key)
      ? {
          ...fact,
          value: { ...(fact.value as W2FactValue), box1: (fact.value as W2FactValue).box1 + raise },
        }
      : fact,
  );

describe("a trust K-1's items join the beneficiary's own lines (mat)", () => {
  const mat = run(matScenario, matScenario.facts);

  it("lists the trust as a payer on Schedule B, and Schedule E does not file", () => {
    expect(mat.value("schedule-b.0.line.1_payer_name_2")).toBe("Shandalle Family Trust");
    expect(mat.value("schedule-b.0.line.5_payer_name_1")).toBe("Shandalle Family Trust");
    expect(mat.files("schedule-e")).toBe(false);
  });

  it("is ready to file with nothing pending", () => {
    expect(pendingInputs(mat.result)).toEqual({
      pendingDecisions: [],
      pendingFacts: [],
      pendingAssumptions: [],
    });
  });

  it("claims a trust's small foreign tax on Schedule 3 line 1 with no Form 1116 (the election)", () => {
    const foreign = run(matScenario, withBoxes({ box: "14", code: "B", amount: 60 }));
    expect(foreign.files("schedule-3")).toBe(true);
    expect(foreign.files("form-1116")).toBe(false);
    expect(foreign.value("schedule-3.0.line.1")).toBe(60);
    expect(foreign.value("schedule-3.0.line.8")).toBe(60);
    expect(foreign.value("form-1040.line.20")).toBe(60);
    expect(foreign.value("form-1040.line.22")).toBe(
      (mat.value("form-1040.line.22") as number) - 60,
    );
    expect(foreign.value("form-1040.line.11a")).toBe(mat.value("form-1040.line.11a"));
    expect(pendingInputs(foreign.result).pendingFacts).toEqual([]);
  });

  it("files Form 1116 above the election's limit, and waits on the K-1 for the trustee's statement", () => {
    const facts = [
      ...withBoxes({ box: "14", code: "B", amount: 900 }),
      priorYear(PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive, 0),
      priorYear(PRIOR_YEAR_KEYS.foreignLossAccounts, false),
    ];
    const waiting = run(matScenario, facts);
    expect(waiting.files("form-1116")).toBe(true);
    expect(waiting.value("schedule-3.0.line.1")).toBeUndefined();
    expect(pendingInputs(waiting.result).pendingFacts).toContain("k1.trust.shandalle-family-trust");
    const stated = run(
      matScenario,
      editTrust(facts, (k1) => ({
        ...k1,
        foreignIncome: {
          grossIncome: 3000,
          qualifiedDividends: 2400,
          country: "Canada",
          incomeKind: "dividends",
        },
      })),
    );
    expect(stated.value("form-1116.0.line.i_foreign_country_name_col_a")).toBe("Canada");
    expect(stated.value("form-1116.0.line.row_a_usd_withheld_dividends_col_q")).toBe(900);
    expect(stated.value("form-1116.0.line.3d_gross_foreign_source_income_col_a")).toBe(3000);
    expect(stated.value("form-1116.0.line.8_total_foreign_taxes_paid")).toBe(900);
    expect(typeof stated.value("schedule-3.0.line.1")).toBe("number");
    expect(pendingInputs(stated.result).pendingFacts).toEqual([]);
  });

  it("puts box 5 income on Schedule E Part III, column (f), and adds it to AGI", () => {
    const box5 = run(matScenario, withBoxes({ box: "5", amount: 700 }));
    expect(box5.files("schedule-e")).toBe(true);
    expect(box5.value("schedule-e.1.line.33_row_a_col_a_name")).toBe("Shandalle Family Trust");
    expect(box5.value("schedule-e.1.line.33_row_a_col_b_ein")).toBe("00-0004141");
    expect(box5.value("schedule-e.1.line.33_row_a_col_f_other_income")).toBe(700);
    expect(box5.value("schedule-e.1.line.34a_totals_col_f")).toBe(700);
    expect(box5.value("schedule-e.1.line.35_add_income_columns")).toBe(700);
    expect(box5.value("schedule-e.1.line.37_total_estate_trust_income")).toBe(700);
    expect(box5.value("schedule-e.1.line.41_total_income_or_loss")).toBe(700);
    expect(box5.value("schedule-1.0.line.5")).toBe(700);
    expect(box5.value("form-1040.line.11a")).toBe(
      (mat.value("form-1040.line.11a") as number) + 700,
    );
    expect(pendingInputs(box5.result).pendingFacts).toEqual([]);
  });

  it("reports a box 5 loss on Schedule E line 41", () => {
    const loss = run(matScenario, withBoxes({ box: "5", amount: -700 }));
    const line41 = loss.field("schedule-e.1.line.41_total_income_or_loss");
    expect(line41?.ok === false && line41.reason).toContain("a loss on Schedule E Part III");
    expect(loss.value("form-1040.line.11a")).toBeUndefined();
  });

  it("never adds a box 5 loss to a Part III income column: every amount there is the gap", () => {
    const loss = run(matScenario, withBoxes({ box: "5", amount: -700 }, { box: "6", amount: 900 }));
    const fields = [
      "schedule-e.1.line.33_row_a_col_d_passive_income",
      "schedule-e.1.line.33_row_a_col_e_nonpassive_deduction_loss",
      "schedule-e.1.line.33_row_a_col_f_other_income",
      "schedule-e.1.line.34a_totals_col_d",
      "schedule-e.1.line.34a_totals_col_f",
      "schedule-e.1.line.35_add_income_columns",
      "schedule-e.1.line.37_total_estate_trust_income",
    ];
    for (const fieldId of fields) {
      const field = loss.field(fieldId);
      expect(field?.ok === false && field.unsupported, fieldId).toBe(true);
      expect(field?.ok === false && field.reason, fieldId).toContain(
        "other portfolio income (loss) (box 5): a loss on Schedule E Part III is not modeled",
      );
    }
    expect(loss.value("schedule-e.1.line.33_row_a_col_a_name")).toBe("Shandalle Family Trust");
    expect(loss.value("schedule-1.0.line.5")).toBeUndefined();
  });

  it("puts a net short-term gain on Schedule D line 5", () => {
    const shortTerm = run(matScenario, withBoxes({ box: "3", amount: 1100 }));
    expect(shortTerm.value("schedule-d.0.line.5_net_short_term_passthrough")).toBe(1100);
    expect(shortTerm.value("schedule-d.0.line.7_net_short_term_gain_loss")).toBe(1100);
    expect(shortTerm.value("schedule-d.1.line.16_combined_gain_loss")).toBe(6500);
    expect(shortTerm.value("form-1040.line.7a")).toBe(6500);
  });

  it("files Schedule D for a short-term gain alone", () => {
    const onlyShortTerm = run(
      matScenario,
      editTrust(matScenario.facts, (k1) => ({
        ...k1,
        boxes: k1.boxes.filter((entry) => entry.box !== "4a").concat({ box: "3", amount: 900 }),
      })),
    );
    expect(onlyShortTerm.files("schedule-d")).toBe(true);
    expect(onlyShortTerm.value("form-1040.line.7a")).toBe(900);
  });

  it("names a 28% rate gain on Schedule D line 18, a worksheet the engine does not fill", () => {
    const collectibles = run(matScenario, withBoxes({ box: "4b", amount: 1000 }));
    const line18 = collectibles.field("schedule-d.1.line.18_rate_gain_worksheet_amount");
    expect(line18?.ok === false && line18.reason).toContain(
      "Shandalle Family Trust (estate or trust K-1): collectibles (28%) gain (loss) (box 4b)",
    );
    const line20 = collectibles.field("schedule-d.1.line.20_use_qual_div_worksheet_yes");
    expect(line20?.ok === false && line20.unsupported).toBe(true);
  });

  it("adds the trust's interest, dividends and gain to Form 8960 above the threshold", () => {
    const high = run(matScenario, raiseWages(matScenario.facts, 40000));
    expect(high.files("form-8960")).toBe(true);
    expect(high.value("form-8960.0.line.1")).toBe(2270);
    expect(high.value("form-8960.0.line.2")).toBe(3600);
    expect(high.value("form-8960.0.line.5a")).toBe(5400);
    expect(high.value("form-8960.0.line.13")).toBe(301270);
    // Line 16 is the smaller of the net investment income and MAGI over $250,000.
    expect(high.value("form-8960.0.line.12")).toBe(11270);
    expect(high.value("form-8960.0.line.17")).toBe(428);
  });

  it("files Form 8960 for a trust's rental income alone, and puts it on line 4a", () => {
    // No 1099-INT and only box 7: the trust's rental income is the only investment income.
    const facts = raiseWages(
      editTrust(
        matScenario.facts.filter((fact) => !isInterestFactKey(fact.key)),
        (k1) => ({ ...k1, boxes: [{ box: "7", amount: 6000 }], section199A: undefined }),
      ),
      40000,
    );
    const rental = run(matScenario, facts);
    expect(rental.value("schedule-e.1.line.33_row_a_col_d_passive_income")).toBe(6000);
    expect(rental.value("form-1040.line.11a")).toBe(296000);
    expect(rental.files("form-8960")).toBe(true);
    expect(rental.value("form-8960.0.line.4a")).toBe(6000);
    expect(rental.value("form-8960.0.line.4c")).toBe(6000);
    expect(rental.value("form-8960.0.line.12")).toBe(6000);
    expect(rental.value("form-8960.0.line.16")).toBe(6000);
    expect(rental.value("form-8960.0.line.17")).toBe(228);
    expect(rental.value("schedule-2.0.line.12_net_investment_income_tax")).toBe(228);
  });

  it("makes Form 8960 lines 7 and 13 unsupported for a box 14 code H adjustment", () => {
    const codeH = run(
      matScenario,
      raiseWages(withBoxes({ box: "14", code: "H", amount: -300 }), 40000),
    );
    for (const line of ["7", "13"]) {
      const field = codeH.field(`form-8960.0.line.${line}`);
      expect(field?.ok === false && field.reason).toContain("box 14 code H");
    }
    expect(codeH.value("form-8960.0.line.17")).toBeUndefined();
    expect(codeH.value("form-1040.line.11a")).toBe(301270);
  });
});
