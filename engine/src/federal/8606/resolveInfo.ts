import {
  ROTH_IRA_CODES,
  hasDistributionCode,
  isRetirementDistributionFactKey,
  makeTraditionalIraFactKey,
  type IraOwner,
  type RetirementDistributionFactValue,
  type TraditionalIraFactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form8606FilingInfo, IraHolder } from "./filingInfo.js";

const OWNERS: IraOwner[] = ["taxpayer", "spouse"];
const MUST_FILE_KEY = "decisions.scope.must_file_8606";
/* Roth IRA distributions that are not qualified (code Q is). */
const NONQUALIFIED_ROTH_CODES = ["J", "T"];

function ownRows(inputs: ResolverInputs, owner: IraOwner): RetirementDistributionFactValue[] {
  return factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .filter((row) => (row.owner ?? "taxpayer") === owner);
}

function iraHolder(inputs: ResolverInputs, owner: IraOwner): IraHolder {
  const own = ownRows(inputs, owner);
  // Roth IRA rows belong to Part III, which is not modeled.
  const rows = own.filter(
    (row) => row.box7IraSepSimple && !hasDistributionCode(row, ROTH_IRA_CODES),
  );
  return {
    owner,
    ira: inputs.factByKey.get(makeTraditionalIraFactKey(owner)) as
      TraditionalIraFactValue | undefined,
    iraDistributionsGross: rows.length === 0 ? 0 : sum(...rows.map((row) => row.box1)),
    rothDistribution: own.some((row) => hasDistributionCode(row, NONQUALIFIED_ROTH_CODES)),
  };
}

/*
 * irs-8606-inst-2025::sec::who-must-file::b01–b02: nondeductible contributions;
 * a distribution with basis over zero (a rollover or a conversion is not a
 * distribution here); a Roth conversion; or a Roth IRA distribution (codes J,
 * T). Part III is not modeled, so that copy shows Part III blank. No fact marks
 * a Roth rollover or return of contributions, the bullet's exceptions.
 * Inherited IRAs and divorce transfers have no facts yet.
 */
export function mustFile8606(entry: IraHolder): boolean {
  const ira = entry.ira ?? {};
  const basis = (ira.basisPriorYears ?? 0) + (ira.nondeductibleContributions ?? 0);
  const distributed =
    entry.iraDistributionsGross - (ira.rolledOver ?? 0) - (ira.convertedToRoth ?? 0);
  return (
    (ira.nondeductibleContributions ?? 0) > 0 ||
    (ira.convertedToRoth ?? 0) > 0 ||
    (basis > 0 && distributed > 0) ||
    entry.rothDistribution
  );
}

/* Line 6 decides lines 9–12 once Part I can apply: basis, and a distribution or a conversion. */
function needsYearEndValue(entry: IraHolder): boolean {
  const ira = entry.ira;
  if (!ira || ira.yearEndValue !== undefined) return false;
  const basis = (ira.basisPriorYears ?? 0) + (ira.nondeductibleContributions ?? 0);
  const converted = ira.convertedToRoth ?? 0;
  const distributed = entry.iraDistributionsGross - (ira.rolledOver ?? 0) - converted;
  return basis > 0 && (distributed > 0 || converted > 0);
}

export function form8606Filers(inputs: ResolverInputs): IraHolder[] {
  return OWNERS.map((owner) => iraHolder(inputs, owner)).filter(mustFile8606);
}

export function resolve8606Info(inputs: ResolverInputs): Form8606FilingInfo {
  const filers = form8606Filers(inputs);
  const withIra = OWNERS.map((owner) => iraHolder(inputs, owner)).filter(
    (entry) => entry.iraDistributionsGross > 0,
  );
  /* An IRA distribution with no answers yet: whether the form files is still open. */
  const unanswered =
    !inputs.decisionByKey.has(MUST_FILE_KEY) && withIra.some((entry) => entry.ira === undefined);
  return {
    mustFile: {
      "form-8606": unanswered
        ? resolveMustFile(inputs.decisionByKey, { explicitKey: MUST_FILE_KEY })
        : resolveMustFile(inputs.decisionByKey, {
            explicitKey: MUST_FILE_KEY,
            fallbacks: [
              {
                rule: "fallback: nondeductible contributions, a Roth conversion, an IRA distribution with basis, or a Roth IRA distribution (code J or T)",
                value: filers.length > 0,
                triggeredByFactKeys: OWNERS.map(makeTraditionalIraFactKey),
              },
            ],
          }),
    },
    missingInputs: {
      "form-8606": missingInputs(
        Object.fromEntries([
          ...withIra.map((entry) => [makeTraditionalIraFactKey(entry.owner), entry.ira]),
          // The fact is there but line 6 is not: ask for the same fact again.
          ...filers
            .filter(needsYearEndValue)
            .map((entry) => [makeTraditionalIraFactKey(entry.owner), undefined]),
        ]),
      ),
    },
    form8606Filers: filers,
  };
}
