import {
  TAX_CREDIT_BOND_CARRYFORWARD_KEY,
  type BondTaxCreditStatementFact,
  type TaxCreditBondFact,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import {
  CREB_BOND_TYPE_CODE,
  claimingBonds,
  fromPassThrough,
  heldBondWaits,
  partIIIRows,
  partIVForm,
  passThroughCrebs,
  statementsWithCredit,
} from "./bonds.js";
import type { Form8912FilingInfo } from "./filingInfo.js";

/*
 * A Form 1097-BTC for a CREB waits for the answer whether it came from a
 * pass-through entity, and then for the taxable income of that interest
 * (the line 12 formula, irs-8912-inst-2025::sec::line-12::b02). A statement
 * from the bond's issuer answers the first question itself (fromPassThrough).
 */
function statementWaits({ value }: BondTaxCreditStatementFact): boolean {
  if (value.box3BondType !== CREB_BOND_TYPE_CODE) return false;
  const passThrough = fromPassThrough(value);
  if (passThrough === undefined) return true;
  return passThrough && value.attributableTaxableIncome === undefined;
}

/*
 * A Part IV waits for what its lines need: a held bond its dates, rows and
 * rates, and the answer whether a Form 1099-INT reports the credit as interest
 * (line-20::b01); a pass-through its credit, and for a CREB the taxable income
 * of the interest.
 */
function bondWaits({ value }: TaxCreditBondFact): boolean {
  if (value.source === "held")
    return heldBondWaits(value) || value.creditOnForm1099Int === undefined;
  if (value.passThroughCredit === undefined) return true;
  return value.bondType === "creb" && value.attributableTaxableIncome === undefined;
}

const carryforwardOf = (inputs: ResolverInputs): number | undefined => {
  const value = inputs.factByKey.get(TAX_CREDIT_BOND_CARRYFORWARD_KEY);
  return typeof value === "number" ? value : undefined;
};

/*
 * Who files: "A taxpayer holding a CREB or qualified tax credit bond ... on one
 * or more credit allowance dates can claim the credit by filing Form 8912"
 * (irs-8912-inst-2025::sec::who-can-claim-the-credits::b01). From facts: a Form
 * 1097-BTC with a credit, a bond or pass-through credit the form takes, or a
 * carryforward (line 3). The explicit decision still wins.
 */
export function resolve8912Info(inputs: ResolverInputs): Form8912FilingInfo {
  const statements = statementsWithCredit(inputs);
  const bonds = claimingBonds(inputs);
  const carryforward = carryforwardOf(inputs);
  const triggers = [
    ...statements.map((fact) => fact.key),
    ...bonds.map((fact) => fact.key),
    ...((carryforward ?? 0) > 0 ? [TAX_CREDIT_BOND_CARRYFORWARD_KEY] : []),
  ];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8912",
    fallbacks: [
      {
        rule: `fallback: ${statements.length} Form(s) 1097-BTC, ${bonds.length} bond(s) not reported on one, or a carryforward`,
        value: triggers.length > 0,
        triggeredByFactKeys: triggers,
      },
    ],
  });
  const filed = { mustFile: { "form-8912": resolution } };
  if (resolution.value !== true) return { ...filed, missingInputs: { "form-8912": [] } };
  const partIV = bonds.map(partIVForm);
  return {
    ...filed,
    missingInputs: {
      "form-8912": [
        ...statements.filter(statementWaits).map((fact) => fact.key),
        ...bonds.filter(bondWaits).map((fact) => fact.key),
      ],
    },
    form8912: {
      partIII: partIIIRows(statements),
      partIV,
      carryforward,
      passThroughCrebs: passThroughCrebs(statements, bonds, partIV),
    },
  };
}

export const files8912 = (info: Form8912FilingInfo): boolean =>
  info.mustFile?.["form-8912"]?.value === true;
