import {
  CA_PTE_CREDIT_CARRYOVER_KEY,
  getCaPteElectiveCreditFacts,
  type CaPteElectiveCreditFact,
} from "../../../facts/index.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3804CRFilingInfo, PteCreditRow } from "./filingInfo.js";

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const filled = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

function rowOf(fact: CaPteElectiveCreditFact): PteCreditRow {
  const value = fact.value ?? ({} as Partial<CaPteElectiveCreditFact["value"]>);
  return {
    factKey: fact.key,
    entityName: filled(value.entityName),
    entityId: filled(value.entityId),
    credit: finite(value.credit),
    throughDisregardedSmllc: value.throughDisregardedSmllc === true,
  };
}

const complete = (row: PteCreditRow) =>
  row.entityName !== undefined && row.entityId !== undefined && row.credit !== undefined;

/*
 * Who files: a qualified taxpayer claims the credit on this form, attached to
 * Form 540, Form 540NR or Form 541 (ca-3804cr-inst-2025::sec::a-purpose::b01),
 * and an unused credit carries forward five years
 * (ca-3804cr-inst-2025::sec::f-carryover::b01). The form files with a California
 * return that has an electing entity's credit above 0 (a credit not stated yet
 * counts, so it is asked) or a carryover from 2024 above 0. A stated credit of 0
 * is no row. The explicit decision still wins.
 */
export function resolve3804CRInfo(inputs: ResolverInputs): Form3804CRFilingInfo {
  const filesCalifornia =
    inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true ||
    inputs.decisionByKey.get("decisions.scope.must_file_540nr") === true;
  const rows = getCaPteElectiveCreditFacts(inputs.facts)
    .map(rowOf)
    .filter((row) => row.credit === undefined || row.credit > 0);
  const carryover = num(inputs, CA_PTE_CREDIT_CARRYOVER_KEY);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3804_cr",
    fallbacks: [
      {
        rule: `fallback: a California return (${filesCalifornia}) with ${rows.length} electing entity credit(s) or a 2024 carryover ($${carryover ?? 0}) above 0`,
        value: filesCalifornia && (rows.length > 0 || (carryover ?? 0) > 0),
        triggeredByFactKeys: [...rows.map((row) => row.factKey), CA_PTE_CREDIT_CARRYOVER_KEY],
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_ca_540",
          "decisions.scope.must_file_540nr",
        ],
      },
    ],
  });
  const files = resolution.value === true;
  return {
    mustFile: { "form-3804-cr": resolution },
    /* Each row while an answer inside it is missing, and line 2 always. */
    missingInputs: {
      "form-3804-cr": files
        ? [
            ...rows.filter((row) => !complete(row)).map((row) => row.factKey),
            ...(carryover === undefined ? [CA_PTE_CREDIT_CARRYOVER_KEY] : []),
          ]
        : [],
    },
    pteCreditRows: files ? rows : [],
    pteCreditCarryover: files ? carryover : undefined,
  };
}
