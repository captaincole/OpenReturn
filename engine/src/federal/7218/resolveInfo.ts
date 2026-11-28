import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { facilityCopy, passThroughCopy, qualifiedFacilities, type Form7218Copy } from "./copies.js";
import type { Form7218FilingInfo } from "./filingInfo.js";

/*
 * Who files: "File a separate Form 7218 for each qualified facility for which
 * you claim the section 45Z credit" (irs-7218-inst-2025::sec::how-to-claim-the-credit::b02).
 * A taxpayer whose only clean fuel credit comes from a pass-through entity
 * "can report the credit(s) directly on Form 3800, Part III, line 1q"
 * (part-ii-clean-aviation-and::b01), so a K-1 alone files no Form 7218; with a
 * facility, the pass-through credits take a separate Form 7218. A facility
 * with a section 45V, 45Q or 48(a)(15) credit is not a qualified facility
 * (qualified-facility::b01) and files none. The explicit decision still wins.
 */
export function form7218MustFile(inputs: ResolverInputs) {
  const facilities = qualifiedFacilities(inputs);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_7218",
    fallbacks: [
      {
        rule: `fallback: ${facilities.length} qualified clean fuel facilit(ies) stated`,
        value: facilities.length > 0,
        triggeredByFactKeys: facilities.map((fact) => fact.key),
      },
    ],
  });
}

/* Every copy of a return that files the form, the facilities in the order recorded and the pass-through form last. */
export function form7218Copies(inputs: ResolverInputs): Form7218Copy[] {
  const facilities = qualifiedFacilities(inputs).map(facilityCopy);
  const passThrough = passThroughCopy(inputs);
  return passThrough === undefined ? facilities : [...facilities, passThrough];
}

/*
 * A facility waits while a row needs an answer (the gallons produced before a
 * 2025 registration letter, a SAF certification): the facility fact is listed
 * again, as a Form 3468 property is.
 */
export function resolve7218Info(inputs: ResolverInputs): Form7218FilingInfo {
  const mustFile = form7218MustFile(inputs);
  const filed = { mustFile: { "form-7218": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-7218": [] } };
  const copies = form7218Copies(inputs);
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return { ...filed, missingInputs: { "form-7218": missing }, form7218Copies: copies };
}

/* The copies of a return that files the form; none when it does not. */
export function filedForm7218Copies(inputs: ResolverInputs): Form7218Copy[] {
  return form7218MustFile(inputs).value === true ? form7218Copies(inputs) : [];
}
