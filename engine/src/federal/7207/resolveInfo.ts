import { readAdvancedManufacturingFacilityFacts } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { PASS_THROUGH_COPY, form7207Copies, type Form7207Copy } from "./copies.js";
import type { Form7207FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who produced eligible components in the United States
 * and sold them in a trade or business, one form for each facility
 * (irs-7207-inst-2025::sec::general-instructions::b01): a facility fact turns
 * it on. A partner, shareholder or beneficiary whose only source is a K-1
 * "don't need to file Form 7207" and reports the credit on Form 3800 Part III
 * line 1b (line-7::b01), so a K-1 alone does not; with a facility, the K-1
 * credits go on a separate Form 7207 (copies.ts). A malformed facility fact
 * counts too: the facility is stated, so the form waits for the whole fact.
 * The explicit decision still wins.
 */
export function form7207MustFile(inputs: ResolverInputs, copies: Form7207Copy[]) {
  const facilities = copies.filter((copy) => copy.key !== PASS_THROUGH_COPY);
  const { malformedKeys } = readAdvancedManufacturingFacilityFacts(inputs.facts);
  const stated = [...facilities.map((copy) => copy.key), ...malformedKeys];
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_7207",
    fallbacks: [
      {
        rule: `fallback: ${stated.length} advanced manufacturing facilit(ies) stated`,
        value: stated.length > 0,
        triggeredByFactKeys: stated,
      },
    ],
  });
}

/* The copies of a return that files the form; none when it does not. */
export function filedForm7207Copies(inputs: ResolverInputs): Form7207Copy[] {
  const copies = form7207Copies(inputs);
  return form7207MustFile(inputs, copies).value === true ? copies : [];
}

/*
 * A malformed facility fact is listed again, so Cade records it whole; the
 * facility fact is the whole input (requiredInputs.test.ts names it).
 */
export function resolve7207Info(inputs: ResolverInputs): Form7207FilingInfo {
  const copies = form7207Copies(inputs);
  const mustFile = form7207MustFile(inputs, copies);
  const filed = { mustFile: { "form-7207": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-7207": [] } };
  const { malformedKeys } = readAdvancedManufacturingFacilityFacts(inputs.facts);
  return { ...filed, missingInputs: { "form-7207": malformedKeys }, form7207Copies: copies };
}
