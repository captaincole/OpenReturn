import {
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
import type { Form8606FilingInfo, Form8606Person } from "./filingInfo.js";

const OWNERS: IraOwner[] = ["taxpayer", "spouse"];
const MUST_FILE_KEY = "decisions.scope.must_file_8606";
const DISTRIBUTION_KEY_RE = /^payer\.[^.]+\.distributions\.[^.]+$/;
/* Roth IRA codes (J, Q, T) belong to Part III, which is not modeled. */
const ROTH_CODES = /[JQT]/;

function iraRows(inputs: ResolverInputs, owner: IraOwner): RetirementDistributionFactValue[] {
  return factsInCategory(inputs, "retirement")
    .filter((row) => DISTRIBUTION_KEY_RE.test(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .filter((row) => row.box7IraSepSimple && !ROTH_CODES.test(row.box7))
    .filter((row) => (row.owner ?? "taxpayer") === owner);
}

function person(inputs: ResolverInputs, owner: IraOwner): Form8606Person {
  const rows = iraRows(inputs, owner);
  return {
    owner,
    ira: inputs.factByKey.get(makeTraditionalIraFactKey(owner)) as
      TraditionalIraFactValue | undefined,
    iraDistributionsGross: rows.length === 0 ? 0 : sum(...rows.map((row) => row.box1)),
  };
}

/*
 * irs-8606-inst-2025::sec::who-must-file::b01–b02: nondeductible contributions;
 * a distribution with basis over zero (a rollover or a conversion is not a
 * distribution here); or a Roth conversion. Roth IRA distributions, inherited
 * IRAs and divorce transfers have no facts yet.
 */
export function mustFile8606(entry: Form8606Person): boolean {
  const ira = entry.ira ?? {};
  const basis = (ira.basisPriorYears ?? 0) + (ira.nondeductibleContributions ?? 0);
  const distributed =
    entry.iraDistributionsGross - (ira.rolledOver ?? 0) - (ira.convertedToRoth ?? 0);
  return (
    (ira.nondeductibleContributions ?? 0) > 0 ||
    (ira.convertedToRoth ?? 0) > 0 ||
    (basis > 0 && distributed > 0)
  );
}

export function form8606Persons(inputs: ResolverInputs): Form8606Person[] {
  return OWNERS.map((owner) => person(inputs, owner)).filter(mustFile8606);
}

export function resolve8606Info(inputs: ResolverInputs): Form8606FilingInfo {
  const persons = form8606Persons(inputs);
  const withIra = OWNERS.map((owner) => person(inputs, owner)).filter(
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
                rule: "fallback: nondeductible contributions, a Roth conversion, or an IRA distribution with basis",
                value: persons.length > 0,
                triggeredByFactKeys: OWNERS.map(makeTraditionalIraFactKey),
              },
            ],
          }),
    },
    missingInputs: {
      "form-8606": missingInputs(
        Object.fromEntries(
          withIra.map((entry) => [makeTraditionalIraFactKey(entry.owner), entry.ira]),
        ),
      ),
    },
    form8606Persons: persons,
  };
}
