/*
 * Depreciation and amortization answers for one business or rental activity:
 * what Form 4562 and form FTB 3885A read. The taxpayer states them; Cade records
 * them inside the business fact (record-business) or the rental fact
 * (record-rental), as `depreciation`. Federal and California amounts are the
 * same unless a California field says otherwise.
 */

/* Form 4562 lines 19a–19j: the General Depreciation System classes. */
export type RecoveryClass =
  | "3_year"
  | "5_year"
  | "7_year"
  | "10_year"
  | "15_year"
  | "20_year"
  | "25_year"
  | "residential_rental"
  | "nonresidential_real"
  | "50_year";

/* Form 4562 column (f): 200% or 150% declining balance, or straight line. */
export type DepreciationMethod = "200DB" | "150DB" | "SL";

/* Form 4562 column (e): half-year, mid-quarter or mid-month. */
export type DepreciationConvention = "HY" | "MQ" | "MM";

/* One asset placed in service during 2025 (Form 4562 Parts I–III, FTB 3885A line 3). */
export interface DepreciableAsset {
  description: string;
  /* YYYY-MM-DD, in 2025. An older asset is part of priorYearMacrs. */
  placedInService: string;
  /* Cost or other basis, before the business-use share. */
  cost: number;
  /* Business or investment use, in percent; 100 when absent. */
  businessUsePercent?: number;
  recoveryClass: RecoveryClass;
  method: DepreciationMethod;
  convention: DepreciationConvention;
  /* Form 4562 line 6 column (c): the part of the cost elected as a section 179 expense. */
  section179Elected?: number;
  /* Acquired after January 19, 2025 (the 100% special allowance). Asked only for an asset placed in service after that date. */
  acquiredAfterJanuary19?: boolean;
  /* The taxpayer elected out of the special depreciation allowance for this asset's class. */
  electedOutOfSpecialAllowance?: boolean;
  /* For property acquired after January 19, 2025: the election to take 40% instead of 100%. */
  elected40PercentAllowance?: boolean;
  /* Listed property (a car, Part V). Not modeled. */
  listedProperty?: boolean;
  /* FTB 3885A: the California basis, when it differs from cost times business use. */
  californiaBasis?: number;
  /* FTB 3885A Tangible Property Expense Worksheet line 6 column (c): the California section 179 election. */
  californiaSection179Elected?: number;
}

/* One cost whose amortization begins in 2025 (Form 4562 line 42, FTB 3885A line 9). */
export interface AmortizedCost {
  description: string;
  /* YYYY-MM-DD: the date the amortization period begins, in 2025. */
  beginsOn: string;
  /* Column (c): the amortizable amount. */
  amount: number;
  /* Column (d): the Code section, as the taxpayer states it. */
  codeSection: string;
  /* Column (e): the amortization period, in months. */
  periodMonths: number;
  /* FTB 3885A line 9 column (c): the California amortizable amount, when it differs. */
  californiaAmount?: number;
}

export interface ActivityDepreciation {
  /* Assets placed in service in 2025. */
  assets?: DepreciableAsset[];
  /* Form 4562 line 17: MACRS deductions for assets placed in service before 2025. */
  priorYearMacrs?: number;
  /* Form 4562 line 10: the section 179 deduction carried over from 2024 (2024 Form 4562 line 13). */
  section179Carryover?: number;
  /* Costs whose amortization begins in 2025. */
  amortizedCosts?: AmortizedCost[];
  /* Form 4562 line 43: amortization of costs that began before 2025. */
  priorYearAmortization?: number;
  /* FTB 3885A line 5: California depreciation for assets placed in service before 2025, when it differs from priorYearMacrs. */
  californiaPriorYearDepreciation?: number;
  /* FTB 3885A line 11: California amortization of costs that began before 2025, when it differs from priorYearAmortization. */
  californiaPriorYearAmortization?: number;
}

const RECOVERY_CLASSES: readonly string[] = [
  "3_year",
  "5_year",
  "7_year",
  "10_year",
  "15_year",
  "20_year",
  "25_year",
  "residential_rental",
  "nonresidential_real",
  "50_year",
];
const METHODS: readonly string[] = ["200DB", "150DB", "SL"];
const CONVENTIONS: readonly string[] = ["HY", "MQ", "MM"];

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isDigits = (part: string, length: number): boolean =>
  part.length === length && [...part].every((char) => char >= "0" && char <= "9");

/* A YYYY-MM-DD date. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const [year, month, day, ...rest] = value.split("-");
  return (
    rest.length === 0 &&
    isDigits(year ?? "", 4) &&
    isDigits(month ?? "", 2) &&
    isDigits(day ?? "", 2) &&
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    Number(day) >= 1 &&
    Number(day) <= 31
  );
}

const isOptionalBoolean = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";

function isAsset(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.description === "string" &&
    isIsoDate(value.placedInService) &&
    typeof value.cost === "number" &&
    isAmount(value.cost) &&
    isAmount(value.businessUsePercent) &&
    ((value.businessUsePercent as number | undefined) ?? 100) <= 100 &&
    RECOVERY_CLASSES.includes(value.recoveryClass as string) &&
    METHODS.includes(value.method as string) &&
    CONVENTIONS.includes(value.convention as string) &&
    isAmount(value.section179Elected) &&
    isAmount(value.californiaBasis) &&
    isAmount(value.californiaSection179Elected) &&
    isOptionalBoolean(value.acquiredAfterJanuary19) &&
    isOptionalBoolean(value.electedOutOfSpecialAllowance) &&
    isOptionalBoolean(value.elected40PercentAllowance) &&
    isOptionalBoolean(value.listedProperty)
  );
}

function isAmortizedCost(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.description === "string" &&
    isIsoDate(value.beginsOn) &&
    typeof value.amount === "number" &&
    isAmount(value.amount) &&
    typeof value.codeSection === "string" &&
    typeof value.periodMonths === "number" &&
    Number.isInteger(value.periodMonths) &&
    value.periodMonths > 0 &&
    isAmount(value.californiaAmount)
  );
}

const isListOf = (value: unknown, check: (entry: unknown) => boolean): boolean =>
  value === undefined || (Array.isArray(value) && value.every(check));

/* Undefined, or an activity's depreciation answers whose amounts and dates are well formed. */
export function isActivityDepreciation(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  return (
    isListOf(value.assets, isAsset) &&
    isListOf(value.amortizedCosts, isAmortizedCost) &&
    isAmount(value.priorYearMacrs) &&
    isAmount(value.section179Carryover) &&
    isAmount(value.priorYearAmortization) &&
    isAmount(value.californiaPriorYearDepreciation) &&
    isAmount(value.californiaPriorYearAmortization)
  );
}
