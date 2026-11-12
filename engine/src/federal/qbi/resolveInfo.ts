import { businessesOnReturn, ownerOf } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import type { QbiBusiness, QbiFilingInfo } from "./filingInfo.js";
import { qualifiedReitDividends } from "./whichForm.js";

/* The shared QBI slots, filled whichever QBI form files (Form 8995 or 8995-A). */
export function resolveQbiInfo(inputs: ResolverInputs): QbiFilingInfo {
  const { businesses } = qbiBusinesses(inputs);
  return {
    qualifiedReitDividends: qualifiedReitDividends(inputs),
    qbiBusinesses: businesses.length > 0 ? businesses : undefined,
    qbiScheduleSEFiled: resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value,
  };
}

/*
 * A rental or royalty property is a QBI trade or business when the taxpayer says so
 * (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b04: a section 162
 * trade or business, or the Rev. Proc. 2019-38 safe harbor). It takes Part I's
 * first columns, in the order the answer key lists it. A jointly owned property is
 * listed under the taxpayer's TIN.
 */
function qbiRentals(inputs: ResolverInputs): QbiBusiness[] {
  return (resolveScheduleEInfo(inputs).rentalProperties ?? [])
    .filter((property) => property.value.qualifiedBusiness === true)
    .map((property) => ({
      factKey: property.factKey,
      kind: "rental",
      scheduleEColumn: property.column,
      owner: property.value.owner === "spouse" ? "spouse" : "taxpayer",
      name: property.value.address?.street ?? property.value.propertyType,
      specifiedService: property.value.specifiedService,
      ownersOnlyBusiness: false,
      w2WagesPaid: property.value.w2WagesPaid,
      qualifiedPropertyUbia: property.value.qualifiedPropertyUbia,
    }));
}

/* Rental properties whose QBI answer is missing: Cade asks for the property again. */
export function rentalsWithoutQbiAnswer(inputs: ResolverInputs): string[] {
  return (resolveScheduleEInfo(inputs).rentalProperties ?? [])
    .filter((property) => property.value.qualifiedBusiness === undefined)
    .map((property) => property.factKey);
}

export function qbiBusinesses(inputs: ResolverInputs): {
  businesses: QbiBusiness[];
  malformedKeys: string[];
} {
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    filingStatusOf(inputs) === "married_filing_jointly",
  );
  const onReturn = businesses.map((business) => ({ ...business, owner: ownerOf(business.value) }));
  const taxpayerCount = onReturn.filter((business) => business.owner === "taxpayer").length;
  const onReturnValues = businesses.map((business) => business.value);
  return {
    businesses: [
      ...qbiRentals(inputs),
      ...onReturn.map(({ key, value, owner }): QbiBusiness => ({
        factKey: key,
        kind: "business",
        owner,
        name: value.name ?? value.activity,
        ein: value.ein,
        specifiedService: value.specifiedService,
        netProfit: netProfit(value, onReturnValues),
        ownersOnlyBusiness: owner === "taxpayer" && taxpayerCount === 1,
        w2WagesPaid: value.w2WagesPaid,
        qualifiedPropertyUbia: value.qualifiedPropertyUbia,
      })),
    ],
    malformedKeys,
  };
}
