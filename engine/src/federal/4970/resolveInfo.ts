import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form4970Copies, hasForeignTrustDistribution } from "./copies.js";
import type { Form4970Copy, Form4970FilingInfo } from "./filingInfo.js";

const ONE_COPY =
  "Each trust files its own Form 4970 (irs-4970-form-2025::sec::purpose-of-form::b01); the engine prints one copy, so a return with more than one needs a preparer for the forms.";
const LATER_TRUSTS =
  "Accumulation distributions from more than one trust: line 13 of each later trust's form includes the amounts considered distributed by the earlier ones (irs-4970-form-2025::sec::line-13::b01), and the engine figures one trust at a time.";
const NO_FACT =
  "Form 4970 files by decision, but no trust fact holds the trustee's Schedule J (Form 1041) Part IV.";
const FOREIGN_TRUST =
  "A foreign trust's accumulation distribution and its partial tax go on Form 3520 (irs-4970-form-2025::sec::who-must-file::b01, irs-3520-inst-2025::sec::line-49::b01), which the engine does not have.";

/* Schedule 2 line 17l: the copies' tax, or why it is not known; neither while a copy waits. */
function taxOf(
  copies: Form4970Copy[],
  foreign: boolean,
): Pick<Form4970FilingInfo, "form4970Tax" | "form4970TaxGap"> {
  if (foreign) return { form4970TaxGap: FOREIGN_TRUST };
  if (copies.length === 0) return { form4970TaxGap: NO_FACT };
  if (copies.length > 1) return { form4970TaxGap: LATER_TRUSTS };
  const { result } = copies[0];
  if (result.kind === "gap") return { form4970TaxGap: result.reason };
  if (result.kind === "waits") return {};
  const gap = result.partIIGap ?? result.line28Gap;
  return gap === undefined ? { form4970Tax: result.lines.tax } : { form4970TaxGap: gap };
}

/*
 * Who files: "Beneficiaries who received an accumulation distribution from
 * certain domestic trusts that were created before March 1, 1984, must file
 * Form 4970" (irs-4970-form-2025::sec::who-must-file::b01). A trust fact of such
 * a trust with a throwback year files it; a foreign trust's goes on Form 3520
 * instead ("Don't file Form 4970 for distributions from any foreign trusts").
 * The explicit decision still wins.
 */
export function resolve4970Info(inputs: ResolverInputs): Form4970FilingInfo {
  const copies = form4970Copies(inputs);
  const foreign = hasForeignTrustDistribution(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4970",
    fallbacks: [
      {
        rule: `fallback: ${copies.length} accumulation distribution(s) from a domestic trust created before March 1, 1984`,
        value: copies.length > 0,
        triggeredByFactKeys: copies.map((copy) => copy.factKey),
      },
    ],
  });
  const filed = { mustFile: { "form-4970": mustFile } };
  const tax = foreign ? taxOf(copies, foreign) : {};
  if (mustFile.value !== true) return { ...filed, ...tax };
  const missing = copies.flatMap((copy) =>
    copy.result.kind === "waits" ? copy.result.missing : [],
  );
  return {
    ...filed,
    missingInputs: { "form-4970": [...new Set(missing)] },
    form4970: copies.length === 1 ? copies[0] : undefined,
    form4970Gap: copies.length > 1 ? ONE_COPY : copies.length === 0 ? NO_FACT : undefined,
    form4970TrustCount: copies.length,
    ...taxOf(copies, foreign),
  };
}

/*
 * Whether Schedule 2 files for line 17l: a gap or a tax above 0 puts a line
 * there; undefined while the form waits; false when no Form 4970 files and no
 * foreign trust distribution is on record.
 */
export function form4970ReachesSchedule2(info: Form4970FilingInfo): boolean | undefined {
  if (info.form4970TaxGap !== undefined) return true;
  if (info.mustFile?.["form-4970"]?.value !== true) return false;
  return info.form4970Tax === undefined ? undefined : info.form4970Tax > 0;
}
