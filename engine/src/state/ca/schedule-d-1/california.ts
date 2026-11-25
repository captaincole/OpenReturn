/*
 * A sale with its California amounts. Schedule D-1 is filled like federal Form
 * 4797 "using California amounts" (ca-540-sched-d1-inst-2025::sec::part-i::b01):
 * the California basis (part-i::b02), the depreciation with the California
 * section 179 expense (part-iii::b01), the California additional depreciation of
 * section 1250 property (irc-section-1250-property::b01) and the California
 * drilling costs (general-information::b02). Each is the federal amount unless the
 * sale fact states a California one.
 */

import {
  CALIFORNIA_SALE_FIELDS,
  INHERITED,
  type BusinessPropertySaleFactValue,
} from "../../../facts/index.js";

/*
 * California line 29a counts additional depreciation "after December 31, 1976",
 * line 29d from 1971 through 1976 (irc-section-1250-property::b01); federal line
 * 26a counts after 1975 and line 26d from 1970 through 1975. For property acquired
 * on or after this day, the periods hold the same depreciation.
 */
export const CALIFORNIA_PERIOD_START = "1977-01-01";

/*
 * The California additional depreciation of section 1250 property. No additional
 * depreciation in either period is straight line: "If straight-line depreciation
 * was used, enter -0- on line 29g" (the form, line 29), and lines 29a–29e stay
 * blank, as the federal fact's absent amount does.
 */
function californiaAdditional(sale: BusinessPropertySaleFactValue) {
  const after1976 =
    sale.californiaAdditionalDepreciationAfter1976 ?? sale.additionalDepreciationAfter1975;
  const from1971 =
    sale.californiaAdditionalDepreciation1971To1976 ?? sale.additionalDepreciation1970To1975;
  const straightLine = (after1976 ?? 0) === 0 && (from1971 ?? 0) === 0;
  return straightLine
    ? { additionalDepreciationAfter1975: undefined, additionalDepreciation1970To1975: undefined }
    : { additionalDepreciationAfter1975: after1976, additionalDepreciation1970To1975: from1971 };
}

/* The sale with each California amount in place of the federal one, for the Form 4797 arithmetic. */
export function californiaSale(sale: BusinessPropertySaleFactValue): BusinessPropertySaleFactValue {
  return {
    ...sale,
    costOrOtherBasis: sale.californiaCostOrOtherBasis ?? sale.costOrOtherBasis,
    depreciationAllowed: sale.californiaDepreciationAllowed ?? sale.depreciationAllowed,
    ...californiaAdditional(sale),
    section1254Costs: sale.californiaSection1254Costs ?? sale.section1254Costs,
  };
}

/* The sale states a California amount that is not its federal amount. */
export function differsForCalifornia(sale: BusinessPropertySaleFactValue): boolean {
  return CALIFORNIA_SALE_FIELDS.some(
    ([california, federal]) => sale[california] !== undefined && sale[california] !== sale[federal],
  );
}

const acquiredBefore1977 = (sale: BusinessPropertySaleFactValue): boolean =>
  sale.dateAcquired === INHERITED || sale.dateAcquired < CALIFORNIA_PERIOD_START;

/*
 * Why the California additional depreciation cannot be taken from the federal
 * fact: section 1250 property acquired before 1977 (the periods differ), or a
 * California depreciation that differs with no California additional depreciation
 * stated. Undefined when the federal amounts serve.
 */
export function californiaSaleGap(sale: BusinessPropertySaleFactValue): string | undefined {
  if (sale.kind !== "section_1250") return undefined;
  const federalAdditional =
    sale.additionalDepreciationAfter1975 !== undefined ||
    sale.additionalDepreciation1970To1975 !== undefined;
  if (!federalAdditional) return undefined;
  const stated =
    sale.californiaAdditionalDepreciationAfter1976 !== undefined &&
    (sale.additionalDepreciation1970To1975 === undefined ||
      sale.californiaAdditionalDepreciation1971To1976 !== undefined);
  if (stated) return undefined;
  if (acquiredBefore1977(sale)) {
    return `${sale.description}: section 1250 property acquired before 1977 with additional depreciation; California counts it after 1976 and from 1971 through 1976 (irc-section-1250-property::b01), and the sale states no California amounts.`;
  }
  const depreciationDiffers =
    sale.californiaDepreciationAllowed !== undefined &&
    sale.californiaDepreciationAllowed !== sale.depreciationAllowed;
  return depreciationDiffers
    ? `${sale.description}: the California depreciation differs from the federal depreciation, and the sale states no California additional depreciation for line 29a.`
    : undefined;
}
