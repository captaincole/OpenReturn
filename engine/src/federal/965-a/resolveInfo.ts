import {
  getSection965DeferredFacts,
  getSection965InclusionFacts,
  getSection965OtherLiabilityFacts,
  getSection965SCorporationFacts,
  makeSection965InclusionFactKey,
  SECTION_965_INCLUSION_YEARS,
  type Section965InclusionValue,
  type Section965SCorporationValue,
} from "../../facts/index.js";
import { sumOrBlank } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form965AFilingInfo, Form965AInputs, PartIITotals } from "./filingInfo.js";
import { inclusionLine, otherLine, type Form965ALine } from "./liabilityLines.js";
import { partIIIYear, partIVRow, partIVTotal, type PartIIIYear } from "./sCorporations.js";

/* One printed form holds 4 other liabilities (lines 5 to 8), 4 S corporations a year (Part III) and 10 Part IV lines. */
export const OTHER_LINES = 4;
export const PART_III_ROWS = 4;
export const PART_IV_ROWS = 10;

export const MORE_THAN_ONE_FORM =
  'The liabilities need more lines than one Form 965-A holds ("an additional Form 965-A should be used", irs-965a-inst-2025::sec::lines-1-through-8::b06; lines-1-through-4::b01); the engine prints one form.';

type Facts = {
  inclusions: ReturnType<typeof getSection965InclusionFacts>;
  others: ReturnType<typeof getSection965OtherLiabilityFacts>;
  sCorporations: ReturnType<typeof getSection965SCorporationFacts>;
  deferred: ReturnType<typeof getSection965DeferredFacts>;
};

function inclusionOf(facts: Facts, year: number): Section965InclusionValue | undefined {
  const key = makeSection965InclusionFactKey(year as (typeof SECTION_965_INCLUSION_YEARS)[number]);
  return facts.inclusions.find((fact) => fact.key === key)?.value;
}

function sCorporationsOf(facts: Facts, year: number): Section965SCorporationValue[] {
  return facts.sCorporations
    .map((fact) => fact.value)
    .filter((value) => value.inclusionYear === year);
}

/* Part II Totals: a gap on any line is a gap; a line still waiting leaves the totals blank. */
function totalsOf(lines: ReadonlyArray<Form965ALine | undefined>, waiting: boolean): PartIITotals {
  const gap = lines.find((line) => line?.gap !== undefined)?.gap;
  if (gap !== undefined) return { remaining: gap, paidThisYear: gap };
  if (waiting) return {};
  const partII = lines.map((line) => line?.partII);
  return {
    remaining: sumOrBlank(...partII.map((line) => line?.remaining)),
    paidThisYear: sumOrBlank(...partII.map((line) => line?.paidThisYear)),
  };
}

/* The printed form from the facts, and the answers it still waits for. */
function form965AOf(facts: Facts): { form: Form965AInputs; missing: string[] } {
  const partIII: Array<PartIIIYear | undefined> = SECTION_965_INCLUSION_YEARS.map((year) => {
    const rows = sCorporationsOf(facts, year);
    return rows.length === 0
      ? undefined
      : partIIIYear(rows, inclusionOf(facts, year)?.netTaxWithout965);
  });
  const missing = SECTION_965_INCLUSION_YEARS.filter(
    (year, index) => partIII[index] !== undefined && inclusionOf(facts, year) === undefined,
  ).map(makeSection965InclusionFactKey);
  const inclusionLines = SECTION_965_INCLUSION_YEARS.map((year, index) => {
    const value = inclusionOf(facts, year);
    return value && inclusionLine(year, value, partIII[index]?.totalDeferred);
  });
  const otherLines = facts.others.map((fact) => otherLine(fact.value));
  facts.others.forEach((fact, index) => {
    if (otherLines[index] === undefined) missing.push(fact.key);
  });
  const lines = [...inclusionLines, ...otherLines];
  const partIV = facts.deferred.map((fact) => partIVRow(fact.value));
  const form: Form965AInputs = {
    lines,
    partIII,
    partIV,
    partIVTotal: partIVTotal(partIV),
    totals: totalsOf(lines, otherLines.includes(undefined)),
  };
  return { form, missing };
}

function overflows(facts: Facts): boolean {
  const perYear = SECTION_965_INCLUSION_YEARS.map((year) => sCorporationsOf(facts, year).length);
  return (
    facts.others.length > OTHER_LINES ||
    perYear.some((count) => count > PART_III_ROWS) ||
    facts.deferred.length > PART_IV_ROWS
  );
}

/*
 * Who files: "Any individual taxpayer ... who has a net 965 tax liability for
 * any tax year or has any net 965 tax liability remaining unpaid at any time
 * during a tax year must file this form" (irs-965a-inst-2025::sec::who-must-file::b01),
 * deferred S corporation liabilities included (general-instructions::b02). A
 * section 965 fact is a line of last year's form that still reports, so any
 * one files the form. The explicit decision still wins.
 */
export function resolve965AInfo(inputs: ResolverInputs): Form965AFilingInfo {
  const facts: Facts = {
    inclusions: getSection965InclusionFacts(inputs.facts),
    others: getSection965OtherLiabilityFacts(inputs.facts),
    sCorporations: getSection965SCorporationFacts(inputs.facts),
    deferred: getSection965DeferredFacts(inputs.facts),
  };
  const keys = [facts.inclusions, facts.others, facts.sCorporations, facts.deferred].flatMap(
    (group) => group.map((fact) => fact.key),
  );
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_965_a",
    fallbacks: [
      {
        rule: `fallback: ${keys.length} section 965 fact(s) from last year's Form 965-A`,
        value: keys.length > 0,
        triggeredByFactKeys: keys,
      },
    ],
  });
  const filed = { mustFile: { "form-965-a": mustFile } };
  if (mustFile.value !== true) return filed;
  if (overflows(facts)) return { ...filed, form965AGap: MORE_THAN_ONE_FORM };
  const { form, missing } = form965AOf(facts);
  return { ...filed, missingInputs: { "form-965-a": missing }, form965A: form };
}
