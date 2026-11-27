import { getNuclearFacilityFacts } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7213Copy } from "./cells.js";
import { form7213Copies } from "./copies.js";
import type { Form7213FilingInfo } from "./filingInfo.js";
import { passThroughCopy } from "./passThrough.js";

/*
 * Who files: a taxpayer who claims the credit of a facility it owns, one form
 * for each facility (irs-7213-inst-2025::sec::who-must-file::b01). "If you
 * received a Schedule K-1 ... reporting your share of any section 45J or
 * section 45U credit, then you don't need to file this form" (the same
 * block), so a K-1 credit alone files no Form 7213 (Form 3800 takes it). The
 * explicit decision still wins.
 */
export function form7213MustFile(inputs: ResolverInputs) {
  const facilityKeys = getNuclearFacilityFacts(inputs.facts).map((fact) => fact.key);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_7213",
    fallbacks: [
      {
        rule: `fallback: ${facilityKeys.length} nuclear power facilit(ies) the taxpayer owns`,
        value: facilityKeys.length > 0,
        triggeredByFactKeys: facilityKeys,
      },
    ],
  });
}

/*
 * The copies of a return that files the form; none when it does not. A form
 * the decision files with no facility is the pass-through form with every K-1
 * credit, or one blank form.
 */
export function filedForm7213Copies(inputs: ResolverInputs): Form7213Copy[] {
  if (form7213MustFile(inputs).value !== true) return [];
  const copies = form7213Copies(inputs);
  if (copies.length > 0) return copies;
  const passThrough = passThroughCopy(inputs, { advanced: true, zeroEmission: true });
  return passThrough === undefined ? [] : [passThrough];
}

/*
 * A facility waits while its ZEC answer (Part II line 6) is missing: the
 * facility fact is listed again, as Form 3468 lists a property fact.
 */
export function resolve7213Info(inputs: ResolverInputs): Form7213FilingInfo {
  const mustFile = form7213MustFile(inputs);
  const filed = { mustFile: { "form-7213": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-7213": [] } };
  const copies = filedForm7213Copies(inputs);
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return {
    ...filed,
    missingInputs: { "form-7213": missing },
    form7213Copies: copies.length > 0 ? copies : undefined,
  };
}
