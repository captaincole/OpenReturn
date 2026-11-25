import { readInstallmentSaleFacts } from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6252FilingInfo } from "./filingInfo.js";
import { form6252Totals, type Form6252Totals } from "./totals.js";

const MUST_FILE_KEY = "decisions.scope.must_file_6252";

const NO_FACTS = "Form 6252 files by decision, but no installment sale fact gives its amounts.";

/*
 * Who files: "File Form 6252 for the year of the disposition and all subsequent
 * years, regardless of whether a payment is received in such year, until and
 * including the year final payment is received"
 * (irs-6252-form-2025::sec::purpose-of-form::b01). An installment sale fact is
 * a sale reported on the installment method, so it files the form; the explicit
 * decision still wins. A sale with no gain (line 14 zero or less) still files
 * here, with its lines a gap, so the sale is not dropped (sale.ts).
 */
function mustFile6252(inputs: ResolverInputs) {
  const read = readInstallmentSaleFacts(inputs.facts);
  const keys = [...read.sales.map((sale) => sale.key), ...read.malformedKeys];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} installment sale fact(s)`,
        value: keys.length > 0,
        triggeredByFactKeys: keys,
      },
    ],
  });
  return { resolution, read, keys };
}

/* The return's Forms 6252 and their amounts; undefined when the form does not file. */
export function form6252TotalsOf(inputs: ResolverInputs): Form6252Totals | undefined {
  const { resolution, read, keys } = mustFile6252(inputs);
  if (resolution.value !== true) return undefined;
  const gap =
    (keys.length === 0 ? NO_FACTS : undefined) ??
    (read.malformedKeys.length > 0
      ? `Malformed installment sale fact(s): ${read.malformedKeys.join(", ")}.`
      : undefined);
  return form6252Totals(read.sales, filingStatusOf(inputs) === "married_filing_jointly", gap);
}

export function resolve6252Info(inputs: ResolverInputs): Form6252FilingInfo {
  const { resolution } = mustFile6252(inputs);
  const totals = form6252TotalsOf(inputs);
  const waiting = (totals?.forms ?? []).filter((form) => form.waits !== undefined);
  return {
    mustFile: { "form-6252": resolution },
    form6252Totals: totals,
    missingInputs: { "form-6252": waiting.map((form) => form.key) },
  };
}
