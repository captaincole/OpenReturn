import {
  ROTH_IRA_CODES,
  hasDistributionCode,
  isRetirementDistributionFactKey,
  makeRothIraFactKey,
  makeTraditionalIraFactKey,
  readRothIraFact,
  readTraditionalIraFact,
  type IraOwner,
  type RetirementDistributionFactValue,
  type TraditionalIraFactValue,
} from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form8606FilingInfo, IraHolder } from "./filingInfo.js";
import { NONQUALIFIED_ROTH_CODES, partIIIFigures } from "./partIII.js";

const OWNERS: IraOwner[] = ["taxpayer", "spouse"];
const MUST_FILE_KEY = "decisions.scope.must_file_8606";

function ownRows(inputs: ResolverInputs, owner: IraOwner): RetirementDistributionFactValue[] {
  return factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .filter((row) => (row.owner ?? "taxpayer") === owner);
}

/* irs-8606-inst-2025::sec::line-7::b01: a qualified charitable distribution (code Y) is not on line 7. */
const NOT_ON_FORM_8606 = [...ROTH_IRA_CODES, "Y"];

/*
 * The Part I bullets on the form: nondeductible contributions, or basis with a
 * distribution or with a conversion of part, but not all, of the IRAs.
 */
function partIApplies(ira: TraditionalIraFactValue, basis: number, line7: number): boolean {
  const partialConversion = (ira.convertedToRoth ?? 0) > 0 && (ira.yearEndValue ?? 0) > 0;
  return (
    (ira.nondeductibleContributions ?? 0) > 0 || (basis > 0 && (line7 > 0 || partialConversion))
  );
}

function iraHolder(inputs: ResolverInputs, owner: IraOwner): IraHolder {
  const own = ownRows(inputs, owner);
  // Roth IRA rows belong to Part III (partIII.ts); code Y rows are on no line.
  const rows = own.filter(
    (row) => row.box7IraSepSimple && !hasDistributionCode(row, NOT_ON_FORM_8606),
  );
  const ira = readTraditionalIraFact(inputs.factByKey, owner);
  const rothRows = own.filter((row) => hasDistributionCode(row, NONQUALIFIED_ROTH_CODES));
  const gross = rows.length === 0 ? 0 : sum(...rows.map((row) => row.box1));
  const basis = (ira?.nondeductibleContributions ?? 0) + (ira?.basisPriorYears ?? 0);
  const line7 = atLeast(0, gross - (ira?.rolledOver ?? 0) - (ira?.convertedToRoth ?? 0));
  return {
    owner,
    ira,
    iraDistributionsGross: gross,
    basis,
    line7,
    partI: ira !== undefined && partIApplies(ira, basis, line7),
    rothDistribution: rothRows.length > 0,
    rothRows,
    roth: readRothIraFact(inputs.factByKey, owner),
  };
}

/*
 * irs-8606-inst-2025::sec::who-must-file::b01–b02: nondeductible contributions;
 * a distribution with basis over zero (a rollover or a conversion is not a
 * distribution here); a Roth conversion; or a Roth IRA distribution (codes J,
 * T). Part III reads the Roth IRA answers (partIII.ts); their notOnLine19 holds a
 * Roth rollover or a return of contributions, the bullet's exceptions.
 * Inherited IRAs and divorce transfers have no facts yet.
 */
export function mustFile8606(holder: IraHolder): boolean {
  const ira = holder.ira ?? {};
  return (
    (ira.nondeductibleContributions ?? 0) > 0 ||
    (ira.convertedToRoth ?? 0) > 0 ||
    (holder.basis > 0 && holder.line7 > 0) ||
    holder.rothDistribution
  );
}

/*
 * The fact is there, but a line it must give is not: line 6 decides lines 9–12
 * once basis meets a distribution or a conversion, and line 4 splits a line 1
 * above zero (irs-8606-inst-2025::sec::line-4::b01).
 */
function needsMoreAnswers(holder: IraHolder): boolean {
  const ira = holder.ira;
  if (!ira) return false;
  const distributedOrConverted = holder.line7 > 0 || (ira.convertedToRoth ?? 0) > 0;
  const needsYearEndValue =
    ira.yearEndValue === undefined && holder.basis > 0 && distributedOrConverted;
  const needsLine4 =
    holder.partI &&
    distributedOrConverted &&
    (ira.nondeductibleContributions ?? 0) > 0 &&
    ira.contributionsMadeIn2026 === undefined;
  return needsYearEndValue || needsLine4;
}

/* Part III needs line 22's basis once line 21 is above 0, and line 24's once line 23 is. */
function rothAnswersComplete(holder: IraHolder): boolean {
  if (!holder.roth) return false;
  const figures = partIIIFigures(holder.rothRows, holder.roth);
  if (figures.line21 > 0 && figures.line22 === undefined) return false;
  return !((figures.line23 ?? 0) > 0 && figures.line24 === undefined);
}

export function form8606Filers(inputs: ResolverInputs): IraHolder[] {
  return OWNERS.map((owner) => iraHolder(inputs, owner)).filter(mustFile8606);
}

export function resolve8606Info(inputs: ResolverInputs): Form8606FilingInfo {
  const filers = form8606Filers(inputs);
  const withIra = OWNERS.map((owner) => iraHolder(inputs, owner)).filter(
    (holder) => holder.iraDistributionsGross > 0,
  );
  /* An IRA distribution with no answers yet: whether the form files is still open. */
  const unanswered =
    !inputs.decisionByKey.has(MUST_FILE_KEY) && withIra.some((holder) => holder.ira === undefined);
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
          ...withIra.map((holder) => [makeTraditionalIraFactKey(holder.owner), holder.ira]),
          // Part III needs the person's Roth IRA answers.
          ...filers
            .filter((holder) => holder.rothDistribution)
            .map((holder) => [
              makeRothIraFactKey(holder.owner),
              holder.roth && rothAnswersComplete(holder) ? holder.roth : undefined,
            ]),
          // The fact is there but a line it gives is not: ask for the same fact again.
          ...filers
            .filter(needsMoreAnswers)
            .map((holder) => [makeTraditionalIraFactKey(holder.owner), undefined]),
        ]),
      ),
    },
    form8606Filers: filers,
  };
}
