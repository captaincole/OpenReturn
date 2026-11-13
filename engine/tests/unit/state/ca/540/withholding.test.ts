/* Source: 2025 Form 540 instructions, line 71 (California income tax withheld). */

import { describe, expect, it } from "vitest";
import {
  makeGamblingWinningsFactKey,
  makeInterestFactKey,
  makeMiscIncomeFactKey,
  makeNonemployeeCompensationFactKey,
  makePaymentTransactionsFactKey,
  makeRetirementDistributionFactKey,
} from "../../../../../src/facts/index.js";
import { makeResolverInputs } from "../../../../../src/resolverInputs.js";
import { californiaWithholdingOtherForms } from "../../../../../src/state/ca/540/withholding.js";

type FormKind = {
  name: string;
  category: string;
  key: (id: string) => string;
  amountBox: string;
  stateBox: string;
};

const FORM_KINDS: FormKind[] = [
  {
    name: "W-2G",
    category: "other",
    key: (id) => makeGamblingWinningsFactKey("casino", id),
    amountBox: "box15",
    stateBox: "box13",
  },
  {
    name: "1099-INT",
    category: "investment_income",
    key: (id) => makeInterestFactKey(`bank-${id}`),
    amountBox: "box17",
    stateBox: "box15",
  },
  {
    name: "1099-MISC",
    category: "other",
    key: (id) => makeMiscIncomeFactKey(`payer-${id}`),
    amountBox: "box16",
    stateBox: "box17",
  },
  {
    name: "1099-K",
    category: "self_employment",
    key: (id) => makePaymentTransactionsFactKey("platform", id),
    amountBox: "box8",
    stateBox: "box6",
  },
  {
    name: "1099-NEC",
    category: "self_employment",
    key: (id) => makeNonemployeeCompensationFactKey("client", id),
    amountBox: "box5",
    stateBox: "box6",
  },
  {
    name: "1099-R",
    category: "retirement",
    key: (id) => makeRetirementDistributionFactKey("plan", id),
    amountBox: "box14",
    stateBox: "box15",
  },
];

describe.each(FORM_KINDS)("Form 540 line 71 from a $name", (kind) => {
  const form = (id: string, amount: number, state?: string) => ({
    key: kind.key(id),
    category: kind.category,
    value: { payerName: "Payer", box1: 1000, [kind.amountBox]: amount, [kind.stateBox]: state },
  });
  const line71 = (facts: ReturnType<typeof form>[]) =>
    californiaWithholdingOtherForms(makeResolverInputs({ facts, decisions: [] }));

  it("counts a California state box and no state box, not another state's", () => {
    const facts = [form("a", 100, "CA/123456789"), form("b", 20.5, "NY"), form("c", 7)];
    expect(line71(facts)).toBeCloseTo(107);
  });

  it("is blank when only another state withheld", () => {
    expect(line71([form("a", 100, "OR")])).toBeUndefined();
  });
});
