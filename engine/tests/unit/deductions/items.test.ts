import { describe, expect, it } from "vitest";
import { DEDUCTION_ITEMS, type ItemId } from "../../../src/deductions/catalog.js";
import { itemState, type ItemInputs } from "../../../src/deductions/items.js";
import { MORTGAGE_KEYS } from "../../../src/facts/index.js";

const item = (id: ItemId) => DEDUCTION_ITEMS.find((candidate) => candidate.id === id)!;

const inputs = (overrides: Partial<ItemInputs>): ItemInputs => ({
  amount: undefined,
  assumed: false,
  anyStated: false,
  forCpa: false,
  missingAmountKeys: [],
  agi: 100000,
  filesCa: true,
  ...overrides,
});

describe("itemState", () => {
  it("closes a renter's mortgage item once Cade records 0 interest", () => {
    const state = itemState(item("mortgage_interest"), inputs({ amount: 0, anyStated: true }));
    expect(state).toMatchObject({ status: "closed", missing: [] });
  });

  it("asks the line-level fact while nothing is known, then the rest once one fact is in", () => {
    const unasked = itemState(
      item("mortgage_interest"),
      inputs({ missingAmountKeys: [MORTGAGE_KEYS.interestForm1098] }),
    );
    expect(unasked).toMatchObject({
      status: "unasked",
      missing: [MORTGAGE_KEYS.interestForm1098],
    });
    const open = itemState(
      item("mortgage_interest"),
      inputs({ anyStated: true, missingAmountKeys: [MORTGAGE_KEYS.outstandingPrincipalForm1098] }),
    );
    expect(open).toMatchObject({
      status: "open",
      missing: [MORTGAGE_KEYS.outstandingPrincipalForm1098],
    });
  });

  it("closes medical bills under the 7.5% floor: no document is asked for", () => {
    const state = itemState(
      item("medical"),
      inputs({ amount: 6000, assumed: true, missingAmountKeys: ["medical.expenses_total"] }),
    );
    expect(state).toMatchObject({ status: "below_floor", missing: [] });
  });

  it("keeps an assumption over the floor open for its document", () => {
    const state = itemState(
      item("medical"),
      inputs({ amount: 12000, assumed: true, missingAmountKeys: ["medical.expenses_total"] }),
    );
    expect(state).toMatchObject({
      status: "assumed",
      amount: 12000,
      assumed: true,
      missing: ["medical.expenses_total"],
    });
  });

  it("settles an exact amount, and closes an exact 0", () => {
    expect(itemState(item("gifts_cash"), inputs({ amount: 25000 })).status).toBe("exact");
    expect(itemState(item("gifts_cash"), inputs({ amount: 0 })).status).toBe("closed");
  });

  it("closes California investment fees for a filer with no 540", () => {
    const state = itemState(item("ca_investment_fees"), inputs({ amount: 5000, filesCa: false }));
    expect(state.status).toBe("closed");
  });

  it("hands a mortgage over the debt limit to the CPA", () => {
    const state = itemState(item("mortgage_interest"), inputs({ forCpa: true, upperBound: 40000 }));
    expect(state).toMatchObject({ status: "for_cpa", amount: 40000 });
  });
});
