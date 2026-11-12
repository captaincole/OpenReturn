import { businessesOnReturn, ownerOf } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { netProfit } from "../schedule-c/lines.js";
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
    businesses: onReturn.map(({ key, value, owner }) => ({
      factKey: key,
      owner,
      name: value.name ?? value.activity,
      ein: value.ein,
      specifiedService: value.specifiedService,
      netProfit: netProfit(value, onReturnValues),
      ownersOnlyBusiness: owner === "taxpayer" && taxpayerCount === 1,
      w2WagesPaid: value.w2WagesPaid,
      qualifiedPropertyUbia: value.qualifiedPropertyUbia,
    })),
    malformedKeys,
  };
}
