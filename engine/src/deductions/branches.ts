/*
 * Branch states: why a deduction line is blank, open or settled for this
 * filer. A form binding only knows "blank or number"; the catalog knows that a
 * renter's mortgage branch never opened, that medical bills under the floor
 * cannot matter, and which fact Cade asks for next.
 */

import { roundDollars } from "../money.js";
import type { DeductionBranch } from "./catalog.js";

export type BranchStatus =
  /** The life-probe question is not answered yet. */
  | "unasked"
  /** Answered no, never opened, or answered 0: no question follows. */
  | "closed"
  /** Opened, with no amount yet. */
  | "open"
  /** An estimate only: enough for the comparison, not for the return. */
  | "estimate"
  /** The documents or the taxpayer gave the amount. */
  | "exact"
  /** An amount under its AGI floor on every return: it cannot change the result. */
  | "below_floor"
  /** The engine cannot compute the line (for example a mortgage over the debt limit): for the CPA. */
  | "for_cpa";

export interface BranchInputs {
  /** The life-probe answer, when the branch has one. */
  opener: boolean | undefined;
  /** The amount from exact facts, as the form will use it. */
  exact: number | undefined;
  estimate: number | undefined;
  /** The engine waits on a line it cannot compute. */
  forCpa: boolean;
  /** The amount facts not stated yet. */
  missingAmountKeys: string[];
  agi: number | undefined;
  /** The branch counts on the California return too. */
  filesCa: boolean;
}

export interface BranchState {
  id: DeductionBranch["id"];
  title: string;
  status: BranchStatus;
  /** The amount the comparison uses: exact, else the estimate. */
  amount?: number;
  /** What Cade asks next: the life-probe key, or the amount facts. */
  missing: string[];
  federalLine: string;
  caLine: string;
}

/* The returns the branch counts on: federal, and California when the 540 files. */
function countingLines(branch: DeductionBranch, inputs: BranchInputs) {
  const lines = [branch.federal, ...(inputs.filesCa ? [branch.ca] : [])];
  return lines.filter((line) => line.rule !== "none");
}

/* Under its AGI floor on every return it counts on. */
function belowFloor(branch: DeductionBranch, amount: number, inputs: BranchInputs): boolean {
  const agi = inputs.agi;
  if (agi === undefined) return false;
  return countingLines(branch, inputs).every(
    (line) => line.rule === "agi_floor" && amount <= roundDollars(agi * (line.floorRate ?? 0)),
  );
}

function settled(
  branch: DeductionBranch,
  amount: number,
  exact: boolean,
  inputs: BranchInputs,
): BranchStatus {
  // Nothing to deduct, or a deduction no return of this filer takes (CA fees without a 540).
  if (amount <= 0 || countingLines(branch, inputs).length === 0) return "closed";
  if (belowFloor(branch, amount, inputs)) return "below_floor";
  return exact ? "exact" : "estimate";
}

export function branchState(branch: DeductionBranch, inputs: BranchInputs): BranchState {
  const base = {
    id: branch.id,
    title: branch.title,
    federalLine: branch.federal.line,
    caLine: branch.ca.line,
  };
  if (inputs.forCpa) return { ...base, status: "for_cpa", amount: inputs.estimate, missing: [] };
  if (inputs.exact !== undefined) {
    return {
      ...base,
      status: settled(branch, inputs.exact, true, inputs),
      amount: inputs.exact,
      missing: [],
    };
  }
  if (inputs.estimate !== undefined) {
    const status = settled(branch, inputs.estimate, false, inputs);
    const missing = status === "estimate" ? inputs.missingAmountKeys : [];
    return { ...base, status, amount: inputs.estimate, missing };
  }
  if (branch.opensWith === undefined || inputs.opener === false) {
    return { ...base, status: "closed", missing: [] };
  }
  if (inputs.opener === undefined) {
    return { ...base, status: "unasked", missing: [branch.opensWith] };
  }
  return { ...base, status: "open", missing: inputs.missingAmountKeys };
}
