/*
 * Part I lines 22–26 and the page 2 summary, line 43 (line 41 is in
 * partII.ts). Hand-written (MANUAL EDIT): the bindings spread totalBindings.
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, sum, sumOrBlank } from "../../money.js";
import { activityLoss, passiveActivities } from "../8582/activities.js";
import { allowedLossForColumn } from "../8582/allocation.js";
import { magiWithK1Gap } from "../8582/magiGap.js";
import { isRentalActivity } from "../rentals/passive.js";
import { farmRentalForLine43 } from "./farmRental.js";
import type { PropertyColumn, RentalProperty, ScheduleEFilingInfo } from "./filingInfo.js";
import type { PartIBindings } from "./lines.js";
import type { ScheduleE } from "./types.js";

type Form = FormAccessor<ScheduleE>;
type Info = ScheduleEFilingInfo;
type Fn = (form: Form, info: Info) => unknown;

const COLUMNS: PropertyColumn[] = ["a", "b", "c"];

/* A number, null when the line is blank by rule, undefined while it waits. */
type Amount = number | null | undefined;

const isRoyalty = (property: RentalProperty) => property.value.propertyType === "royalties";

const line21 = (form: Form, column: PropertyColumn) =>
  numberOrBlank(form[`0.line.21_income_or_loss_${column}`]);

/* Every property's line 21 is a number: the columns are computed. */
function columnsReady(form: Form, info: Info): RentalProperty[] | undefined {
  // A fourth property needs another Schedule E (not modeled): no total leaves it out.
  if (info.rentalPropertiesOverflow) return undefined;
  const properties = info.rentalProperties ?? [];
  if (properties.length === 0) return undefined;
  return properties.every((property) => line21(form, property.column) !== undefined)
    ? properties
    : undefined;
}

/*
 * An explicit no on Form 8582, the exception for certain rental real estate
 * (irs-8582-inst-2025::sec::who-must-file::b03): line 21's loss is not limited.
 */
const without8582 = (info: Info) => info.mustFile?.["form-8582"]?.value === false;

/*
 * A passive activity's allowed loss, a positive amount: Form 8582's
 * (how-to-report-allowed-losses::b01–b03), 0 when 8582 allows none; without
 * Form 8582, the line 21 loss.
 */
function allowedPassiveLoss(form: Form, info: Info, property: RentalProperty): Amount {
  const { column } = property;
  const net = line21(form, column);
  if (net === undefined) return undefined;
  if (without8582(info)) {
    /* The exception needs no prior-year loss and only actively managed rental real estate (who-must-file::b01). */
    if ((property.value.priorYearUnallowedLoss ?? 0) > 0) return undefined;
    if (isRoyalty(property) || property.value.activeParticipation !== true) {
      return net < 0 ? undefined : null;
    }
    return net < 0 ? -net : null;
  }
  const activities = passiveActivities(info, (entry) => line21(form, entry));
  if (!activities) return undefined;
  if ((activityLoss(activities, column) ?? 0) === 0) return null;
  if (rentalMagiGap(form, info)) return undefined;
  const allowed = allowedLossForColumn((fieldId) => form[fieldId], info, column);
  return allowed ?? undefined;
}

/*
 * A column's loss as the return deducts it, a positive amount: a nonpassive
 * property's line 21 loss; a passive one's allowed loss, which can include a
 * prior-year loss even with income on line 21. A former passive activity's
 * prior-year loss is not modeled, so it waits.
 */
function columnLoss(form: Form, info: Info, property: RentalProperty): Amount {
  const net = line21(form, property.column);
  if (net === undefined || property.passive === undefined) return undefined;
  if (property.passive) return allowedPassiveLoss(form, info, property);
  if ((property.value.priorYearUnallowedLoss ?? 0) > 0) return undefined;
  return net < 0 ? -net : null;
}

/* Line 22, a positive amount (irs-1040se-inst-2025::sec::line-22::b01): blank for a royalty. */
export function deductibleLoss(form: Form, info: Info, column: PropertyColumn): Amount {
  const property = info.rentalProperties?.find((entry) => entry.column === column);
  if (!property) return undefined;
  return isRoyalty(property) ? null : columnLoss(form, info, property);
}

/* Line 25: royalty losses from line 21 and rental losses from line 22; total losses allowed (b03). */
function losses(form: Form, info: Info): Amount {
  const properties = columnsReady(form, info);
  if (!properties) return undefined;
  const amounts: Amount[] = properties.map((property) => columnLoss(form, info, property));
  if (amounts.includes(undefined)) return undefined;
  return sumOrBlank(...amounts) ?? null;
}

/* Line 24: the positive line 21 amounts. */
function income(form: Form, info: Info): Amount {
  const properties = columnsReady(form, info);
  if (!properties) return undefined;
  return (
    sumOrBlank(
      ...properties
        .map((property) => line21(form, property.column))
        .filter((net) => (net ?? 0) > 0),
    ) ?? null
  );
}

/* Lines 23a–23e: one line of every column, once every column is computed. */
function columnTotal(line: string): Fn {
  return (form, info) =>
    columnsReady(form, info)
      ? sumOrBlank(...COLUMNS.map((column) => form[`0.line.${line}_${column}`]))
      : undefined;
}

/* A rental's amount on Form 1040: line 21 income less line 22's loss; undefined while line 22 waits. */
function reportedAmount(form: Form, info: Info, column: PropertyColumn): number | undefined {
  const net = line21(form, column);
  const loss = deductibleLoss(form, info, column);
  if (net === undefined || loss === undefined) return undefined;
  return (net > 0 ? net : 0) - sum(loss);
}

/*
 * Line 43 (Pub. 925, real-estate-professional::b02): a real estate professional's
 * net income or loss reported on Form 1040 from the rental real estate activities
 * they materially participated in. A stay of 7 days or less is not a rental
 * activity (irs-8582-inst-2025::sec::rental-activities::b01).
 */
function partIReconciliation(form: Form, info: Info): number | "waits" | undefined {
  if ((info.rentalProperties ?? []).length === 0) return undefined;
  const properties = columnsReady(form, info);
  const rentals = properties?.filter((property) => !isRoyalty(property));
  if (!rentals || rentals.some((property) => property.passive === undefined)) return "waits";
  const materiallyParticipated = rentals.filter(
    (property) => property.passive === false && isRentalActivity(property.value) !== false,
  );
  const amounts = materiallyParticipated.map((property) =>
    reportedAmount(form, info, property.column),
  );
  return amounts.includes(undefined) ? "waits" : sumOrBlank(...amounts);
}

/* MANUAL EDIT: line 43 also takes a farm rental the professional materially participated in (farmRental.ts). */
function professionalReconciliation(form: Form, info: Info): number | undefined {
  if (info.realEstateProfessional !== true) return undefined;
  const partI = partIReconciliation(form, info);
  const farm = farmRentalForLine43(info);
  if (partI === "waits" || farm === "waits") return undefined;
  return sumOrBlank(partI, farm);
}

const orBlank = (amount: Amount) => (amount === null ? undefined : amount);

/* Form 8582 line 6's gap with a K-1 (8582/magiGap.ts), which its allowed losses read. */
function rentalMagiGap(form: Form, info: Info) {
  return magiWithK1Gap((fieldId) => form[fieldId], info);
}

/* The gap for a column whose loss Form 8582 allows: a passive activity with a loss on it. */
function columnMagiGap(form: Form, info: Info, column: PropertyColumn) {
  const property = info.rentalProperties?.find((entry) => entry.column === column);
  if (!property?.passive || without8582(info)) return undefined;
  const activities = passiveActivities(info, (entry) => line21(form, entry));
  if (!activities || (activityLoss(activities, column) ?? 0) === 0) return undefined;
  return rentalMagiGap(form, info);
}

const anyColumnMagiGap = (form: Form, info: Info) =>
  COLUMNS.map((column) => columnMagiGap(form, info, column)).find((gap) => gap !== undefined);

export function totalBindings(): PartIBindings {
  const out: Record<string, Fn> = {
    "0.line.23a_total_rents": columnTotal("3_rents_received"),
    "0.line.23b_total_royalties": columnTotal("4_royalties_received"),
    "0.line.23c_total_mortgage_interest": columnTotal("12_mortgage_interest"),
    "0.line.23d_total_depreciation": columnTotal("18_depreciation_or_depletion"),
    "0.line.23e_total_expenses": columnTotal("20_total_expenses"),
    "0.line.24_income": (form, info) => orBlank(income(form, info)),
    "0.line.25_losses": (form, info) => anyColumnMagiGap(form, info) ?? orBlank(losses(form, info)),
    // Line 24 less the parenthesized line 25; signed, 0 when both are blank.
    "0.line.26_total_income_or_loss": (form, info) => {
      const gap = anyColumnMagiGap(form, info);
      if (gap) return gap;
      const [line24, line25] = [income(form, info), losses(form, info)];
      if (line24 === undefined || line25 === undefined) return undefined;
      return sum(line24) - sum(line25);
    },
    // Line 41 is in partII.ts: it adds Part II and reports every K-1 gap.
    "1.line.43_real_estate_professional_reconciliation": professionalReconciliation,
  };
  for (const column of COLUMNS) {
    // A royalty has no line 22 (deductibleLoss); its allowed loss reaches line 25 only.
    out[`0.line.22_deductible_loss_${column}`] = (form, info) => {
      const property = info.rentalProperties?.find((entry) => entry.column === column);
      const gap = property && !isRoyalty(property) ? columnMagiGap(form, info, column) : undefined;
      return gap ?? orBlank(deductibleLoss(form, info, column));
    };
  }
  return out as PartIBindings;
}
