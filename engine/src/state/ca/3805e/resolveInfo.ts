import { readInstallmentSaleFacts } from "../../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { FILES_540_KEY, scheduleDCaMustFile } from "../schedule-d-ca/mustFile.js";
import type { Form3805EFilingInfo } from "./filingInfo.js";
import { differsThisYear } from "./sale.js";
import { form3805ETotals, type Form3805ETotals } from "./totals.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3805e";

const NO_FACTS = "FTB 3805E files by decision, but no installment sale fact gives its amounts.";

/*
 * Who files. "Use form FTB 3805E to report income from casual sales of real or
 * personal property other than inventory if you will receive any payments ...
 * in a taxable year after the year of sale" (ca-3805e-inst-2025::sec::purpose::b01),
 * and its line 26 goes to Schedule D (540) line 1 or Schedule D-1
 * (line-26-and-line-37::b01), which a resident files "only if there is a
 * difference between your California and federal capital gains and losses"
 * (ca-540-sched-d-inst-2025::sec::purpose::b01). So, with Form 540:
 * 1. a sale with a form this year states California amounts that differ from
 *    the federal ones (sale.ts); a malformed sale files too, so its gap shows;
 * 2. Schedule D (540) files for any reason and a capital asset sale needs its
 *    line 1 row.
 * The explicit decision still wins.
 */
function mustFile3805E(inputs: ResolverInputs) {
  const read = readInstallmentSaleFacts(inputs.facts);
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const differ = [
    ...read.sales.filter(({ key, value }) => differsThisYear(key, value)).map(({ key }) => key),
    ...read.malformedKeys,
  ];
  const scheduleD = scheduleDCaMustFile(inputs).value === true;
  const capital = read.sales
    .filter(({ value }) => value.use === "capital_asset")
    .map(({ key }) => key);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and ${differ.length} installment sale(s) state California amounts that are not the federal ones`,
        value: files540 && differ.length > 0,
        triggeredByFactKeys: differ,
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
      {
        rule: `fallback: Schedule D (540) files (${scheduleD}) and ${capital.length} installment sale(s) of a capital asset need a line 1 row`,
        value: scheduleD && capital.length > 0,
        triggeredByFactKeys: capital,
      },
    ],
  });
  return { resolution, read };
}

/* The return's Forms FTB 3805E and their amounts; undefined when the form does not file. */
export function form3805ETotalsOf(inputs: ResolverInputs): Form3805ETotals | undefined {
  const { resolution, read } = mustFile3805E(inputs);
  if (resolution.value !== true) return undefined;
  const noFacts = read.sales.length + read.malformedKeys.length === 0;
  const gap =
    (noFacts ? NO_FACTS : undefined) ??
    (read.malformedKeys.length > 0
      ? `Malformed installment sale fact(s): ${read.malformedKeys.join(", ")}.`
      : undefined);
  return form3805ETotals(read.sales, filingStatusOf(inputs) === "married_filing_jointly", gap);
}

export function resolve3805EInfo(inputs: ResolverInputs): Form3805EFilingInfo {
  const { resolution } = mustFile3805E(inputs);
  const totals = resolution.value === true ? form3805ETotalsOf(inputs) : undefined;
  const waiting = (totals?.forms ?? []).filter((form) => form.waits !== undefined);
  return {
    mustFile: { "form-3805e": resolution },
    form3805ETotals: totals,
    missingInputs: { "form-3805e": waiting.map((form) => form.key) },
  };
}
