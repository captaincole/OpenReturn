import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form7211Copies, PASS_THROUGH_COPY, type Form7211Copy } from "./copies.js";
import type { Form7211FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Taxpayers ... that own and operate a qualified facility must
 * file a separate Form 7211 for each qualified facility to claim the credit.
 * All others are generally not required to complete or file this form if
 * their only source for any section 45Y clean electricity production credit
 * is a partnership, S corporation, estate, trust, or cooperative. Instead,
 * they can report this credit directly on Form 3800"
 * (irs-7211-inst-2025::sec::general-instructions::b01). So a facility fact
 * files it, and a K-1 credit alone does not. The explicit decision still wins.
 */
export function form7211MustFile(inputs: ResolverInputs, copies: Form7211Copy[]) {
  const facilities = copies.filter((copy) => copy.key !== PASS_THROUGH_COPY);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_7211",
    fallbacks: [
      {
        rule: `fallback: ${facilities.length} clean electricity facilit(ies) the taxpayer owns`,
        value: facilities.length > 0,
        triggeredByFactKeys: facilities.map((copy) => copy.key),
      },
    ],
  });
}

/* The copies of a return that files the form; none when it does not. */
export function filedForm7211Copies(inputs: ResolverInputs): Form7211Copy[] {
  const copies = form7211Copies(inputs);
  return form7211MustFile(inputs, copies).value === true ? copies : [];
}

/*
 * A facility waits while an answer its copy reads is missing (copies.ts
 * answered): the facility fact is listed again, as Form 3468 lists a property.
 */
export function resolve7211Info(inputs: ResolverInputs): Form7211FilingInfo {
  const copies = form7211Copies(inputs);
  const mustFile = form7211MustFile(inputs, copies);
  const filed = { mustFile: { "form-7211": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-7211": [] } };
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return { ...filed, missingInputs: { "form-7211": missing }, form7211Copies: copies };
}
