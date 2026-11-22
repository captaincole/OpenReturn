import { sum } from "../../money.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form4972Copies, missingKeysOf } from "./copies.js";
import type { Form4972Copy, Form4972FilingInfo } from "./filingInfo.js";

const ONE_COPY =
  "Each plan participant and each spouse files a separate Form 4972 (irs-4972-form-2025::sec::specific-instructions::b01); the engine prints one copy, so a return with more than one needs a preparer for the forms. Form 1040 line 16 adds the tax of every copy.";
const NO_FACT =
  "Form 4972 files by decision, but no lump-sum distribution fact names its Forms 1099-R and answers Part I.";

/* The copies' total tax, or why it is not known: undefined while one waits. */
function taxOf(copies: Form4972Copy[]): Pick<Form4972FilingInfo, "form4972Tax" | "form4972TaxGap"> {
  const gap = copies.find((copy) => copy.result.kind === "gap");
  if (gap?.result.kind === "gap") return { form4972TaxGap: gap.result.reason };
  if (copies.length === 0) return { form4972TaxGap: NO_FACT };
  const taxes = copies.map((copy) =>
    copy.result.kind === "figured" ? copy.result.lines.tax : undefined,
  );
  return taxes.includes(undefined) ? {} : { form4972Tax: sum(...taxes) };
}

/*
 * Who files: no one must; a recipient may "use Form 4972 to figure the tax on
 * a qualified lump-sum distribution ... using the 20% capital gain election,
 * the 10-year tax option, or both" (irs-4972-form-2025::sec::general-instructions::b01).
 * A lump-sum fact whose Part I answers allow the form (the blank form, lines 1
 * to 5b) and that makes an election files it. The explicit decision still wins.
 */
export function resolve4972Info(inputs: ResolverInputs): Form4972FilingInfo {
  const copies = form4972Copies(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4972",
    fallbacks: [
      {
        rule: `fallback: ${copies.length} lump-sum distribution(s) with an election Part I allows`,
        value: copies.length > 0,
        triggeredByFactKeys: copies.map((copy) => copy.factKey),
      },
    ],
  });
  const filed = { mustFile: { "form-4972": mustFile } };
  if (mustFile.value !== true) return filed;
  const missing = copies.flatMap((copy) => missingKeysOf(inputs, copy));
  return {
    ...filed,
    missingInputs: {
      "form-4972": missingInputs(Object.fromEntries(missing.map((key) => [key, undefined]))),
    },
    form4972: copies.length === 1 ? copies[0] : undefined,
    form4972Gap: copies.length > 1 ? ONE_COPY : copies.length === 0 ? NO_FACT : undefined,
    ...taxOf(copies),
  };
}
