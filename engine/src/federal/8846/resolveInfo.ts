import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { k1EntitiesWithRoute } from "../passThrough/receipts.js";
import { tipCreditFigures, type TipCreditFigures } from "./figures.js";
import type { Form8846FilingInfo, K1TipCredits } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8846";

/* The K-1 detail of box 15 (Form 1065) or box 13 (Form 1120-S) code N (federal/passThrough). */
export const K1_TIP_CREDIT_DETAIL = "employer_social_security_on_tips";

const K1_AMOUNT_GAP =
  "A K-1 reports the credit for employer social security and Medicare taxes (code N) with no amount; the entity's statement gives it.";

export const isJointForBusinesses = (inputs: ResolverInputs) => {
  const status = filingStatusOf(inputs);
  return status === undefined || status === "married_filing_jointly";
};

/* The return's own figures; every resolver that reads them calls this one function. */
export const tipCreditFiguresOf = (inputs: ResolverInputs): TipCreditFigures =>
  tipCreditFigures(inputs.facts, isJointForBusinesses(inputs));

/*
 * Line 5: "Credit for employer social security and Medicare taxes paid on
 * certain employee tips from partnerships and S corporations"
 * (irs-8846-form-2025::sec::face-page-1::b01): each K-1's code N in whole
 * dollars, as Form 3800 takes it (3800/k1Credits.ts). Undefined with none.
 */
export function k1TipCreditsOf(inputs: ResolverInputs): K1TipCredits | undefined {
  const items = k1EntitiesWithRoute(inputs, "form_3800").filter(
    ({ item }) => item.detail === K1_TIP_CREDIT_DETAIL,
  );
  if (items.length === 0) return undefined;
  if (items.some(({ item }) => item.amount === undefined)) return { gap: K1_AMOUNT_GAP };
  return { amount: sum(...items.map(({ item }) => roundDollars(item.amount))) };
}

/*
 * Who files: an employer whose employees received tips for food or beverage
 * service or for beauty services, who paid employer social security and
 * Medicare taxes on them (irs-8846-form-2025::sec::who-should-file::b01). A
 * tip credit fact the owner does not elect out of files it. A taxpayer whose
 * only source is a partnership or S corporation is "not required to complete
 * or file this form", and reports the credit "directly on line 4f in Part III
 * of Form 3800" (purpose-of-form::b01): a K-1 alone does not file it. The
 * explicit decision still wins; with it true, line 5 holds the K-1 credits.
 */
export function resolve8846Info(inputs: ResolverInputs): Form8846FilingInfo {
  const figures = tipCreditFiguresOf(inputs);
  const keys = [...figures.credits.map((credit) => credit.key), ...figures.missing];
  const own =
    figures.credits.length > 0 || figures.gap !== undefined || figures.malformedKeys.length > 0;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${new Set(keys).size} tip credit fact(s) of the taxpayer's own business`,
        value: own,
        triggeredByFactKeys: [...new Set([...keys, ...figures.malformedKeys])],
      },
    ],
  });
  const filed = { mustFile: { "form-8846": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8846": [] } };
  return {
    ...filed,
    missingInputs: { "form-8846": [...figures.missing, ...figures.malformedKeys] },
    form8846: {
      lines: figures.lines,
      ownCredit: own,
      overWageBase: figures.overWageBase,
      gap: figures.gap,
      k1Credits: k1TipCreditsOf(inputs),
    },
  };
}
