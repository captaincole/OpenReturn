/*
 * Schedule CA (540) Part I, Section B line 4, other gains or losses. Column A is
 * federal Schedule 1 line 4 (Form 4797 line 18b). "Generally, no adjustments are
 * made on this line. However, the California basis of your other assets may
 * differ ... Get Schedule D-1" (ca-540-sched-ca-inst-2025::sec::line-4-other-gains-or-losses::b01):
 * column B takes Schedule D-1 line 21a, column C line 21b
 * (ca-540-sched-d1-inst-2025::sec::part-ii::b03). Without Form 4797 each column
 * keeps the reason it had: Schedule 1 line 4 is unsupported then too.
 */

import type { FormSpec } from "../../../defineForm.js";
import { form4797Files, scheduleOneLine4 } from "../../../federal/4797/receivers.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

const NO_FORM_4797_FEDERAL =
  "Other gains/losses (Sch CA Section B line 4 col A) comes from federal Schedule 1 line 4 (Form 4797 gains/losses); federal Schedule 1 is not an ingested form and we have no Form 4797 fact ingestion path.";
const NO_FORM_4797_SUBTRACTIONS =
  "Other gains/losses CA subtractions (Sch CA Section B line 4 col B) require CA-specific basis and depreciation adjustments for Form 4797 transactions; no ingestion path for Schedule 1 or Form 4797 yet.";
const NO_FORM_4797_ADDITIONS =
  "Other gains/losses CA additions (Sch CA Section B line 4 col C) require CA-specific basis adjustments for Form 4797 transactions; no ingestion path for Schedule 1 or Form 4797 yet.";

const scheduleD1Files = (info: ScheduleCaFilingInfo): boolean =>
  info.mustFile?.["schedule-d-1"]?.value === true;

/*
 * Column B or C: Schedule D-1 line 21a or 21b; blank while Schedule D-1 does not
 * file (no difference). An FTB 3805E amount bound for Schedule D-1 is a gap, filed
 * or not: Schedule D-1 does not take it (3805e/totals.ts).
 */
function adjustment(info: ScheduleCaFilingInfo, pick: "line21a" | "line21b", noForm4797: string) {
  const installmentGap = info.form3805ETotals?.scheduleD1Gap;
  if (installmentGap) return unsupported(installmentGap);
  if (!form4797Files(info) && !scheduleD1Files(info)) return unsupported(noForm4797);
  if (!scheduleD1Files(info)) return undefined;
  const gap = info.scheduleD1Gap ?? info.scheduleD1SummaryGap;
  if (gap) return unsupported(`Schedule D-1: ${gap}`);
  return info.scheduleD1?.[pick];
}

export const otherGainsBindings: Bindings = {
  "0.line.b4_federal": (_, info) =>
    form4797Files(info) ? scheduleOneLine4(info) : unsupported(NO_FORM_4797_FEDERAL),
  "0.line.b4_subtractions": (_, info) => adjustment(info, "line21a", NO_FORM_4797_SUBTRACTIONS),
  "0.line.b4_additions": (_, info) => adjustment(info, "line21b", NO_FORM_4797_ADDITIONS),
};
