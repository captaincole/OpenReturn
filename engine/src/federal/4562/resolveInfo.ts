import { businessesOnReturn, rentalsOnReturn } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form4562Activity, Form4562FilingInfo } from "./filingInfo.js";
import { assetsAwaitingAnswers, mustFile4562 } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_4562";

/*
 * The businesses, then the rentals, of this return that have depreciation
 * answers (the business and rental facts' `depreciation`). A spouse's activity
 * is on this return only when filing jointly, as for Schedules C and E.
 */
export function depreciationActivities(inputs: ResolverInputs): Form4562Activity[] {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const businesses = businessesOnReturn(inputs.facts, joint).businesses.flatMap(({ key, value }) =>
    value.depreciation
      ? [{ factKey: key, name: value.name ?? value.activity, depreciation: value.depreciation }]
      : [],
  );
  const rentals = rentalsOnReturn(inputs.facts, joint).properties.flatMap(({ key, value }) =>
    value.depreciation
      ? [
          {
            factKey: key,
            name: value.address?.street ?? "Rental property",
            depreciation: value.depreciation,
          },
        ]
      : [],
  );
  return [...businesses, ...rentals];
}

/*
 * irs-4562-inst-2025::sec::who-must-file::b01: a separate Form 4562 for each
 * business or activity that claims depreciation of property placed in service in
 * 2025, a section 179 deduction, listed property or amortization that begins in
 * 2025 (lines.ts mustFile4562). Older depreciation or amortization alone needs no
 * form; the activity's line takes it directly. An asset placed in service after
 * January 19, 2025 waits for whether it was acquired after that date (line 14):
 * its business or rental fact is asked again.
 */
export function resolve4562Info(inputs: ResolverInputs): Form4562FilingInfo {
  const activities = depreciationActivities(inputs).filter((activity) =>
    mustFile4562(activity.depreciation),
  );
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${activities.length} business or rental with 2025 assets, a section 179 carryover or amortization that begins in 2025`,
        value: activities.length > 0,
        triggeredByFactKeys: activities.map((activity) => activity.factKey),
      },
    ],
  });
  const waiting = activities.filter(
    (activity) => assetsAwaitingAnswers(activity.depreciation).length > 0,
  );
  return {
    mustFile: { "form-4562": resolution },
    missingInputs: {
      "form-4562": missingInputs(
        Object.fromEntries(waiting.map((activity) => [activity.factKey, undefined])),
      ),
    },
    form4562Activities: activities,
  };
}
