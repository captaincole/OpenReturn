import {
  getCleanHydrogenFacilityFacts,
  getInvestmentCreditPropertyFacts,
  type CleanHydrogenFacilityFact,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { filedForm3468Copies } from "../3468/resolveInfo.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { facilityCopy, noCreditReason, sameFacility } from "./facility.js";
import type { Form7210Copy, Form7210FilingInfo } from "./filingInfo.js";
import { line12Of } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_7210";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code Y (federal/passThrough). */
export const K1_HYDROGEN_DETAIL = "clean_hydrogen_production";

/* The key of a copy that holds only K-1 credits (line 11): a return with no facility of its own. */
export const K1_ONLY_COPY = "k1_credits";

const K1_AMOUNT_GAP =
  "A K-1 reports the clean hydrogen production credit (code Y) with no amount; the entity's statement gives it.";

/*
 * Line 11: "Enter the total clean hydrogen production credit amount from your
 * distributive share reported on" Schedule K-1 (Form 1065) box 15 code Y or
 * (Form 1120-S) box 13 code Y (irs-7210-inst-2025::sec::line-11::b01). Each
 * K-1 rounds before the add, as Form 8846 line 5 does (8846/resolveInfo.ts,
 * the DECISION there): Form 3800 takes each K-1 as its own source in whole
 * dollars. Undefined with none.
 */
export function k1HydrogenCreditsOf(inputs: ResolverInputs): number | Unsupported | undefined {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_HYDROGEN_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return unsupported(K1_AMOUNT_GAP);
  return sum(...items.map(({ item }) => roundDollars(item.amount)));
}

/* A Form 3468 Section M property this return claims for the same facility. */
function onForm3468(inputs: ResolverInputs, fact: CleanHydrogenFacilityFact): boolean {
  const filed = new Set(filedForm3468Copies(inputs).map((copy) => copy.key));
  return getInvestmentCreditPropertyFacts(inputs.facts).some(
    (property) =>
      filed.has(property.key) &&
      property.value.credit.part === "energy" &&
      property.value.credit.investment.property.section === "clean_hydrogen" &&
      sameFacility(fact.value, property.value.facility),
  );
}

/* The facilities with a possible 2025 credit, each one Form 7210. */
export function claimedFacilities(inputs: ResolverInputs): CleanHydrogenFacilityFact[] {
  return getCleanHydrogenFacilityFacts(inputs.facts).filter(
    (fact) => noCreditReason(fact.value) === undefined,
  );
}

const isGap = (value: unknown): value is Unsupported => typeof value === "object";

/*
 * DECISION (2026-11-27, by the author): the K-1 credits go on line 11 of the
 * first Form 7210, not on a separate form.
 * - Text A, line 11: "Enter the total clean hydrogen production credit amount
 *   from your distributive share reported on: Schedule K-1 (Form 1065) ... box 15
 *   (code Y)" (irs-7210-inst-2025::sec::line-11::b01), and line 12 "Add lines 10
 *   and 11" (irs-7210-face-2025::sec::face-part-iv::b01).
 * - Text B, the same block: "If you are separately calculating a section 45V
 *   credit and are also reporting your distributive share ... enter your
 *   distributive share amount as 'Credit From Pass-Through Entities' on Form
 *   7210, Part I, line 2a."
 * The engine follows text A: the form's own line takes the amount, and line 2a
 * is the facility's address on every other reading. Form 3800 line 1g is the
 * same either way.
 */
function withK1Credits(copies: Form7210Copy[], line11: number | Unsupported | undefined) {
  const forms: Form7210Copy[] =
    copies.length > 0 ? copies : [{ key: K1_ONLY_COPY, cells: {}, waiting: false }];
  return forms.map((copy, index) => {
    const k1 = index === 0 ? line11 : undefined;
    return {
      ...copy,
      cells: {
        ...copy.cells,
        "0.line.11_credit_from_partnerships_s_corps": k1,
        "0.line.12_clean_hydrogen_credit": line12Cell(copy, k1),
      },
    };
  });
}

/* Line 12 of a copy: blank while its facility waits (line 10 is not known). */
function line12Cell(copy: Form7210Copy, k1: number | Unsupported | undefined) {
  if (copy.waiting) return undefined;
  const own = copy.cells["0.line.10_increased_credit_amount"];
  if (isGap(own)) return own;
  if (isGap(k1)) return k1;
  return line12Of(own as number | undefined, k1);
}

/*
 * Who files: a taxpayer who claims the section 45V credit for qualified clean
 * hydrogen produced at a facility it owns, one form for each facility
 * (irs-7210-inst-2025::sec::how-to-claim-the-credit::b01). A taxpayer whose
 * only source is a partnership or S corporation is "generally not required to
 * complete or file this form", and reports the credit "directly on Form 3800"
 * (::b02): a K-1 alone does not file it. A facility with no 2025 credit (a
 * section 48(a)(15) election, a section 45Q credit, a credit period that ended,
 * no qualified production) files none. The explicit decision still wins; with
 * it true, line 11 holds the K-1 credits.
 */
export function resolve7210Info(inputs: ResolverInputs): Form7210FilingInfo {
  const facilities = claimedFacilities(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${facilities.length} clean hydrogen production facilit(ies) with a 2025 credit`,
        value: facilities.length > 0,
        triggeredByFactKeys: facilities.map((fact) => fact.key),
      },
    ],
  });
  const filed = { mustFile: { "form-7210": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-7210": [] } };
  const copies = facilities.map((fact) => facilityCopy(fact, onForm3468(inputs, fact)));
  const missing = copies.filter((copy) => copy.waiting).map((copy) => copy.key);
  return {
    ...filed,
    missingInputs: { "form-7210": missing },
    form7210Copies: withK1Credits(copies, k1HydrogenCreditsOf(inputs)),
  };
}
