import {
  CA_TTA_FIRST_LOSS_YEAR,
  CA_TTA_KEYS,
  CA_TTA_LAST_LOSS_YEAR,
  CA_TTA_OWN_BUSINESS_LINES,
  type CaTtaApportionmentFactValue,
  type CaTtaBusinessFactValue,
  type CaTtaBusinessIncomeFactValue,
  type CaTtaIncomeItem,
  type CaTtaNolCarryoversFactValue,
} from "../../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3809FilingInfo, TtaInputs } from "./filingInfo.js";
import type { ApportionmentInputs, NolRow } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3809";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";
const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";

const amountOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
const filled = (value: unknown) => typeof value === "string" && value.trim() !== "";
const isShare = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

/*
 * Items B to D always; the role says whether items E to H apply. The SIC code
 * with a hiring credit: "To qualify for the former TTA hiring credit, you must
 * be engaged in a trade or business within the selected SIC code. Enter the
 * SIC code" (ca-3809-booklet-2025::sec::standard-industrial-classification-sic-and-principal-business-activity-pba-codes::b01).
 */
function businessOf(
  inputs: ResolverInputs,
  hiringCarryover: number | undefined,
): CaTtaBusinessFactValue | undefined {
  const raw = inputs.factByKey.get(CA_TTA_KEYS.business) as
    Partial<CaTtaBusinessFactValue> | undefined;
  if (raw === undefined || (raw.role !== "operator" && raw.role !== "investor")) return undefined;
  if (![raw.businessName, raw.businessAddress, raw.areaName].every(filled)) return undefined;
  if ((hiringCarryover ?? 0) > 0 && !filled(raw.sicCode)) return undefined;
  return raw as CaTtaBusinessFactValue;
}

/* Worksheet I, Section A: wholly within the TTA, or all four amounts. */
function apportionmentOf(inputs: ResolverInputs): ApportionmentInputs | undefined {
  const raw = inputs.factByKey.get(CA_TTA_KEYS.apportionment) as
    Partial<CaTtaApportionmentFactValue> | undefined;
  if (raw === undefined || typeof raw.whollyWithinTta !== "boolean") return undefined;
  if (raw.whollyWithinTta) {
    return {
      whollyWithinTta: true,
      propertyCalifornia: 0,
      propertyTta: 0,
      payrollCalifornia: 0,
      payrollTta: 0,
    };
  }
  const amounts = [raw.propertyCalifornia, raw.propertyTta, raw.payrollCalifornia, raw.payrollTta];
  if (!amounts.every((amount) => amountOf(amount) !== undefined)) return undefined;
  const [propertyCalifornia, propertyTta, payrollCalifornia, payrollTta] = amounts as number[];
  return { whollyWithinTta: false, propertyCalifornia, propertyTta, payrollCalifornia, payrollTta };
}

const ownBusiness = (item: CaTtaIncomeItem) => CA_TTA_OWN_BUSINESS_LINES.includes(item.line);

/*
 * A row is complete with its line, a finite amount and, unless it is a row of
 * the taxpayer's own business, a percentage from 0 to 1.
 */
function itemComplete(item: Partial<CaTtaIncomeItem>): boolean {
  if (typeof item.amount !== "number" || !Number.isFinite(item.amount)) return false;
  if (item.line === undefined) return false;
  if (item.ttaPercentage !== undefined) return isShare(item.ttaPercentage);
  return ownBusiness(item as CaTtaIncomeItem);
}

/* Worksheet I, Section B, or undefined while a row is not complete. */
function incomeItemsOf(inputs: ResolverInputs): CaTtaIncomeItem[] | undefined {
  const raw = inputs.factByKey.get(CA_TTA_KEYS.businessIncome) as
    Partial<CaTtaBusinessIncomeFactValue> | undefined;
  if (raw === undefined || !Array.isArray(raw.items)) return undefined;
  return raw.items.every(itemComplete) ? raw.items : undefined;
}

/* Worksheet II column (b): one row a year from 2001 to 2012; the rows above 0. */
function nolRowsOf(inputs: ResolverInputs): NolRow[] | undefined {
  const raw = inputs.factByKey.get(CA_TTA_KEYS.nolCarryovers) as
    Partial<CaTtaNolCarryoversFactValue> | undefined;
  if (raw === undefined || !Array.isArray(raw.rows)) return undefined;
  const years = raw.rows.map((row) => row.lossYear);
  const valid = raw.rows.every(
    (row) =>
      Number.isInteger(row.lossYear) &&
      row.lossYear >= CA_TTA_FIRST_LOSS_YEAR &&
      row.lossYear <= CA_TTA_LAST_LOSS_YEAR &&
      amountOf(row.carryover) !== undefined,
  );
  if (!valid || new Set(years).size !== years.length) return undefined;
  return raw.rows.filter((row) => row.carryover > 0);
}

/*
 * The fact keys that put a TTA carryover on the return: a credit carryover or
 * an NOL carryover above 0. Schedule P (540) counts the credit (creditCount.ts).
 */
export function ttaCarryoverFactKeys(inputs: ResolverInputs): string[] {
  const nol = nolRowsOf(inputs) ?? [];
  return [
    ...((num(inputs, CA_TTA_KEYS.hiringCreditCarryover) ?? 0) > 0
      ? [CA_TTA_KEYS.hiringCreditCarryover]
      : []),
    ...((num(inputs, CA_TTA_KEYS.salesUseTaxCreditCarryover) ?? 0) > 0
      ? [CA_TTA_KEYS.salesUseTaxCreditCarryover]
      : []),
    ...(nol.length > 0 ? [CA_TTA_KEYS.nolCarryovers] : []),
  ];
}

/* The credit carryover keys above 0: code 210 is one credit on Schedule P (540). */
export function ttaCreditFactKeys(inputs: ResolverInputs): string[] {
  return ttaCarryoverFactKeys(inputs).filter((key) => key !== CA_TTA_KEYS.nolCarryovers);
}

/* The answers the form reads that are missing or not complete. */
function missingOf(tta: TtaInputs): string[] {
  const items = tta.incomeItems;
  const needsSectionA =
    tta.business?.role === "operator" ||
    (items ?? []).some((item) => item.ttaPercentage === undefined);
  return [
    ...(tta.business === undefined ? [CA_TTA_KEYS.business] : []),
    ...(needsSectionA && tta.apportionment === undefined ? [CA_TTA_KEYS.apportionment] : []),
    ...(items === undefined ? [CA_TTA_KEYS.businessIncome] : []),
    ...(tta.hiringCarryover === undefined ? [CA_TTA_KEYS.hiringCreditCarryover] : []),
    ...(tta.salesCarryover === undefined ? [CA_TTA_KEYS.salesUseTaxCreditCarryover] : []),
    ...(tta.nolRows === undefined ? [CA_TTA_KEYS.nolCarryovers] : []),
  ];
}

/*
 * Who files: "To claim any TTA NOL carryover deduction or credit carryover,
 * attach a completed form FTB 3809 to your California tax return"
 * (ca-3809-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b01).
 * The TTA expired at the end of 2012, so a carryover from last year is the
 * only way in (::expired-tta::b01): the form files with a California return
 * and a credit or NOL carryover above 0, also in a year with no TTA business
 * income, which carries them on (QUESTIONS.md). The explicit decision still wins.
 */
export function resolve3809Info(inputs: ResolverInputs): Form3809FilingInfo {
  const filesCalifornia =
    inputs.decisionByKey.get(MUST_FILE_540_KEY) === true ||
    inputs.decisionByKey.get(MUST_FILE_540NR_KEY) === true;
  const keys = ttaCarryoverFactKeys(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: a California return (${filesCalifornia}) with ${keys.length} TTA carryover(s) above 0`,
        value: filesCalifornia && keys.length > 0,
        triggeredByFactKeys: keys,
        triggeredByDecisionKeys: [MUST_FILE_540_KEY, MUST_FILE_540NR_KEY],
      },
    ],
  });
  if (resolution.value !== true) {
    return { mustFile: { "form-3809": resolution }, missingInputs: { "form-3809": [] } };
  }
  const hiringCarryover = amountOf(num(inputs, CA_TTA_KEYS.hiringCreditCarryover));
  const tta: TtaInputs = {
    business: businessOf(inputs, hiringCarryover),
    apportionment: apportionmentOf(inputs),
    incomeItems: incomeItemsOf(inputs),
    hiringCarryover,
    salesCarryover: amountOf(num(inputs, CA_TTA_KEYS.salesUseTaxCreditCarryover)),
    nolRows: nolRowsOf(inputs),
  };
  return {
    mustFile: { "form-3809": resolution },
    missingInputs: { "form-3809": missingOf(tta) },
    tta,
  };
}
