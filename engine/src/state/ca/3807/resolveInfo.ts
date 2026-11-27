import {
  CA_LAMBRA_KEYS,
  getCaLambraIncomeRows,
  getCaLambraNolCarryovers,
  type CaLambraBusinessFactValue,
  type CaLambraFactor,
  type CaLambraIncomeRow,
} from "../../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3807FilingInfo, LambraBusiness, LambraIncomeRow } from "./filingInfo.js";
import {
  apportioned,
  averageApportionment,
  lambraBusinessIncome,
  WHOLLY_WITHIN_LAMBRA,
  type Factor,
} from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3807";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";
const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";

const CARRYOVER_KEYS = [
  CA_LAMBRA_KEYS.hiringCreditCarryover,
  CA_LAMBRA_KEYS.salesUseTaxCreditCarryover,
] as const;

const filled = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
const amount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
const share = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : undefined;

/* The trade or business lines of Section B take Section A line 4 as column (b). */
const TRADE_LINES: ReadonlySet<string> = new Set([
  "schedule_c",
  "schedule_e",
  "schedule_f",
  "other_business",
  "schedule_d",
  "schedule_d1",
]);

function factorOf(factor: Partial<CaLambraFactor> | undefined): Factor | undefined {
  const california = amount(factor?.california);
  const lambra = amount(factor?.lambra);
  return california === undefined || lambra === undefined ? undefined : { california, lambra };
}

/* Worksheet I, Section A line 4 from the stated factors; undefined when none is stated. */
function apportionmentOf(value: Partial<CaLambraBusinessFactValue>): number | undefined {
  if (value.whollyWithinLambra === true) return WHOLLY_WITHIN_LAMBRA;
  const factors = [factorOf(value.property), factorOf(value.payroll)].filter(
    (factor): factor is Factor => factor !== undefined,
  );
  return factors.length === 0 ? undefined : averageApportionment(factors);
}

function businessOf(inputs: ResolverInputs): LambraBusiness | undefined {
  const raw = inputs.factByKey.get(CA_LAMBRA_KEYS.business) as
    Partial<CaLambraBusinessFactValue> | undefined;
  if (raw === undefined || typeof raw !== "object" || raw === null) return undefined;
  return {
    businessName: filled(raw.businessName),
    businessAddress: filled(raw.businessAddress),
    lambraName: filled(raw.lambraName),
    operatesBusiness: raw.operatesBusiness === true,
    principalBusinessActivityCode: filled(raw.principalBusinessActivityCode),
    employees: amount(raw.employees),
    grossReceipts: amount(raw.grossReceipts),
    totalAssets: amount(raw.totalAssets),
    apportionment: apportionmentOf(raw),
  };
}

/* A row's column (b): its own share, or Section A line 4 for a trade or business line. */
function rowOf(row: CaLambraIncomeRow, apportionment: number | undefined) {
  const percentage = TRADE_LINES.has(row.line) ? apportionment : share(row.percentage);
  return percentage === undefined ? undefined : { line: row.line, amount: row.amount, percentage };
}

/*
 * The rows wait on an answer: they are not stated, or a wage, employee
 * business expense or pass-through row has no column (b) share of its own
 * (::part-i-individual-income-and-expense-items::b01, ::part-ii-pass-through-income-or-loss::b02).
 */
const rowsWait = (rows: CaLambraIncomeRow[] | undefined) =>
  rows === undefined ||
  rows.some((row) => !TRADE_LINES.has(row.line) && share(row.percentage) === undefined);

/* Worksheet I, Section B line 14; undefined while the rows, a share or Section A waits. */
function businessIncomeOf(
  rows: CaLambraIncomeRow[] | undefined,
  business: LambraBusiness | undefined,
): number | undefined {
  if (rows === undefined) return undefined;
  const settled = rows.map((row) => rowOf(row, business?.apportionment));
  if (settled.some((row) => row === undefined)) return undefined;
  return lambraBusinessIncome(
    (settled as LambraIncomeRow[]).map((row) => apportioned(row.amount, row.percentage)),
  );
}

/* The business fact is complete: items B to D, items E to H for an operator, Section A when a row needs it. */
function businessComplete(business: LambraBusiness, rows: CaLambraIncomeRow[] | undefined) {
  const named = [business.businessName, business.businessAddress, business.lambraName];
  const operator = [
    business.principalBusinessActivityCode,
    business.employees,
    business.grossReceipts,
    business.totalAssets,
  ];
  const needsSectionA =
    business.operatesBusiness || (rows ?? []).some((row) => TRADE_LINES.has(row.line));
  return (
    named.every((each) => each !== undefined) &&
    (!business.operatesBusiness || operator.every((each) => each !== undefined)) &&
    (!needsSectionA || business.apportionment !== undefined)
  );
}

/*
 * The fact keys that put a LAMBRA carryover on the return: a hiring or sales
 * or use tax credit carryover above 0, an NOL carryover above 0, or the
 * business stated while a carryover is not stated yet (so it is asked).
 */
export function lambraFactKeys(inputs: ResolverInputs): string[] {
  const credits = CARRYOVER_KEYS.filter((key) => (num(inputs, key) ?? 0) > 0);
  const nols = getCaLambraNolCarryovers(inputs.facts);
  const nol = (nols ?? []).some((row) => row.carryover > 0) ? [CA_LAMBRA_KEYS.nolCarryovers] : [];
  const unstated =
    CARRYOVER_KEYS.some((key) => num(inputs, key) === undefined) || nols === undefined;
  const business =
    inputs.factByKey.has(CA_LAMBRA_KEYS.business) && unstated ? [CA_LAMBRA_KEYS.business] : [];
  return [...credits, ...nol, ...business];
}

/*
 * Schedule P (540) attaches with "credits that are reported in Part III,
 * Section A1, Section A2, or Section C" (ca-540-sched-p-inst-2025::sec::b-who-must-file::b01),
 * and code 198 offsets tax in Section A2 (::credit-table::b06): a hiring or
 * sales or use tax credit carryover above 0 attaches it.
 */
export function lambraSectionA2Fallback(inputs: ResolverInputs, files540: boolean) {
  const credits = CARRYOVER_KEYS.filter((key) => (num(inputs, key) ?? 0) > 0);
  return {
    rule: `fallback: Form 540 files (${files540}) with ${credits.length} LAMBRA credit carryover(s) (FTB 3807, Section A2)`,
    value: files540 && credits.length > 0,
    triggeredByFactKeys: credits,
    triggeredByDecisionKeys: [MUST_FILE_540_KEY],
  };
}

/*
 * Who files: "To claim any LAMBRA NOL carryover deduction or credit carryover,
 * attach a completed form FTB 3807 to your California tax return"
 * (ca-3807-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b01),
 * and "file form FTB 3807 for each year in which a LAMBRA NOL deduction is
 * being taken" (::part-iii-net-operating-loss-nol-carryover-and-deduction::b06).
 * The form files with a California return that has a carryover above 0, or a
 * stated business with a carryover not stated yet. The explicit decision
 * still wins.
 */
export function resolve3807Info(inputs: ResolverInputs): Form3807FilingInfo {
  const filesCalifornia =
    inputs.decisionByKey.get(MUST_FILE_540_KEY) === true ||
    inputs.decisionByKey.get(MUST_FILE_540NR_KEY) === true;
  const keys = lambraFactKeys(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: a California return (${filesCalifornia}) with ${keys.length} LAMBRA carryover input(s)`,
        value: filesCalifornia && keys.length > 0,
        triggeredByFactKeys: keys,
        triggeredByDecisionKeys: [MUST_FILE_540_KEY, MUST_FILE_540NR_KEY],
      },
    ],
  });
  const files = resolution.value === true;
  if (!files) return { mustFile: { "form-3807": resolution }, missingInputs: { "form-3807": [] } };
  const business = businessOf(inputs);
  const rows = getCaLambraIncomeRows(inputs.facts);
  const nols = getCaLambraNolCarryovers(inputs.facts);
  const hiring = num(inputs, CA_LAMBRA_KEYS.hiringCreditCarryover);
  const salesUse = num(inputs, CA_LAMBRA_KEYS.salesUseTaxCreditCarryover);
  return {
    mustFile: { "form-3807": resolution },
    /* The business while it is missing or not complete, the income rows, and each carryover. */
    missingInputs: {
      "form-3807": [
        ...(business === undefined || !businessComplete(business, rows)
          ? [CA_LAMBRA_KEYS.business]
          : []),
        ...(rowsWait(rows) ? [CA_LAMBRA_KEYS.businessIncome] : []),
        ...CARRYOVER_KEYS.filter((key) => num(inputs, key) === undefined),
        ...(nols === undefined ? [CA_LAMBRA_KEYS.nolCarryovers] : []),
      ],
    },
    lambraBusiness: business,
    lambraBusinessIncome: businessIncomeOf(rows, business),
    lambraHiringCarryover: hiring === undefined ? undefined : Math.max(0, hiring),
    lambraSalesUseCarryover: salesUse === undefined ? undefined : Math.max(0, salesUse),
    lambraNolCarryovers: nols,
  };
}
