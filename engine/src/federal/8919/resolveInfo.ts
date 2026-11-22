import {
  getUncollectedWagesFacts,
  isW2FactKey,
  type UncollectedWagesFact,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";
import { form4137Lines } from "../4137/lines.js";
import { resolve4137Info } from "../4137/resolveInfo.js";
import type { Form8919FilingInfo, WageFiler } from "./filingInfo.js";
import { totalWages, waitsForDetermination, type FirmRow } from "./lines.js";

type Owner = "taxpayer" | "spouse";

const OWNERS: Owner[] = ["taxpayer", "spouse"];

interface PlacedFirm {
  key: string;
  owner: Owner | undefined;
  row: FirmRow;
}

/* Whose pay: everyone's on a return that is not joint; on a joint return the fact's owner. */
function placeFirm(joint: boolean, fact: UncollectedWagesFact): PlacedFirm {
  const { value } = fact;
  const row: FirmRow = {
    firmName: value.firmName,
    firmTin: value.firmTin,
    reasonCode: value.reasonCode,
    determinationDate: value.determinationDate,
    received1099: value.received1099,
    wages: value.wages,
  };
  return { key: fact.key, owner: joint ? value.owner : "taxpayer", row };
}

interface PlacedW2 {
  key: string;
  w2: W2FactValue;
  owner: Owner | undefined;
}

function w2sOf(inputs: ResolverInputs): PlacedW2[] {
  return factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => {
      const w2 = row.value as W2FactValue;
      return { key: row.key, w2, owner: w2Owner(inputs, w2) };
    });
}

/* The W-2 boxes 3 and 7 of one person, cents kept; undefined while a W-2 cannot be placed. */
function w2SocialSecurityWages(w2s: PlacedW2[], owner: Owner): number | undefined {
  if (w2s.some((w2) => w2.owner === undefined)) return undefined;
  return sum(...w2s.filter((w2) => w2.owner === owner).flatMap(({ w2 }) => [w2.box3, w2.box7]));
}

/*
 * The person's Form 4137 line 10 (unreported tips subject to social security
 * tax), 0 when the person files none; undefined while it waits.
 */
function tipsLine10(info: Form4137FilingInfo, owner: Owner): number | undefined {
  if (info.mustFile?.["form-4137"]?.value !== true) return 0;
  if (info.form4137Filers === undefined) return undefined;
  const filer = info.form4137Filers.find((each) => each.owner === owner);
  if (filer === undefined) return 0;
  return form4137Lines(filer.rows, filer.socialSecurityWagesAndTips).line10;
}

/*
 * Line 8 (omb-no-1545-0074::b02): "total of boxes 3 and 7 on Form(s) W-2 ...
 * and unreported tips subject to social security tax from Form 4137, line 10".
 * The engine has no railroad retirement (RRTA) facts, so none is added (line-8::b01).
 */
function socialSecurityWagesAndTips(
  inputs: ResolverInputs,
  w2s: PlacedW2[],
  owner: Owner,
): number | undefined {
  const w2 = w2SocialSecurityWages(w2s, owner);
  const tips = tipsLine10(resolve4137Info(inputs), owner);
  return w2 === undefined || tips === undefined ? undefined : sum(w2, tips);
}

/* One copy per person whose line 6 is more than 0, the taxpayer first. */
function filersOf(
  inputs: ResolverInputs,
  firms: PlacedFirm[],
  w2s: PlacedW2[],
): WageFiler[] | undefined {
  if (firms.some((firm) => firm.owner === undefined)) return undefined;
  return OWNERS.map((owner) => ({
    owner,
    rows: firms.filter((firm) => firm.owner === owner).map((firm) => firm.row),
  }))
    .filter((filer) => totalWages(filer.rows) > 0)
    .map((filer) => ({
      ...filer,
      socialSecurityWagesAndTips: socialSecurityWagesAndTips(inputs, w2s, filer.owner),
    }));
}

/*
 * Who files (irs-8919-form-2025::sec::omb-no-1545-0074::b01): a worker the firm
 * treated as an independent contractor, who believes the pay was wages, whose
 * share of social security and Medicare tax the firm did not withhold, and to
 * whom a reason code applies. A firm fact states all four, so the form files
 * when the firms' pay is more than 0. The explicit decision still wins.
 * A firm waits when a joint return does not say whose pay it is, or when code A
 * or C has no date for column (d); line 8 waits for a W-2 a joint return cannot place.
 */
export function resolve8919Info(inputs: ResolverInputs): Form8919FilingInfo {
  const facts = getUncollectedWagesFacts(inputs.facts);
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const firms = facts.map((fact) => placeFirm(joint, fact));
  const total = totalWages(firms.map((firm) => firm.row));
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8919",
    fallbacks: [
      {
        rule: `fallback: $${total} of wages with no social security or Medicare tax withheld (Form 8919 line 6)`,
        value: total > 0,
        triggeredByFactKeys: facts.map((fact) => fact.key),
      },
    ],
  });
  const w2s = w2sOf(inputs);
  const open = [
    ...firms
      .filter((firm) => firm.owner === undefined || waitsForDetermination(firm.row))
      .map((firm) => firm.key),
    ...w2s.filter((w2) => w2.owner === undefined).map((w2) => w2.key),
  ];
  return {
    mustFile: { "form-8919": resolution },
    missingInputs: {
      "form-8919":
        resolution.value === true
          ? missingInputs(Object.fromEntries(open.map((key) => [key, undefined])))
          : [],
    },
    form8919Filers: filersOf(inputs, firms, w2s),
    uncollectedWagesTotal: resolution.value === true && firms.length > 0 ? total : undefined,
  };
}
