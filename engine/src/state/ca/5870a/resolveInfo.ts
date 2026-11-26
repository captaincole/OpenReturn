import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { combine, form5870ACopies, untaxedDistributions } from "./copies.js";
import type { Carried, Form5870ACopy, Form5870AFilingInfo } from "./filingInfo.js";

const FILES_540_KEY = "decisions.scope.must_file_ca_540";

const NO_FACT =
  "FTB 5870A files by decision, but no trust fact holds the trustee's Schedule J (541) or the accumulation distribution.";
const MORE_THAN_ONE =
  "Accumulation distributions from more than one trust: line 11 of each later trust's form includes the amounts considered distributed by the earlier ones (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b04), and the engine figures one trust at a time.";
const UNTAXED_NO_AMOUNT =
  "A trust that did not file Form 541 or pay the California tax: the whole distribution goes on Schedule CA (540) line 8z column C (ca-5870a-inst-2025::sec::purpose::b02), but the trust fact holds no amount from the trustee.";

type Pick5870A = (copy: Form5870ACopy) => Carried;

/* One copy's amount for another form: a gap, a wait, or the figured amount. */
function carriedOf(copies: Form5870ACopy[], pick: Pick5870A): Carried {
  if (copies.length === 0) return { gap: NO_FACT };
  if (copies.length > 1) return { gap: MORE_THAN_ONE };
  const { result } = copies[0];
  if (result.kind === "gap") return { gap: result.reason };
  return result.kind === "waits" ? "waits" : pick(copies[0]);
}

/* Form 540 line 34: Part I line 26, or Part II Section A line 14 or Section B line 16. */
const taxOf: Pick5870A = ({ result }) => {
  if (result.kind !== "figured") return undefined;
  if (result.taxGap !== undefined) return { gap: result.taxGap };
  const { partI, partII } = result.lines;
  const tax = partI ? partI.totals?.line26 : partII?.total;
  return tax === undefined ? undefined : { amount: tax };
};

/* Form 540 line 62: Part III line 6; nothing when Part III is not completed. */
const behavioralHealthTaxOf: Pick5870A = ({ result }) => {
  if (result.kind !== "figured") return undefined;
  if (result.bhstGap !== undefined) return { gap: result.bhstGap };
  const line6 = result.lines.partIII?.line6;
  return line6 === undefined ? undefined : { amount: line6 };
};

/* Schedule CA line 8z column C: Part II line 2 (Section A) or line 4 (Section B). */
const scheduleCaShareOf: Pick5870A = ({ result }) => {
  if (result.kind !== "figured") return undefined;
  const share = result.lines.partII?.share;
  return share === undefined ? undefined : { amount: share };
};

function untaxedAddition(inputs: ResolverInputs): Carried {
  const untaxed = untaxedDistributions(inputs);
  if (Array.isArray(untaxed)) return { gap: UNTAXED_NO_AMOUNT };
  return untaxed.amount > 0 ? untaxed : undefined;
}

/*
 * Who files: "If you received accumulation distributions from foreign trusts or
 * from certain domestic trusts, get form FTB 5870A ... to figure the additional
 * tax" (ca-540-inst-2025::sec::line-34-tax-from-schedule-g-1-and-form-ftb-5870a::b01;
 * ca-5870a-inst-2025::sec::purpose::b01). A trust fact on a Form 540 return
 * files it when the trustee's answers for California name Part I or Part II
 * (copies.ts), or when it has a federal throwback year and the California
 * answers are still to come. A trust that paid no California tax on a
 * noncontingent beneficiary's share files no FTB 5870A (purpose::b02). The
 * explicit decision still wins.
 */
export function resolve5870AInfo(inputs: ResolverInputs): Form5870AFilingInfo {
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const copies = form5870ACopies(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_5870a",
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) with ${copies.length} trust accumulation distribution(s) for FTB 5870A`,
        value: files540 && copies.length > 0,
        triggeredByFactKeys: copies.map((copy) => copy.factKey),
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
    ],
  });
  const untaxed = files540 ? untaxedAddition(inputs) : undefined;
  const filed = { mustFile: { "form-5870a": mustFile } };
  if (mustFile.value !== true) return { ...filed, form5870AScheduleCaAddition: untaxed };
  const missing = copies.flatMap((copy) =>
    copy.result.kind === "waits" ? copy.result.missing : [],
  );
  return {
    ...filed,
    missingInputs: { "form-5870a": [...new Set(missing)] },
    form5870A: copies.length === 1 ? copies[0] : undefined,
    form5870AGap: copies.length > 1 ? MORE_THAN_ONE : copies.length === 0 ? NO_FACT : undefined,
    form5870ATrustCount: copies.length,
    form5870ATax: carriedOf(copies, taxOf),
    form5870ABehavioralHealthTax: carriedOf(copies, behavioralHealthTaxOf),
    form5870AScheduleCaAddition: combine(carriedOf(copies, scheduleCaShareOf), untaxed),
  };
}
