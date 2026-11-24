import {
  FOREIGN_ASSET_KEYS,
  getForeignFinancialAssetFacts,
  type ExceptedFormsFactValue,
  type ForeignFinancialAssetFact,
} from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ForeignAccountOnReturn, Form8938Figured, Form8938FilingInfo } from "./filingInfo.js";
import { dollarsOf } from "./lines.js";
import { assetTaxItems, categoryItems } from "./partIII.js";
import { partIILines, partILines, partVIRows, partVRows, type ReportedAsset } from "./rows.js";
import { thresholdTest } from "./threshold.js";

/*
 * The assets of this return. A joint return files "one combined Form 8938"
 * with every asset of either spouse; a separate return leaves out the
 * spouse's own assets (irs-8938-inst-2025::sec::joint-interest-valuation::b01,
 * married-specified-individuals-2::b01).
 */
function assetsOnReturn(inputs: ResolverInputs, jointReturn: boolean): ForeignFinancialAssetFact[] {
  return getForeignFinancialAssetFacts(inputs.facts).filter(
    (asset) => jointReturn || asset.value.owner !== "spouse",
  );
}

const assetsOfReturn = (inputs: ResolverInputs) =>
  assetsOnReturn(inputs, filingStatusOf(inputs) === "married_filing_jointly");

/*
 * A financial account for Schedule B line 7a: every Part V account, and a
 * Part VI asset the person answered is one ("shares in a mutual fund or
 * similar pooled fund", an insurance or annuity policy with a cash value,
 * irs-1040sb-inst-2025::sec::line-7a-question-1-check-the-yes-box-if-at-any-time::b01).
 */
const isFinancialAccount = ({ value }: ForeignFinancialAssetFact) =>
  value.part !== "other_asset" || value.financialAccount === true;

/* The country of the account: the institution's, else the entity's, else the first issuer's. */
const countryOf = ({ value }: ForeignFinancialAssetFact) =>
  value.institution?.address.country ??
  value.entity?.address.country ??
  value.issuers?.[0]?.address.country;

/* The foreign financial accounts of the return, in the order recorded: Schedule B line 7 reads them. */
export function foreignAccountsOnReturn(inputs: ResolverInputs): ForeignAccountOnReturn[] {
  return assetsOfReturn(inputs)
    .filter(isFinancialAccount)
    .map((asset) => ({
      country: countryOf(asset),
      maximumDollars: dollarsOf(asset.value.maximumValue, asset.value.conversion?.exchangeRate),
    }));
}

/*
 * The fact keys of the Part VI assets of the return that do not say whether
 * they are a financial account (`financialAccount`). Schedule B asks for them.
 */
export function unansweredOtherAssetKeys(inputs: ResolverInputs): string[] {
  return assetsOfReturn(inputs)
    .filter(
      (asset) =>
        asset.value.part === "other_asset" && typeof asset.value.financialAccount !== "boolean",
    )
    .map((asset) => asset.key);
}

/*
 * Part IV (irs-8938-inst-2025::sec::part-iv::b01): the number of each form
 * filed. Read only when an asset is reported on one of them; it then waits
 * for the counts.
 */
function exceptedFormsOf(inputs: ResolverInputs, assets: ForeignFinancialAssetFact[]) {
  const needed = assets.some((asset) => asset.value.reportedOnOtherForm === true);
  const value = inputs.factByKey.get(FOREIGN_ASSET_KEYS.exceptedForms);
  const counts =
    typeof value === "object" && value !== null ? (value as ExceptedFormsFactValue) : undefined;
  return { counts: needed ? counts : undefined, waits: needed && counts === undefined };
}

/*
 * Parts I, II, III, V and VI from the assets not reported on another form
 * ("You do not have to report any asset on Form 8938 if you report it on one
 * or more of the following forms", exceptions-to-reporting::b01). Each copy
 * prints one Part V account and one Part VI page (specific-instructions::b01,
 * "make additional copies of page 2").
 */
function figure(
  inputs: ResolverInputs,
  assets: ForeignFinancialAssetFact[],
  exceptedForms: ExceptedFormsFactValue | undefined,
): Form8938Figured {
  const reported: ReportedAsset[] = assets
    .filter((asset) => asset.value.reportedOnOtherForm !== true)
    .map((fact) => ({ fact, items: assetTaxItems(inputs, fact.accountSlug) }));
  const partV = partVRows(reported);
  const partVI = partVIRows(reported);
  const itemsOf = (accounts: boolean) =>
    categoryItems(
      reported
        .filter((asset) => (asset.fact.value.part !== "other_asset") === accounts)
        .map((asset) => asset.items),
    );
  return {
    partV,
    partVI,
    partI: partILines(partV),
    partII: partIILines(partVI),
    accounts: itemsOf(true),
    otherAssets: itemsOf(false),
    exceptedForms,
    copies: Math.max(1, partV.length, partVI.length),
  };
}

/*
 * Who files (who-must-file::b01): the threshold test (threshold.ts), unless no
 * income tax return is required ("Exception if no income tax return
 * required"). The explicit decision still wins.
 */
export function resolve8938Info(inputs: ResolverInputs): Form8938FilingInfo {
  const jointReturn = filingStatusOf(inputs) === "married_filing_jointly";
  const assets = assetsOnReturn(inputs, jointReturn);
  const test = thresholdTest(inputs, assets, jointReturn);
  const noReturnRequired = inputs.decisionByKey.get("decisions.scope.must_file_federal") === false;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8938",
    fallbacks: [
      {
        rule: `fallback: ${test.rule}${noReturnRequired ? "; no income tax return required" : ""}`,
        value: test.files && !noReturnRequired,
        triggeredByFactKeys: assets.map((asset) => asset.key),
      },
    ],
  });
  const foreignAccounts = foreignAccountsOnReturn(inputs);
  const filed = { mustFile: { "form-8938": mustFile }, foreignAccounts };
  if (mustFile.value !== true) return filed;
  const excepted = exceptedFormsOf(inputs, assets);
  // With the explicit decision the threshold answers are not needed.
  const decided = typeof inputs.decisionByKey.get("decisions.scope.must_file_8938") === "boolean";
  const waits = [
    ...(decided ? [] : test.waitsFor),
    ...(excepted.waits ? [FOREIGN_ASSET_KEYS.exceptedForms] : []),
  ];
  return {
    ...filed,
    missingInputs: { "form-8938": waits },
    form8938: figure(inputs, assets, excepted.counts),
  };
}
