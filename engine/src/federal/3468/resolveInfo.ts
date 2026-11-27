import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form3468Copies, type Form3468Copy } from "./copies.js";
import type { Form3468FilingInfo } from "./filingInfo.js";

/*
 * Who files: "Complete and attach a separate Form 3468 to your return for
 * each facility or property that you use in your trade or business"
 * (irs-3468-inst-2025::sec::specific-instructions::b01), and a patron files
 * one for the unused credits allocated from cooperatives
 * (general-instructions::b02), which a K-1 reports with box 15 codes P to U
 * ("Report this amount on Form 3468", irs-1065k1-inst-2025::sec::box-15-credits::b07).
 * The explicit decision still wins.
 */
export function form3468MustFile(inputs: ResolverInputs, copies: Form3468Copy[]) {
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3468",
    fallbacks: [
      {
        rule: `fallback: ${copies.length} investment credit propert(ies) or cooperative credit(s) stated or on a K-1`,
        value: copies.length > 0,
        triggeredByFactKeys: copies.map((copy) => copy.key),
      },
    ],
  });
}

/* The copies of a return that files the form; none when it does not. */
export function filedForm3468Copies(inputs: ResolverInputs): Form3468Copy[] {
  const copies = form3468Copies(inputs);
  return form3468MustFile(inputs, copies).value === true ? copies : [];
}

/*
 * A property waits while an answer its part reads is missing (Part I lines 7
 * to 11, or a capacity the low-income bonus divides): the property fact is
 * listed again, as a farm fact is for Schedule F.
 */
export function resolve3468Info(inputs: ResolverInputs): Form3468FilingInfo {
  const copies = form3468Copies(inputs);
  const mustFile = form3468MustFile(inputs, copies);
  const filed = { mustFile: { "form-3468": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-3468": [] } };
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return { ...filed, missingInputs: { "form-3468": missing }, form3468Copies: copies };
}
