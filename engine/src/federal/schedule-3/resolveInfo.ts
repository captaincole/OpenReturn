import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve1116Info } from "../1116/resolveInfo.js";
import { resolve2441Info } from "../2441/resolveInfo.js";
import { resolve3800Info } from "../3800/resolveInfo.js";
import { resolve4136Info } from "../4136/resolveInfo.js";
import { resolve5695Info } from "../5695/resolveInfo.js";
import { resolve8396Info } from "../8396/resolveInfo.js";
import { resolve8801Info } from "../8801/resolveInfo.js";
import { resolve8834Info } from "../8834/resolveInfo.js";
import { resolve8839Info } from "../8839/resolveInfo.js";
import { resolve8863Info } from "../8863/resolveInfo.js";
import { resolve8880Info } from "../8880/resolveInfo.js";
import { refuelingBusinessCredit, refuelingPersonalPart } from "../8911/resolveInfo.js";
import { cleanVehicleBusinessCredit, cleanVehicleSchedules } from "../8936/resolveInfo.js";
import { reportingYearTax } from "../8978/receivers.js";
import { resolve8978Info } from "../8978/resolveInfo.js";
import { k1KeysWithRoute } from "../passThrough/receipts.js";
import { resolveScheduleRInfo } from "../schedule-r/resolveInfo.js";
import type { Schedule3FilingInfo } from "./filingInfo.js";

/* Line 6l takes a negative Form 8978 line 14 (irs-1040-inst-2025::sec::line-6l::b01). */
function negativeForm8978(inputs: ResolverInputs): boolean {
  const total = reportingYearTax(resolve8978Info(inputs));
  return total.kind === "amount" && total.value < 0;
}

export function resolveSchedule3Info(inputs: ResolverInputs): Schedule3FilingInfo {
  const form5695 = resolve5695Info(inputs).mustFile?.["form-5695"]?.value === true;
  const form2441 = resolve2441Info(inputs).mustFile?.["form-2441"]?.value === true;
  const scheduleR = resolveScheduleRInfo(inputs).mustFile?.["schedule-r"]?.value === true;
  const form8839 = resolve8839Info(inputs);
  const adoptionCredit =
    form8839.mustFile?.["form-8839"]?.value === true && form8839.adoptionPartII === "applies";
  const form8396 = resolve8396Info(inputs).mustFile?.["form-8396"]?.value === true;
  const form8880 = resolve8880Info(inputs).mustFile?.["form-8880"]?.value === true;
  const form8863 = resolve8863Info(inputs).mustFile?.["form-8863"]?.value === true;
  const form8801 = resolve8801Info(inputs).mustFile?.["form-8801"]?.value === true;
  const form8834 = resolve8834Info(inputs).mustFile?.["form-8834"]?.value === true;
  // A K-1's foreign taxes (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02).
  const foreignTaxK1Keys = k1KeysWithRoute(inputs, "schedule_3_line_1");
  const form1116 = resolve1116Info(inputs);
  const foreignTaxCredit =
    form1116.mustFile?.["form-1116"]?.value === true || form1116.foreignTax?.election === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_3",
    fallbacks: [
      {
        rule: "fallback: Form 1116, or the election to claim the credit without it (line 1)",
        value: foreignTaxCredit,
      },
      { rule: "fallback: Form 5695 (line 5b) is required", value: form5695 },
      { rule: "fallback: Form 2441 (line 2) is required", value: form2441 },
      { rule: "fallback: Schedule R (line 6d) is required", value: scheduleR },
      { rule: "fallback: Form 8839 Part II (line 6c) applies", value: adoptionCredit },
      { rule: "fallback: Form 8396 (line 6g) is required", value: form8396 },
      { rule: "fallback: Form 8880 (line 4) is required", value: form8880 },
      { rule: "fallback: Form 8863 (line 3) is required", value: form8863 },
      { rule: "fallback: Form 8801 (line 6b) is required", value: form8801 },
      { rule: "fallback: Form 8834 (line 6i) is required", value: form8834 },
      {
        rule: "fallback: Form 8936 (lines 6f, 6m) has a vehicle that kept its credit",
        value: cleanVehicleSchedules(inputs).personalCredit,
      },
      {
        rule: "fallback: Form 8936 has a business credit (line 6a, through Form 3800)",
        value: cleanVehicleBusinessCredit(inputs),
      },
      /*
       * Form 8911: a property at the main home (line 6j), or a business credit (line 6a,
       * through Form 3800). The resolver cannot see the tax limit, so Schedule 3 may
       * file with line 6j blank (KNOWN GAP, as for lines 6f and 6m).
       */
      {
        rule: "fallback: Form 8911 has a personal use part (line 6j)",
        value: refuelingPersonalPart(inputs),
      },
      {
        rule: "fallback: Form 8911 or a K-1 has a refueling property business credit (line 6a, through Form 3800)",
        value: refuelingBusinessCredit(inputs),
      },
      {
        rule: "fallback: Form 3800 files with a general business credit or carryover (line 6a)",
        value: resolve3800Info(inputs).mustFile?.["form-3800"]?.value === true,
      },
      {
        rule: "fallback: a Schedule K-1 reports foreign taxes (line 1, Form 1116)",
        value: foreignTaxK1Keys.length > 0,
        triggeredByFactKeys: foreignTaxK1Keys,
      },
      {
        rule: "fallback: Form 8978 line 14 is negative (line 6l)",
        value: negativeForm8978(inputs),
      },
      {
        rule: "fallback: Form 4136 (line 12) is required",
        value: resolve4136Info(inputs).mustFile?.["form-4136"]?.value === true,
      },
    ],
  });
  return { mustFile: { "schedule-3": resolution } };
}
