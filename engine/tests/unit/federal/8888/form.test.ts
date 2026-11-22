/*
 * Form 8888 on a whole return: who files, the answers it waits for, the Form
 * 1040 line 35a box, and the case the engine does not print. The synthetic
 * moiraine scenario is the base (refund $3,385).
 */

import { describe, expect, it } from "vitest";
import {
  makeRefundDepositFactKey,
  type RefundDepositAccountFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { moiraineScenario as base } from "../../../scenarios/synthetic/moiraine/index.js";

const isAccount = (fact: TaxFactRow) => fact.key.startsWith("refund_deposit.");
const otherFacts = base.facts.filter((fact) => !isAccount(fact));
const template = base.facts.find(isAccount)!;

const account = (position: number, value: Partial<RefundDepositAccountFactValue> = {}) => ({
  ...template,
  id: `f-account-${position}`,
  key: makeRefundDepositFactKey(position),
  value: {
    routingNumber: "250250025",
    accountNumber: `1000${position}`,
    accountType: "checking",
    ...value,
  },
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8888-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...extra],
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
  return { files, field, value, pending: pendingInputs(result).pendingFacts };
}

const LINE_1A = "0.line.1a_first_account_amount";
const LINE_2A = "0.line.2a_second_account_amount";
const LINE_3A = "0.line.3a_third_account_amount";
const LINE_5 = "0.line.5_total_allocation_refund";
const BOX_35A = "line.35a_form_8888_attached";

describe("Who files Form 8888", () => {
  it("files for two accounts", () => {
    const run = evaluate([account(1, { amount: 1000 }), account(2)]);
    expect(run.files("form-8888")).toBe(true);
    expect([run.value("form-8888", LINE_1A), run.value("form-8888", LINE_2A)]).toEqual([
      1000, 2385,
    ]);
    expect(run.value("form-8888", LINE_5)).toBe(3385);
    expect(run.value("form-1040", BOX_35A)).toBe(true);
  });

  it("does not file for one account (it goes on Form 1040 lines 35b–35d)", () => {
    const run = evaluate([account(1)]);
    expect(run.files("form-8888")).toBe(false);
    expect(run.value("form-1040", BOX_35A)).toBeUndefined();
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [account(1, { amount: 1000 }), account(2)],
      [...base.decisions, decision("decisions.scope.must_file_8888", false)],
    );
    expect(run.files("form-8888")).toBe(false);
    expect(run.value("form-1040", BOX_35A)).toBeUndefined();
  });

  it("an explicit decision true with no account asks for two", () => {
    const run = evaluate([], [...base.decisions, decision("decisions.scope.must_file_8888", true)]);
    expect(run.files("form-8888")).toBe(true);
    expect(run.pending).toEqual(
      expect.arrayContaining([makeRefundDepositFactKey(1), makeRefundDepositFactKey(2)]),
    );
    expect(run.value("form-8888", LINE_5)).toBeUndefined();
  });
});

describe("No refund: the form does not file", () => {
  const noRefund = [
    ...base.decisions.filter(
      (each) => each.decisionKey !== "decisions.refund.refund_full_overpayment_federal",
    ),
    decision("decisions.refund.refund_full_overpayment_federal", false),
  ];

  it("two accounts with no amount on Form 1040 line 35a file nothing and ask nothing", () => {
    const run = evaluate([account(1, { amount: 1000 }), account(2)], noRefund);
    expect(run.value("form-1040", "line.35a")).toBeUndefined();
    expect(run.files("form-8888")).toBe(false);
    expect(run.value("form-1040", BOX_35A)).toBeUndefined();
  });

  it("an explicit decision true does not file it either", () => {
    const run = evaluate(
      [account(1, { amount: 1000 }), account(2)],
      [...noRefund, decision("decisions.scope.must_file_8888", true)],
    );
    expect(run.files("form-8888")).toBe(false);
  });
});

describe("No account fact: nothing changes", () => {
  it("Form 8888 does not file; Form 1040 lines 34, 35a and the box stay as before", () => {
    const run = evaluate([]);
    expect(run.files("form-8888")).toBe(false);
    expect(run.value("form-1040", "line.34")).toBe(3385);
    expect(run.value("form-1040", "line.35a")).toBe(3385);
    const box = run.field("form-1040", BOX_35A);
    expect(box?.ok).toBe(false);
    expect(box && !box.ok && box.unsupported).toBeFalsy();
    expect(run.pending.filter((key) => key.startsWith("refund_deposit."))).toEqual([]);
  });
});

describe("Answers the form waits for", () => {
  it("a bad routing number blanks the lines and asks for that account again", () => {
    const run = evaluate([
      account(1, { amount: 1000 }),
      account(2, { routingNumber: "991234567" }),
    ]);
    expect(run.pending).toContain(makeRefundDepositFactKey(2));
    expect(run.value("form-8888", LINE_1A)).toBeUndefined();
    expect(run.value("form-1040", BOX_35A)).toBeUndefined();
  });

  it("two accounts with no amount: the second waits for one", () => {
    const run = evaluate([account(1), account(2)]);
    expect(run.pending).toContain(makeRefundDepositFactKey(2));
    expect(run.pending).not.toContain(makeRefundDepositFactKey(1));
  });

  it("accounts on lines 1 and 3 print on lines 1 and 2", () => {
    const run = evaluate([account(1, { amount: 385 }), account(3, { accountType: "savings" })]);
    expect([run.value("form-8888", LINE_1A), run.value("form-8888", LINE_2A)]).toEqual([385, 3000]);
    expect(run.value("form-8888", "0.line.2c_second_account_savings")).toBe(true);
    expect(run.value("form-8888", "0.line.2c_second_account_checking")).toBeUndefined();
    expect(run.value("form-8888", LINE_3A)).toBeUndefined();
  });
});

describe("Stated amounts that differ from the refund", () => {
  it("more stated than the refund: the last account gives it back first", () => {
    const run = evaluate([
      account(1, { amount: 2000 }),
      account(2, { amount: 1000 }),
      account(3, { amount: 1000 }),
    ]);
    expect([LINE_1A, LINE_2A, LINE_3A].map((id) => run.value("form-8888", id))).toEqual([
      2000, 1000, 385,
    ]);
    expect(run.value("form-8888", LINE_5)).toBe(3385);
  });

  it("less stated than the refund: the last account gets the rest", () => {
    const run = evaluate([account(1, { amount: 1000 }), account(2, { amount: 1000 })]);
    expect([run.value("form-8888", LINE_1A), run.value("form-8888", LINE_2A)]).toEqual([
      1000, 2385,
    ]);
  });
});

describe("The case the engine does not print", () => {
  it("only one account gets money: the lines are unsupported (Form 1040 lines 35b–35d)", () => {
    const run = evaluate([account(1, { amount: 5000 }), account(2)]);
    expect(run.field("form-8888", LINE_1A)).toMatchObject({ ok: false, unsupported: true });
    expect(run.field("form-8888", LINE_5)).toMatchObject({ ok: false, unsupported: true });
    expect(run.value("form-1040", BOX_35A)).toBeUndefined();
  });
});

describe("Every field of the base scenario", () => {
  it("has a rule: no field is unsupported", () => {
    const result = evaluateScenario({
      filing: { id: "form-8888-test", taxYear: base.taxYear },
      facts: base.facts,
      decisions: base.decisions,
      authEmail: null,
    });
    const fields = result.forms.get("form-8888")?.fields ?? [];
    expect(fields).toHaveLength(19);
    expect(fields.filter((each) => !each.result.ok && each.result.unsupported)).toEqual([]);
  });
});
