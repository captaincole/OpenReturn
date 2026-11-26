/*
 * Form 8912 on a whole return: who files, the missing answers, the receiving
 * lines (Schedule B line 1, Form 1040 line 2b, Schedule 3 line 6k), and "no
 * facts, nothing changes". The synthetic varilin and yukiri scenarios are the
 * bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeBondTaxCreditStatementFactKey,
  makeTaxCreditBondFactKey,
  type BondTaxCreditStatementValue,
  type TaxCreditBondFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { roundDollars } from "../../../../src/money.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { COOPERATIVE_STATEMENT, ENERGY_BOND } from "../../../scenarios/synthetic/varilin/facts.js";
import { varilinScenario as varilin } from "../../../scenarios/synthetic/varilin/index.js";
import { wrenScenario as wren } from "../../../scenarios/synthetic/wren/index.js";
import { SCHOOL_BOND } from "../../../scenarios/synthetic/yukiri/facts.js";
import { yukiriScenario as yukiri } from "../../../scenarios/synthetic/yukiri/index.js";

type Base = typeof varilin;

const SCHOOL = makeTaxCreditBondFactKey("cascade-valley-qscb");
const ENERGY = makeTaxCreditBondFactKey("pinecrest-qecb");
const COOPERATIVE = makeBondTaxCreditStatementFactKey("red-river-cooperative");

function factsWith(
  base: Base,
  changes: Record<string, unknown>,
  extra: TaxFactRow[] = [],
): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const bondRow = (base: Base, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category: "investment_income",
  key,
  value,
});

function evaluate(
  base: Base,
  facts: TaxFactRow[] = base.facts,
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-8912-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const line = (id: string) => value("form-8912", id);
  const missing = result.forms.get("form-8912")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

describe("Form 8912: no facts, nothing changes", () => {
  it("a return with no bond facts files no Form 8912 and keeps Schedule 3 line 6k's old reason", () => {
    const { files, field } = evaluate(wren as Base);
    expect(files("form-8912")).toBe(false);
    const sixK = field("schedule-3", "0.line.6k") as { reason?: string };
    expect(isGap(sixK)).toBe(true);
    expect(sixK.reason).toBe("No scenario uses this credit or payment yet.");
  });

  it("the decision false keeps the form off and adds no interest", () => {
    const decisions = [
      ...yukiri.decisions,
      decisionRow({
        userId: yukiri.userId,
        taxYear: yukiri.taxYear,
        key: "decisions.scope.must_file_8912",
        decision: false,
        rationale: "test",
      }),
    ];
    const { files, value } = evaluate(yukiri as Base, yukiri.facts, decisions);
    expect(files("form-8912")).toBe(false);
    expect(value("form-1040", "line.2b")).toBeUndefined();
  });
});

describe("Form 8912: who files", () => {
  it("files from a bond, a Form 1097-BTC or a carryforward", () => {
    expect(evaluate(yukiri as Base).files("form-8912")).toBe(true);
    expect(evaluate(varilin).files("schedule-3")).toBe(true);
  });

  it("a bond issued after 2017 has no credit", () => {
    const facts = factsWith(yukiri as Base, {
      [SCHOOL]: { ...SCHOOL_BOND, issueDate: "2018-02-01" },
    });
    expect(evaluate(yukiri as Base, facts).files("form-8912")).toBe(false);
  });

  it("an individual holding a QZAB issued before October 4, 2008 claims nothing; through an S corporation, it can", () => {
    const early: TaxCreditBondFactValue = {
      ...SCHOOL_BOND,
      bondType: "qzab",
      issueDate: "2007-05-01",
    };
    expect(
      evaluate(yukiri as Base, factsWith(yukiri as Base, { [SCHOOL]: early })).files("form-8912"),
    ).toBe(false);
    const passed: TaxCreditBondFactValue = {
      source: "pass_through",
      bondType: "qzab_before_october_4_2008",
      issuerNameCityState: "Granite Ridge Bancorp, an S corporation",
      issuerEin: "00-0089129",
      passThroughCredit: 410,
    };
    const { line } = evaluate(yukiri as Base, factsWith(yukiri as Base, { [SCHOOL]: passed }));
    expect(line("0.line.2_bond_credits_part_iv")).toBe(410);
  });
});

describe("Form 8912: missing answers", () => {
  it("a held bond with no answer on Form 1099-INT is asked; the credit computes, the interest waits", () => {
    const { creditOnForm1099Int: _, ...bond } = SCHOOL_BOND;
    const { line, missing, value } = evaluate(
      yukiri as Base,
      factsWith(yukiri as Base, { [SCHOOL]: bond }),
    );
    expect(missing).toContain(SCHOOL);
    expect(line("0.line.2_bond_credits_part_iv")).toBe(910);
    expect(value("form-1040", "line.2b")).toBeUndefined();
  });

  it("a held bond with no credit rate waits on line 2", () => {
    const bond = { ...SCHOOL_BOND, rows: [{ identifier: "99999QSC6", outstandingAmount: 20000 }] };
    const { line, missing } = evaluate(
      yukiri as Base,
      factsWith(yukiri as Base, { [SCHOOL]: bond }),
    );
    expect(missing).toContain(SCHOOL);
    expect(line("0.line.2_bond_credits_part_iv")).toBeUndefined();
  });

  it("a CREB Form 1097-BTC waits for the pass-through answer on line 12, not on line 1", () => {
    const { fromPassThroughEntity: _, ...statement } = COOPERATIVE_STATEMENT;
    const { line, missing } = evaluate(varilin, factsWith(varilin, { [COOPERATIVE]: statement }));
    expect(missing).toContain(COOPERATIVE);
    expect(line("0.line.1_bond_credits_part_iii")).toBe(2033);
    expect(line("0.line.12_credit_allowed_current_year")).toBeUndefined();
  });
});

describe("Form 8912: the lines that receive it", () => {
  it("varilin: line 12 is Schedule 3 line 6k; the QECB credit is a Schedule B row", () => {
    const { line, value } = evaluate(varilin);
    expect(line("0.line.12_credit_allowed_current_year")).toBe(4432);
    expect(value("schedule-3", "0.line.6k")).toBe(4432);
    expect(value("schedule-b", "0.line.1_payer_name_4")).toBe(ENERGY_BOND.issuerNameCityState);
    expect(value("schedule-b", "0.line.1_amount_4")).toBe(1004);
  });

  it("yukiri: with no Schedule B, Form 1040 line 2b takes the credit itself", () => {
    const { files, value } = evaluate(yukiri as Base);
    expect(files("schedule-b")).toBe(false);
    expect(value("form-1040", "line.2b")).toBe(910);
  });

  it("the tax limits line 12, and line 6k follows", () => {
    const big = {
      ...SCHOOL_BOND,
      rows: [{ identifier: "99999QSC6", outstandingAmount: 200000, creditRate: 0.0455 }],
    };
    const { line, value } = evaluate(yukiri as Base, factsWith(yukiri as Base, { [SCHOOL]: big }));
    expect(line("0.line.4_total_credit")).toBe(9100);
    const line11 = line("0.line.11_net_income_tax") as number;
    expect(line11).toBeLessThan(9100);
    expect(line("0.line.12_credit_allowed_current_year")).toBe(line11);
    expect(value("schedule-3", "0.line.6k")).toBe(line11);
  });

  it("a CREB credit from a pass-through entity is limited by the line 12 formula", () => {
    const statement: BondTaxCreditStatementValue = {
      ...COOPERATIVE_STATEMENT,
      fromPassThroughEntity: true,
      attributableTaxableIncome: 2000,
    };
    const { line, value } = evaluate(varilin, factsWith(varilin, { [COOPERATIVE]: statement }));
    const line11 = line("0.line.11_net_income_tax") as number;
    const taxableIncome = value("form-1040", "line.15") as number;
    const limited = Math.min(612, roundDollars((line11 * 2000) / taxableIncome));
    expect(limited).toBeLessThan(612);
    expect(line("0.line.12_credit_allowed_current_year")).toBe(4432 - 612 + limited);
  });

  it("a new CREB passed through by an entity takes no second 70%", () => {
    const passed: TaxCreditBondFactValue = {
      source: "pass_through",
      bondType: "ncreb",
      issuerNameCityState: "Mesa Verde Holdings LP",
      issuerEin: "00-0089128",
      passThroughCredit: 540,
    };
    const { line } = evaluate(
      yukiri as Base,
      factsWith(yukiri as Base, {}, [
        bondRow(yukiri as Base, makeTaxCreditBondFactKey("mesa-verde"), passed),
      ]),
    );
    expect(line("0.line.2_bond_credits_part_iv")).toBe(910 + 540);
  });

  it("a bond bought between credit allowance dates makes its interest a gap, not a wrong amount", () => {
    const bought = { ...SCHOOL_BOND, acquiredDate: "2025-04-02" };
    const decisions = [
      ...yukiri.decisions,
      decisionRow({
        userId: yukiri.userId,
        taxYear: yukiri.taxYear,
        key: "decisions.scope.must_file_schedule_b",
        decision: true,
        rationale: "test",
      }),
    ];
    const { field, line, value } = evaluate(
      yukiri as Base,
      factsWith(yukiri as Base, { [SCHOOL]: bought }),
      decisions,
    );
    // Bought April 2: June 15, September 15 and December 15, 75% of 910.
    expect(line("0.line.2_bond_credits_part_iv")).toBe(683);
    expect(isGap(field("schedule-b", "0.line.1_amount_1"))).toBe(true);
    expect(isGap(field("schedule-b", "0.line.2_total_interest"))).toBe(true);
    expect(value("form-1040", "line.2b")).toBeUndefined();
  });

  it("a bond bought on a credit allowance date adds its whole credit as interest", () => {
    const bought = { ...SCHOOL_BOND, acquiredDate: "2025-06-15" };
    const { value } = evaluate(yukiri as Base, factsWith(yukiri as Base, { [SCHOOL]: bought }));
    expect(value("form-1040", "line.2b")).toBe(683);
  });
});
