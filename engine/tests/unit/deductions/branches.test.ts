import { describe, expect, it } from "vitest";
import { branchState, type BranchInputs } from "../../../src/deductions/branches.js";
import { DEDUCTION_BRANCHES, type BranchId } from "../../../src/deductions/catalog.js";
import { LIFE_KEYS, MORTGAGE_KEYS } from "../../../src/facts/index.js";

const branch = (id: BranchId) => DEDUCTION_BRANCHES.find((candidate) => candidate.id === id)!;

const inputs = (overrides: Partial<BranchInputs>): BranchInputs => ({
  opener: undefined,
  exact: undefined,
  estimate: undefined,
  forCpa: false,
  missingAmountKeys: [],
  agi: 100000,
  filesCa: true,
  ...overrides,
});

describe("branchState", () => {
  it("never asks a renter about mortgage interest", () => {
    const state = branchState(branch("mortgage_interest"), inputs({ opener: false }));
    expect(state).toMatchObject({ status: "closed", missing: [] });
  });

  it("asks the life-probe question first, then the amount", () => {
    const unasked = branchState(branch("mortgage_interest"), inputs({}));
    expect(unasked).toMatchObject({ status: "unasked", missing: [LIFE_KEYS.ownsHome] });
    const open = branchState(
      branch("mortgage_interest"),
      inputs({ opener: true, missingAmountKeys: [MORTGAGE_KEYS.interestForm1098] }),
    );
    expect(open).toMatchObject({ status: "open", missing: [MORTGAGE_KEYS.interestForm1098] });
  });

  it("closes medical bills under the 7.5% floor: no document is asked for", () => {
    const state = branchState(
      branch("medical"),
      inputs({ opener: true, estimate: 6000, missingAmountKeys: ["medical.expenses_total"] }),
    );
    expect(state).toMatchObject({ status: "below_floor", missing: [] });
  });

  it("keeps an estimate over the floor open for its document", () => {
    const state = branchState(
      branch("medical"),
      inputs({ opener: true, estimate: 12000, missingAmountKeys: ["medical.expenses_total"] }),
    );
    expect(state).toMatchObject({
      status: "estimate",
      amount: 12000,
      missing: ["medical.expenses_total"],
    });
  });

  it("settles an exact amount, and closes an exact 0", () => {
    expect(branchState(branch("gifts_cash"), inputs({ exact: 25000 })).status).toBe("exact");
    expect(branchState(branch("gifts_cash"), inputs({ exact: 0 })).status).toBe("closed");
  });

  it("closes California investment fees for a filer with no 540", () => {
    const state = branchState(
      branch("ca_investment_fees"),
      inputs({ exact: 5000, filesCa: false }),
    );
    expect(state.status).toBe("closed");
  });

  it("hands a mortgage over the debt limit to the CPA", () => {
    const state = branchState(
      branch("mortgage_interest"),
      inputs({ forCpa: true, estimate: 40000 }),
    );
    expect(state).toMatchObject({ status: "for_cpa", amount: 40000 });
  });
});
