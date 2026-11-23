/*
 * Pub. 596 Worksheet 1, investment income, for a filer whom Step 2, question 4
 * sends there (irs-1040-inst-2025::sec::yes-see-form-4797::b01,
 * ::yes-use-worksheet-1::b01). Of its four cases the engine has facts for
 * Schedule E, whose rentals are its only passive activities, and Form 8814; the
 * rental of personal property (Schedule 1 line 8l) has none.
 */

import type { FormAccessor } from "../../defineForm.js";
import type { RentalFactValue } from "../../facts/index.js";
import type { MustFileResolution } from "../../filingInfo.js";
import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unmodeled } from "../8582/activities.js";
import type { Form8814Totals } from "../8814/filingInfo.js";
import { selfRentalState } from "../rentals/passive.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import { passThroughGaps, type PassThroughInfo } from "../schedule-e/partII.js";
import type { Worksheet1 } from "./credit.js";

type Lines = FormAccessor<object>;

export const ROYALTIES_WITH_RENTS_GAP =
  "Pub. 596 Worksheet 1 needs a Schedule E property's royalties and their expenses apart from its rents, and the engine does not split them.";

export const RECHARACTERIZED_INCOME_GAP =
  "Pub. 596 Worksheet 1 leaves out a passive rental's income that is recharacterized as nonpassive (land, a stay of 7 days or less, a disposition or a type 8 property), which the engine does not model.";

/* The slots Worksheet 1 reads: Schedule E's must-file, its columns and K-1s, and Form 8814's totals. */
export interface Worksheet1Info extends PassThroughInfo {
  mustFile?: Readonly<Record<string, MustFileResolution>>;
  rentalProperties?: RentalProperty[];
  /* Schedule E Part I is in use; without it, lines 8–13 take only Parts II and III. */
  partIInUse?: boolean;
  form8814Totals?: Form8814Totals;
}

export const PASS_THROUGH_GAP =
  "Pub. 596 Worksheet 1 lines 11 and 12 take a K-1's passive income or loss (Schedule E lines 29a column (h), 29b column (g), 34a and 34b), and a K-1 on this return has items the engine does not route.";

/*
 * MANUAL EDIT: lines 11 and 12 from Parts II and III
 * (irs-pub-596-2025::sec::passive-activities::b01): line 29a column (h) less
 * line 29b column (g). Nonpassive K-1 income (column (k)) is not investment
 * income. 0 with no K-1; a K-1 the engine does not route is a gap; waiting
 * while line 32 is blank.
 */
function passThroughPassive(
  form: Lines,
  info: Worksheet1Info,
): Worksheet1 | { kind: "amount"; amount: number } {
  if ((info.passThroughEntities ?? []).length === 0) return { kind: "amount", amount: 0 };
  if (passThroughGaps(info).length > 0) return { kind: "unsupported", reason: PASS_THROUGH_GAP };
  const hasPartII = (info.passThroughEntities ?? []).some((entity) => entity.form !== "1041");
  if (
    hasPartII &&
    numberOrBlank(form["schedule-e.1.line.32_total_partnership_s_corp_income"]) === undefined
  ) {
    return { kind: "waiting" };
  }
  return {
    kind: "amount",
    amount:
      sum(form["schedule-e.1.line.29a_totals_col_h"]) -
      sum(form["schedule-e.1.line.29b_totals_col_g"]),
  };
}

/* A royalty property, or a rental property with royalties: lines 8–10, not 11–13. */
const hasRoyalties = (value: RentalFactValue) =>
  value.propertyType === "royalties" || (value.royaltiesReceived ?? 0) > 0;

/* A royalty column with rents too: line 9's royalty expenses are not known. */
export function mixesRentsAndRoyalties(value: RentalFactValue): boolean {
  return hasRoyalties(value) && (value.rentsReceived ?? 0) > 0;
}

const isRoyalty = (property: RentalProperty) => hasRoyalties(property.value);

/*
 * A passive rental's net income (line 21) that may be nonpassive: lines 11–12
 * leave it out as "NPA" (irs-pub-596-2025::sec::passive-activities::b02;
 * irs-8582-inst-2025::sec::recharacterization-of-passive-income::b01). Form
 * 8582's own test of what it does not model (8582/activities.ts) decides; a
 * self-rental is modeled (selfRentalState).
 */
export function incomeMayBeNonpassive(
  value: RentalFactValue,
  passive: boolean | undefined,
  line21: number | undefined,
): boolean {
  if (passive !== true || hasRoyalties(value) || line21 === undefined) return false;
  return line21 > 0 && unmodeled(value, line21);
}

const column = (form: Lines, line: string, property: RentalProperty) =>
  form[`schedule-e.0.line.${line}_${property.column}`];

/*
 * A self-rental's net income is nonpassive (irs-pub-925-2025::sec::rental-of-property-to::b01):
 * "NPA", left out of lines 11–13. Net income over a prior-year loss waits, as
 * Schedule E line 22 does; a net loss counts as any passive rental's.
 */
const selfRental = (form: Lines, property: RentalProperty) =>
  selfRentalState(property.value, numberOrBlank(column(form, "21_income_or_loss", property)));

/*
 * A passive rental's amount on Schedule E line 26: line 21's income less the
 * line 22 loss (a positive amount, blank when none).
 */
const onLine26 = (form: Lines, property: RentalProperty) =>
  atLeast(0, column(form, "21_income_or_loss", property)) -
  sum(column(form, "22_deductible_loss", property));

/*
 * Line 14 from Step 2's sum (Form 1040 lines 2a, 2b, 3b and 7a, a loss as 0),
 * which is Worksheet 1 lines 1–3 and 5; line 6 (Form 4797) has no facts and is
 * 0, and worksheet1 adds Form 8814's lines 2 and 4
 * (irs-pub-596-2025::sec::interest-and-dividends::b01, ::capital-gain-net-income::b01).
 * Lines 8–10: Schedule E line 23b less the royalty columns' line 20, at least 0
 * (::royalties-and-rental-income-from-personal-property::b01). Lines 11–13: the
 * passive rentals' amounts on line 26, at least 0; a royalty, a rental that
 * is not passive and a self-rental's net income ("NPA") are left out
 * (::passive-activities::b01, ::b02).
 * Undefined when Schedule E does not file; waiting until its line 26 is a
 * number, which needs every column's line 21 and line 22. A gap decides
 * first: Form 8582 waits on a property whose income it does not model.
 */
function rentalWorksheet1(
  form: Lines,
  info: Worksheet1Info,
  step2InvestmentIncome: number,
): Worksheet1 | undefined {
  const files = info.mustFile?.["schedule-e"];
  if (files === undefined || files.value === false) return undefined;
  if (files.value === undefined) return { kind: "waiting" };
  const k1s = passThroughPassive(form, info);
  if (k1s.kind !== "amount") return k1s;
  // MANUAL EDIT: a Schedule E with no Part I adds only its K-1s' passive amounts.
  if (info.partIInUse === false) {
    return { kind: "line14", amount: sum(step2InvestmentIncome, atLeast(0, k1s.amount)) };
  }
  const properties = info.rentalProperties ?? [];
  if (properties.some((property) => mixesRentsAndRoyalties(property.value))) {
    return { kind: "unsupported", reason: ROYALTIES_WITH_RENTS_GAP };
  }
  const recharacterized = properties.some((property) =>
    incomeMayBeNonpassive(
      property.value,
      property.passive,
      numberOrBlank(column(form, "21_income_or_loss", property)),
    ),
  );
  if (recharacterized) return { kind: "unsupported", reason: RECHARACTERIZED_INCOME_GAP };
  const line26 = numberOrBlank(form["schedule-e.0.line.26_total_income_or_loss"]);
  const rentals = properties.filter((property) => !isRoyalty(property));
  if (line26 === undefined || rentals.some((property) => property.passive === undefined)) {
    return { kind: "waiting" };
  }
  const line9 = sum(
    ...properties.filter(isRoyalty).map((property) => column(form, "20_total_expenses", property)),
  );
  const line10 = atLeast(0, sum(form["schedule-e.0.line.23b_total_royalties"]) - line9);
  const passive = rentals.filter((property) => property.passive === true);
  const states = passive.map((property) => selfRental(form, property));
  if (states.some((state) => state === undefined || state === "waits")) return { kind: "waiting" };
  const counted = passive.filter((_, index) => states[index] !== "recharacterized");
  const line13 = atLeast(
    0,
    sum(...counted.map((property) => onLine26(form, property)), k1s.amount),
  );
  return { kind: "line14", amount: sum(step2InvestmentIncome, line10, line13) };
}

/*
 * Worksheet 1 for a Schedule E or a Form 8814 filer. Form 8814 adds each form's
 * line 1b to line 2, and line 12 (or Worksheet 2 line 10 with an Alaska
 * Permanent Fund dividend) on line 4 (irs-pub-596-2025::sec::interest-and-dividends::b01,
 * ::passive-activities::b03, ::b04); its lines 9 and 10 are already in Form
 * 1040 lines 3b and 7a. Undefined when neither form files.
 */
export function worksheet1(
  form: Lines,
  info: Worksheet1Info,
  step2InvestmentIncome: number,
): Worksheet1 | undefined {
  const rentals = rentalWorksheet1(form, info, step2InvestmentIncome);
  const child = info.form8814Totals;
  if (child === undefined) return rentals;
  if (child.kind === "waits") return { kind: "waiting" };
  if (child.kind === "unsupported") return { kind: "unsupported", reason: child.reason };
  const fromForm8814 = sum(child.line1b, child.eicWorksheet1Line4);
  if (rentals === undefined) {
    return { kind: "line14", amount: sum(step2InvestmentIncome, fromForm8814) };
  }
  return rentals.kind === "line14"
    ? { kind: "line14", amount: sum(rentals.amount, fromForm8814) }
    : rentals;
}
