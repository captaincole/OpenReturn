import {
  getCaFilmCreditFacts,
  type CaFilmCreditFact,
  type CaFilmCreditFactValue,
} from "../../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { FilmCertificate, Form3541FilingInfo } from "./filingInfo.js";
import { programOf } from "./lines.js";

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const filled = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
const SOURCES = ["generated", "pass_through", "purchased"] as const;
const sourceOf = (value: unknown) => SOURCES.find((source) => source === value);

function certificateOf(fact: CaFilmCreditFact): FilmCertificate {
  const value = fact.value ?? ({} as Partial<CaFilmCreditFactValue>);
  return {
    factKey: fact.key,
    certificateNumber: finite(value.certificateNumber),
    yearIssued: finite(value.yearIssued),
    copyrightRegistrationNumber: filled(value.copyrightRegistrationNumber),
    source: sourceOf(value.source),
    credit: finite(value.credit),
    carryover: finite(value.carryoverFromPriorYear),
    appliedToSalesAndUseTax: finite(value.appliedToSalesAndUseTax) ?? 0,
    soldToOthers: finite(value.soldToOthers) ?? 0,
    purchasePrice: finite(value.purchasePrice),
    owner: value.owner,
    throughDisregardedEntity: value.throughDisregardedEntity === true,
    refundableElection: value.refundableElection === true,
  };
}

/* A certificate counts unless both its credit and its carryover are stated as 0. */
const hasCredit = (row: FilmCertificate) =>
  row.credit === undefined || row.carryover === undefined || row.credit > 0 || row.carryover > 0;

const certificatesOf = (inputs: ResolverInputs) =>
  getCaFilmCreditFacts(inputs.facts).map(certificateOf).filter(hasCredit);

/* The owner of a credit the taxpayer did not generate is named on the certificate. */
const ownerComplete = (row: FilmCertificate) =>
  row.source === "generated" ||
  (filled(row.owner?.name) !== undefined && filled(row.owner?.idNumber) !== undefined);

/* Every answer a form needs is stated: a purchased credit also needs its price. */
function complete(row: FilmCertificate): boolean {
  const stated = [
    row.certificateNumber,
    row.yearIssued,
    row.copyrightRegistrationNumber,
    row.source,
    row.credit,
    row.carryover,
  ].every((value) => value !== undefined);
  const price = row.source !== "purchased" || row.purchasePrice !== undefined;
  return stated && price && ownerComplete(row);
}

/* The credit codes on the return (Schedule P (540) reads them), and the facts behind them. */
export function caFilmCreditCodesClaimed(inputs: ResolverInputs): {
  codes: string[];
  factKeys: string[];
} {
  const rows = certificatesOf(inputs);
  const codes = rows.flatMap((row) => {
    const program =
      row.certificateNumber === undefined ? undefined : programOf(row.certificateNumber);
    return program === undefined ? [] : [program.code];
  });
  return { codes: [...new Set(codes)], factKeys: rows.map((row) => row.factKey) };
}

/*
 * Who files: an individual reports a credit "Allocated on the CFC Tax Credit
 * Certificate", "Passed through from S corporations, estates, trusts,
 * partnerships, or LLCs" or "Purchased from a qualified taxpayer", and
 * attaches the form to Form 540 or Form 540NR (ca-3541-inst-2025::sec::a-purpose::b01,
 * ::b02); a carryover is reported on line 5a. The form files on a California
 * return with a certificate whose credit or carryover is above 0 (an answer
 * not stated yet counts, so it is asked). The explicit decision still wins.
 */
export function resolve3541Info(inputs: ResolverInputs): Form3541FilingInfo {
  const filesCalifornia =
    inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true ||
    inputs.decisionByKey.get("decisions.scope.must_file_540nr") === true;
  const rows = certificatesOf(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3541",
    fallbacks: [
      {
        rule: `fallback: a California return (${filesCalifornia}) with ${rows.length} film credit certificate(s) above 0`,
        value: filesCalifornia && rows.length > 0,
        triggeredByFactKeys: rows.map((row) => row.factKey),
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_ca_540",
          "decisions.scope.must_file_540nr",
        ],
      },
    ],
  });
  const files = resolution.value === true;
  return {
    mustFile: { "form-3541": resolution },
    /* Each certificate while an answer inside it is missing. */
    missingInputs: {
      "form-3541": files ? rows.filter((row) => !complete(row)).map((row) => row.factKey) : [],
    },
    filmCertificates: files ? rows : [],
  };
}
