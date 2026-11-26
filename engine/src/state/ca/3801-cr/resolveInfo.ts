import { getCaPassiveCreditFacts, SPOUSE_KEYS } from "../../../facts/index.js";
import { worksheetOf } from "../../../federal/8582-cr/worksheets.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { Form3801CRFilingInfo } from "./filingInfo.js";
import { caPassiveSourceOf, hasCredit, type CaPassiveSource } from "./sources.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3801_cr";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";
const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";

/* A row whose worksheet its activity does not choose yet (a 1990 or participation answer is missing). */
const worksheetOpen = (source: CaPassiveSource) =>
  source.activity !== undefined &&
  source.activity.publiclyTradedPartnership !== true &&
  worksheetOf(source.line, source.activity, false) === undefined;

/*
 * The California passive credits on the facts, one for each credit code with
 * an amount above 0 (a code is one credit on Schedule P (540)), with the fact
 * keys behind them. Schedule P (540) counts them to see whether it attaches.
 */
export function caPassiveCreditsClaimed(inputs: ResolverInputs): {
  codes: string[];
  factKeys: string[];
} {
  const claimed = getCaPassiveCreditFacts(inputs.facts).flatMap((fact) => {
    const source = caPassiveSourceOf(fact);
    return source !== undefined && hasCredit(source) ? [{ key: fact.key, code: source.code }] : [];
  });
  return {
    codes: [...new Set(claimed.map((each) => each.code))],
    factKeys: claimed.map((each) => each.key),
  };
}

/*
 * Who files: "Form FTB 3801-CR is filed by individuals ... with any of the
 * following credits from passive activities" (ca-3801cr-inst-2025::sec::c-who-must-file::b01),
 * attached to Form 540 or Form 540NR (the form's heading). The form files on a
 * California return with a passive credit fact above 0; a fact that is not
 * complete counts, so it is asked again. The explicit decision still wins.
 */
export function resolve3801CRInfo(inputs: ResolverInputs): Form3801CRFilingInfo {
  const california =
    inputs.decisionByKey.get(MUST_FILE_540_KEY) === true ||
    inputs.decisionByKey.get(MUST_FILE_540NR_KEY) === true;
  const rows = getCaPassiveCreditFacts(inputs.facts).map((fact) => ({
    key: fact.key,
    source: caPassiveSourceOf(fact),
  }));
  const credits = rows.filter((row) => row.source === undefined || hasCredit(row.source));
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: a California return (${california}) with ${credits.length} passive credit(s) above 0`,
        value: california && credits.length > 0,
        triggeredByFactKeys: credits.map((row) => row.key),
        triggeredByDecisionKeys: [MUST_FILE_540_KEY, MUST_FILE_540NR_KEY],
      },
    ],
  });
  const files = mustFile.value === true;
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  const livedApart = inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear);
  const asked = credits
    .filter((row) => row.source === undefined || worksheetOpen(row.source))
    .map((row) => row.key);
  return {
    mustFile: { "form-3801-cr": mustFile },
    missingInputs: {
      "form-3801-cr": files
        ? missingInputs({
            ...Object.fromEntries(asked.map((key) => [key, undefined])),
            // Line 9 and the worksheets: a separate return that lived with the spouse skips Part II (line-9::b01).
            ...(separate ? { [SPOUSE_KEYS.livedApartAllYear]: livedApart } : {}),
          })
        : [],
    },
    caPassiveCreditSources: files
      ? rows.flatMap((row) => (row.source === undefined ? [] : [row.source]))
      : [],
  };
}
