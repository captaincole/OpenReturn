import {
  CA_ENTERPRISE_ZONE_KEYS,
  ENTERPRISE_ZONE_FIRST_LOSS_YEAR,
  ENTERPRISE_ZONE_LAST_LOSS_YEAR,
  readCaEnterpriseZoneNolCarryovers,
  type CaEnterpriseZoneApportionment,
  type CaEnterpriseZoneBusinessFactValue,
  type CaEnterpriseZoneIncomeItem,
  type CaEnterpriseZoneIncomeLine,
  type CaEnterpriseZoneNolCarryover,
} from "../../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { EnterpriseZoneBusiness, Form3805ZFilingInfo } from "./filingInfo.js";
import type { SectionAAmounts } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3805z";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";
const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";

const amountOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const countOf = (value: unknown) => {
  const amount = amountOf(value);
  return amount !== undefined && amount >= 0 ? amount : undefined;
};
const filled = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
const isShare = (value: unknown) => {
  const share = amountOf(value);
  return share !== undefined && share >= 0 && share <= 1;
};

/* The rows whose column (b) the taxpayer states: the time worked in the zone, or the entity's percentage. */
const STATED_SHARE_LINES: ReadonlySet<CaEnterpriseZoneIncomeLine> = new Set([
  "wages",
  "employee_business_expenses",
  "pass_through",
]);
const OWN_BUSINESS_LINES: ReadonlySet<CaEnterpriseZoneIncomeLine> = new Set([
  "schedule_c",
  "schedule_e",
  "schedule_f",
  "other_business",
  "schedule_d",
  "schedule_d1",
]);

/* Worksheet I, Section A from the fact; undefined while an amount is missing. */
function sectionAOf(
  apportionment: CaEnterpriseZoneApportionment | undefined,
): SectionAAmounts | "entirely_within_zone" | undefined {
  if (apportionment === undefined) return undefined;
  if (apportionment.entirelyWithinZone === true) return "entirely_within_zone";
  const amounts = {
    ownedPropertyCalifornia: countOf(apportionment.ownedPropertyCalifornia),
    ownedPropertyZone: countOf(apportionment.ownedPropertyZone),
    netAnnualRentCalifornia: countOf(apportionment.netAnnualRentCalifornia),
    netAnnualRentZone: countOf(apportionment.netAnnualRentZone),
    payrollCalifornia: countOf(apportionment.payrollCalifornia),
    payrollZone: countOf(apportionment.payrollZone),
  };
  return Object.values(amounts).every((amount) => amount !== undefined)
    ? (amounts as SectionAAmounts)
    : undefined;
}

/* A row is complete with its amount, and its column (b) when no Section A gives it. */
function rowComplete(item: CaEnterpriseZoneIncomeItem, hasSectionA: boolean): boolean {
  if (amountOf(item.amount) === undefined) return false;
  if (STATED_SHARE_LINES.has(item.line)) return isShare(item.zoneShare);
  if (OWN_BUSINESS_LINES.has(item.line)) return hasSectionA || isShare(item.zoneShare);
  return false;
}

/* The operator's items E to H; undefined while one is missing. */
function operatorItems(raw: Partial<CaEnterpriseZoneBusinessFactValue>) {
  const items = {
    activityCode: filled(raw.activityCode),
    employeesInZone: countOf(raw.employeesInZone),
    grossReceipts: countOf(raw.grossReceipts),
    totalAssetValue: countOf(raw.totalAssetValue),
  };
  return Object.values(items).every((item) => item !== undefined) ? items : undefined;
}

/* The business fact, or undefined while an answer inside it is missing. */
export function businessOf(value: unknown): EnterpriseZoneBusiness | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const raw = value as Partial<CaEnterpriseZoneBusinessFactValue>;
  const name = filled(raw.businessName);
  const address = filled(raw.businessAddress);
  const zoneName = filled(raw.zoneName);
  const role = raw.role === "operator" || raw.role === "investor" ? raw.role : undefined;
  const items = Array.isArray(raw.incomeItems) ? raw.incomeItems : undefined;
  if (!name || !address || !zoneName || !role || !items) return undefined;
  const sectionA = sectionAOf(raw.apportionment);
  if (raw.apportionment !== undefined && sectionA === undefined) return undefined;
  if (!items.every((item) => rowComplete(item, sectionA !== undefined))) return undefined;
  const operator = role === "operator" ? operatorItems(raw) : {};
  if (operator === undefined || (role === "operator" && sectionA === undefined)) return undefined;
  return {
    name,
    address,
    zoneName,
    role,
    ...operator,
    sectionA,
    incomeItems: items,
    throughDisregardedEntity: raw.throughDisregardedEntity === true,
  };
}

/* The NOL rows, or undefined while the answer is missing or a row is outside 2001 to 2013. */
function nolCarryoversOf(inputs: ResolverInputs): CaEnterpriseZoneNolCarryover[] | undefined {
  const rows = readCaEnterpriseZoneNolCarryovers(
    inputs.factByKey.get(CA_ENTERPRISE_ZONE_KEYS.nolCarryovers),
  );
  const inRange = (row: CaEnterpriseZoneNolCarryover) =>
    row.yearOfLoss >= ENTERPRISE_ZONE_FIRST_LOSS_YEAR &&
    row.yearOfLoss <= ENTERPRISE_ZONE_LAST_LOSS_YEAR &&
    row.amount >= 0;
  return rows !== undefined && rows.every(inRange) ? rows : undefined;
}

/* The carryover facts above 0: each puts a carryover on the return to claim. */
export function enterpriseZoneCarryoverKeys(inputs: ResolverInputs): string[] {
  const hiring = (num(inputs, CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover) ?? 0) > 0;
  const sales = (num(inputs, CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover) ?? 0) > 0;
  const nol = (nolCarryoversOf(inputs) ?? []).some((row) => row.amount > 0);
  return [
    ...(hiring ? [CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover] : []),
    ...(sales ? [CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover] : []),
    ...(nol ? [CA_ENTERPRISE_ZONE_KEYS.nolCarryovers] : []),
  ];
}

/* A hiring or sales or use tax credit carryover above 0: one credit, code 176, for Schedule P (540). */
export function enterpriseZoneCreditKeys(inputs: ResolverInputs): string[] {
  return enterpriseZoneCarryoverKeys(inputs).filter(
    (key) => key !== CA_ENTERPRISE_ZONE_KEYS.nolCarryovers,
  );
}

/*
 * Who files: "To claim any EZ carryover deduction or credit carryover, attach
 * a completed form FTB 3805Z to your California tax return"
 * (ca-3805z-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b01).
 * The form files with a California return and a hiring credit, sales or use
 * tax credit or EZ NOL carryover above 0. The explicit decision still wins.
 * The business fact is asked once it files: it holds the income the
 * carryovers are limited by.
 */
export function resolve3805ZInfo(inputs: ResolverInputs): Form3805ZFilingInfo {
  const filesCalifornia =
    inputs.decisionByKey.get(MUST_FILE_540_KEY) === true ||
    inputs.decisionByKey.get(MUST_FILE_540NR_KEY) === true;
  const keys = enterpriseZoneCarryoverKeys(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: a California return (${filesCalifornia}) with ${keys.length} enterprise zone carryover(s) above 0`,
        value: filesCalifornia && keys.length > 0,
        triggeredByFactKeys: keys,
        triggeredByDecisionKeys: [MUST_FILE_540_KEY, MUST_FILE_540NR_KEY],
      },
    ],
  });
  if (resolution.value !== true) {
    return { mustFile: { "form-3805z": resolution }, missingInputs: { "form-3805z": [] } };
  }
  const inputsOfForm = {
    business: businessOf(inputs.factByKey.get(CA_ENTERPRISE_ZONE_KEYS.business)),
    hiringCarryover: countOf(num(inputs, CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover)),
    salesTaxCarryover: countOf(num(inputs, CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover)),
    nolCarryovers: nolCarryoversOf(inputs),
  };
  const missing: Array<[unknown, string]> = [
    [inputsOfForm.business, CA_ENTERPRISE_ZONE_KEYS.business],
    [inputsOfForm.hiringCarryover, CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover],
    [inputsOfForm.salesTaxCarryover, CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover],
    [inputsOfForm.nolCarryovers, CA_ENTERPRISE_ZONE_KEYS.nolCarryovers],
  ];
  return {
    mustFile: { "form-3805z": resolution },
    missingInputs: {
      "form-3805z": missing.filter(([value]) => value === undefined).map(([, key]) => key),
    },
    enterpriseZone: inputsOfForm,
  };
}
