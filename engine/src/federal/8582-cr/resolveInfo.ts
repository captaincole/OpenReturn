import { SPOUSE_KEYS } from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { form3800SourcesOf } from "../3800/sources.js";
import type { Form8582CRFilingInfo } from "./filingInfo.js";
import { worksheetOf, type PassiveSource } from "./worksheets.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8582_cr";

/* A passive source with a credit, a transfer or a carryover: the form takes it (worksheets.ts). */
function hasPassiveCredit(source: PassiveSource): boolean {
  if (!source.passive) return false;
  if ("originYear" in source) return source.amount !== 0;
  return source.amount !== 0 || source.transfer !== undefined;
}

/*
 * A stated passive credit whose activity does not yet choose its worksheet:
 * the fact is asked again (the activity is part of it). A K-1 credit's
 * activity comes from the K-1 and its holding (3800/sources.ts).
 */
const activityMissing = (source: PassiveSource) =>
  source.activity === undefined ||
  (source.activity.publiclyTradedPartnership !== true &&
    worksheetOf(source.line, source.activity, false) === undefined);

/*
 * Who files: "Form 8582-CR is filed by individuals, estates, and trusts with
 * any of the following credits from passive activities. • General business
 * credits." (irs-8582cr-inst-2025::sec::who-must-file::b01). The credits are
 * Form 3800's passive sources: a stated credit or carryover marked passive, or
 * a K-1 credit of a passive activity. The qualified plug-in electric vehicle
 * credit (Form 8834) is carried forward only and has no fact. The explicit
 * decision still wins.
 */
export function resolve8582CRInfo(inputs: ResolverInputs): Form8582CRFilingInfo {
  const { sources } = form3800SourcesOf(inputs);
  const passive: PassiveSource[] = [
    ...sources.current.map((source) => source.credit),
    ...sources.carryovers,
  ].filter(hasPassiveCredit);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${passive.length} passive general business credit(s) or prior year unallowed credit(s)`,
        value: passive.length > 0,
        triggeredByFactKeys: [...new Set(passive.map((source) => source.key))],
      },
    ],
  });
  const filed = { mustFile: { "form-8582-cr": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8582-cr": [] } };
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  const livedApart = inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear) as boolean | undefined;
  const missingActivities = passive.filter(activityMissing).map((source) => source.key);
  return {
    ...filed,
    missingInputs: {
      "form-8582-cr": missingInputs({
        ...Object.fromEntries(missingActivities.map((key) => [key, undefined])),
        // The MFS caution: living with the spouse at any time skips Parts II to IV (face-part-i::b02).
        ...(separate ? { [SPOUSE_KEYS.livedApartAllYear]: livedApart } : {}),
      }),
    },
  };
}
