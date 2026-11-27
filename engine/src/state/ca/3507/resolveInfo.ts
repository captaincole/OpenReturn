import {
  CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY,
  CA_PRISON_INMATE_LABOR_KEYS,
  getCaPrisonInmateLaborPassThroughFacts,
  type CaPrisonInmateLaborPassThroughFact,
  type CaPrisonInmateWagesFactValue,
} from "../../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3507FilingInfo, PrisonLaborPassThroughRow } from "./filingInfo.js";
import { BUSINESS_CREDIT_LIMIT, line5 } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3507";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";
const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
const filled = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

function rowOf(fact: CaPrisonInmateLaborPassThroughFact): PrisonLaborPassThroughRow {
  const value = fact.value ?? ({} as Partial<CaPrisonInmateLaborPassThroughFact["value"]>);
  return {
    factKey: fact.key,
    entityName: filled(value.entityName),
    entityId: filled(value.entityId),
    credit: finite(value.credit),
    throughDisregardedSmllc: value.throughDisregardedSmllc === true,
  };
}

const complete = (row: PrisonLaborPassThroughRow) =>
  row.entityName !== undefined && row.entityId !== undefined && row.credit !== undefined;

/* The pass-through credits above 0, or not stated yet. A stated credit of 0 is no row. */
const passThroughRowsOf = (inputs: ResolverInputs) =>
  getCaPrisonInmateLaborPassThroughFacts(inputs.facts)
    .map(rowOf)
    .filter((row) => row.credit === undefined || row.credit > 0);

/* Line 1's fact: the wages, or undefined while it is missing or not complete. */
function wagesOf(inputs: ResolverInputs): {
  wages?: number;
  throughSmllc: boolean;
  stated: boolean;
} {
  const raw = inputs.factByKey.get(CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages) as
    Partial<CaPrisonInmateWagesFactValue> | undefined;
  return {
    wages: finite(raw?.wages),
    throughSmllc: raw?.throughDisregardedSmllc === true,
    stated: raw !== undefined,
  };
}

/*
 * The fact keys that put a prison inmate labor credit on the return: wages
 * above 0 (or a wages fact not complete), a pass-through credit row, or a 2024
 * carryover above 0. Schedule P (540) reads them: a Section A1 credit attaches it.
 */
export function prisonLaborCreditFactKeys(inputs: ResolverInputs): string[] {
  const wages = wagesOf(inputs);
  const hasWages = wages.stated && (wages.wages === undefined || wages.wages > 0);
  const carryover = (num(inputs, CA_PRISON_INMATE_LABOR_KEYS.carryover) ?? 0) > 0;
  return [
    ...(hasWages ? [CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages] : []),
    ...passThroughRowsOf(inputs).map((row) => row.factKey),
    ...(carryover ? [CA_PRISON_INMATE_LABOR_KEYS.carryover] : []),
  ];
}

/* Line 5 from the facts, or undefined while an amount waits. */
function availableCredit(
  wages: number | undefined,
  rows: readonly PrisonLaborPassThroughRow[],
  carryover: number | undefined,
): number | undefined {
  const credits = rows.map((row) => row.credit);
  if (wages === undefined || carryover === undefined) return undefined;
  if (credits.some((credit) => credit === undefined)) return undefined;
  return line5(wages, credits as number[], carryover);
}

/*
 * Who files: an employer who paid wages to inmates under an approved joint
 * venture, or a shareholder, beneficiary, partner or member who received the
 * credit on a Schedule K-1 (ca-3507-form-2025::sec::a-purpose::b01), attached
 * to the California return (the form's heading), and a taxpayer with a
 * carryover from 2024 (line 4). The form files with a California return that
 * has one of these above 0 (one not stated yet counts, so it is asked). The
 * explicit decision still wins.
 */
export function resolve3507Info(inputs: ResolverInputs): Form3507FilingInfo {
  const filesCalifornia =
    inputs.decisionByKey.get(MUST_FILE_540_KEY) === true ||
    inputs.decisionByKey.get(MUST_FILE_540NR_KEY) === true;
  const keys = prisonLaborCreditFactKeys(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: a California return (${filesCalifornia}) with ${keys.length} prison inmate labor credit input(s) above 0`,
        value: filesCalifornia && keys.length > 0,
        triggeredByFactKeys: keys,
        triggeredByDecisionKeys: [MUST_FILE_540_KEY, MUST_FILE_540NR_KEY],
      },
    ],
  });
  const files = resolution.value === true;
  const wages = wagesOf(inputs);
  const rows = passThroughRowsOf(inputs);
  const carryover = num(inputs, CA_PRISON_INMATE_LABOR_KEYS.carryover);
  const election = inputs.factByKey.get(CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY);
  const elects = typeof election === "boolean" ? election : undefined;
  // The election matters only when line 5 is above the $5,000,000 limit (lines.ts, disallowedByLimit).
  const limitCanBind = (availableCredit(wages.wages, rows, carryover) ?? 0) > BUSINESS_CREDIT_LIMIT;
  return {
    mustFile: { "form-3507": resolution },
    /* Lines 1 and 4 always, each row while an answer inside it is missing, and the election when it matters. */
    missingInputs: {
      "form-3507": files
        ? [
            ...(wages.wages === undefined ? [CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages] : []),
            ...rows.filter((row) => !complete(row)).map((row) => row.factKey),
            ...(carryover === undefined ? [CA_PRISON_INMATE_LABOR_KEYS.carryover] : []),
            ...(limitCanBind && elects === undefined
              ? [CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY]
              : []),
          ]
        : [],
    },
    prisonLaborWages: files ? wages.wages : undefined,
    prisonLaborWagesThroughSmllc: files && wages.throughSmllc,
    prisonLaborPassThroughRows: files ? rows : [],
    prisonLaborCarryover: files ? carryover : undefined,
    businessCreditRefundableElection: files ? elects : undefined,
  };
}
