/*
 * The comparison worksheet: itemized against standard, federal and California,
 * on exact amounts and estimates alike. It uses the forms' own rules and
 * constants (the SALT cap, the AGI floors, the CA line 29 worksheet), so with
 * exact facts its totals equal Schedule A line 17 and Schedule CA line 29.
 */

import { saltCap } from "../federal/schedule-a/saltCap.js";
import { atLeast, roundDollars, sum } from "../money.js";
import { caItemizedLine29 } from "../state/ca/schedule-ca/itemizedWorksheet.js";
import type { FilingStatus } from "../values.js";
import { DEDUCTION_BRANCHES, type BranchId, type ReturnLine } from "./catalog.js";

export type Amounts = Partial<Record<BranchId, number>>;

export interface ComparisonInput {
  /** Each branch's amount as stated (exact or estimate); a floor or cap is applied here. */
  amounts: Amounts;
  /** The branches whose amount is an estimate. */
  estimated: ReadonlySet<BranchId>;
  /** Federal AGI (Form 1040 line 11b): the floors and the SALT cap read it. */
  agi: number;
  filingStatus: FilingStatus;
  federalStandard: number;
  /** Undefined when the return has no California 540. */
  caStandard?: number;
  /** FTB 3526 line 8 when California's investment interest differs from the federal. */
  caInvestmentInterest?: number;
}

export interface JurisdictionComparison {
  itemized: number;
  standard: number;
  /** Itemized less standard: positive means itemizing wins. */
  margin: number;
  recommendation: "itemize" | "standard";
  /**
   * Estimated branches whose amount is at least the margin: an error that size
   * could flip the recommendation, so their documents come first. Empty when
   * the recommendation holds whatever the estimates turn out to be.
   */
  decidingBranches: BranchId[];
}

export interface DeductionsComparison {
  federal: JurisdictionComparison;
  ca?: JurisdictionComparison;
}

const amountOf = (amounts: Amounts, id: BranchId): number => amounts[id] ?? 0;

const branchById = (id: BranchId) => DEDUCTION_BRANCHES.find((branch) => branch.id === id)!;

/* What one branch adds on one return: its amount, or the part over the AGI floor. */
function counted(line: ReturnLine, amount: number, agi: number): number {
  if (line.rule === "none") return 0;
  if (line.rule === "agi_floor")
    return atLeast(0, amount - roundDollars(agi * (line.floorRate ?? 0)));
  return amount;
}

/* Schedule A line 17: the SALT pool under its cap, the rest as their rules say. */
export function federalItemized(input: ComparisonInput): number {
  const salt = DEDUCTION_BRANCHES.filter((branch) => branch.federal.rule === "salt");
  const pool = sum(...salt.map((branch) => amountOf(input.amounts, branch.id)));
  const others = DEDUCTION_BRANCHES.filter((branch) => branch.federal.rule !== "salt").map(
    (branch) => counted(branch.federal, amountOf(input.amounts, branch.id), input.agi),
  );
  return sum(Math.min(pool, saltCap(input.agi, input.filingStatus)), ...others);
}

/*
 * Schedule CA Part II line 29: no state income tax, no SALT cap, the 2% items,
 * California's own investment interest, then the high-AGI worksheet.
 */
export function caItemized(input: ComparisonInput): number | undefined {
  const line28 = sum(
    ...DEDUCTION_BRANCHES.map((branch) =>
      branch.id === "investment_interest" && input.caInvestmentInterest !== undefined
        ? input.caInvestmentInterest
        : counted(branch.ca, amountOf(input.amounts, branch.id), input.agi),
    ),
  );
  // Worksheet line 2 reads the federal Schedule A lines 4 and 9.
  return caItemizedLine29({
    line28,
    federalAgi: input.agi,
    filingStatus: input.filingStatus,
    scheduleALine4: counted(
      branchById("medical").federal,
      amountOf(input.amounts, "medical"),
      input.agi,
    ),
    scheduleALine9: amountOf(input.amounts, "investment_interest"),
    scheduleALine15: undefined,
    scheduleALine16: undefined,
  });
}

function judge(input: ComparisonInput, itemized: number, standard: number): JurisdictionComparison {
  const margin = itemized - standard;
  const decidingBranches = [...input.estimated].filter(
    (id) => amountOf(input.amounts, id) >= Math.abs(margin),
  );
  return {
    itemized,
    standard,
    margin,
    recommendation: margin > 0 ? "itemize" : "standard",
    decidingBranches,
  };
}

export function compareDeductions(input: ComparisonInput): DeductionsComparison {
  const federal = judge(input, federalItemized(input), input.federalStandard);
  if (input.caStandard === undefined) return { federal };
  const ca = caItemized(input);
  return ca === undefined ? { federal } : { federal, ca: judge(input, ca, input.caStandard) };
}
