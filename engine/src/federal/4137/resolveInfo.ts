import { getTipsFacts, isW2FactKey, type TipsFact, type W2FactValue } from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  missingInputs,
  resolveMustFile,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form4137FilingInfo, TipFiler } from "./filingInfo.js";
import {
  allocatedTipsRow,
  tipIncomeNotOnLine1a,
  tipRowFromRecord,
  tipsSubjectToMedicare,
  type TipRow,
} from "./lines.js";

type Owner = "taxpayer" | "spouse";

interface PlacedW2 {
  key: string;
  slug: string;
  w2: W2FactValue;
  owner: Owner | undefined;
}

/* A line 1 row with the fact it came from and whose tips they are (undefined: not placed). */
interface TipSource {
  key: string;
  owner: Owner | undefined;
  row: TipRow;
}

function w2sOf(inputs: ResolverInputs): PlacedW2[] {
  return inputs.facts
    .filter((fact) => fact.category === "wages" && isW2FactKey(fact.key))
    .map((fact) => {
      const w2 = fact.value as W2FactValue;
      return { key: fact.key, slug: fact.key.split(".")[1], w2, owner: w2Owner(inputs, w2) };
    });
}

/*
 * Whose tip record: everyone's on a return that is not joint; on a joint return
 * the record's owner, else the owner of the employer's W-2 (same slug).
 */
function recordOwner(inputs: ResolverInputs, record: TipsFact, w2s: PlacedW2[]): Owner | undefined {
  const joint =
    inputs.decisionByKey.get("decisions.scope.filing_status") === "married_filing_jointly";
  if (!joint) return "taxpayer";
  if (record.value.owner !== undefined) return record.value.owner;
  return w2s.find((w2) => w2.slug === record.employerSlug)?.owner;
}

/*
 * Line 1 rows: each tip record, then each W-2 with allocated tips (box 8) whose
 * employer has no tip record (irs-4137-form-2025::sec::line-1::b02).
 */
function tipSources(inputs: ResolverInputs, w2s: PlacedW2[]): TipSource[] {
  const records = getTipsFacts(inputs.facts);
  const recorded = new Set(records.map((record) => record.employerSlug));
  return [
    ...records.map((record) => ({
      key: record.key,
      owner: recordOwner(inputs, record, w2s),
      row: tipRowFromRecord(record.value),
    })),
    ...w2s
      .filter(({ w2, slug }) => sum(w2.box8) > 0 && !recorded.has(slug))
      .map(({ key, owner, w2 }) => ({ key, owner, row: allocatedTipsRow(w2) })),
  ];
}

/*
 * Line 8: the person's W-2 boxes 3 and 7 (face-page-1::b02). The engine
 * has no railroad retirement (RRTA) facts, so none is added (line-8::b01).
 */
function socialSecurityWagesAndTips(w2s: PlacedW2[], owner: Owner): number | undefined {
  if (w2s.some((w2) => w2.owner === undefined)) return undefined;
  return sum(...w2s.filter((w2) => w2.owner === owner).flatMap(({ w2 }) => [w2.box3, w2.box7]));
}

/* One copy per person whose line 6 is more than 0, the taxpayer first. */
function filersOf(sources: TipSource[], w2s: PlacedW2[]): TipFiler[] | undefined {
  if (sources.some((source) => source.owner === undefined)) return undefined;
  const owners: Owner[] = ["taxpayer", "spouse"];
  return owners
    .map((owner) => ({
      owner,
      rows: sources.filter((source) => source.owner === owner).map((source) => source.row),
      socialSecurityWagesAndTips: socialSecurityWagesAndTips(w2s, owner),
    }))
    .filter((filer) => tipsSubjectToMedicare(filer.rows) > 0);
}

/*
 * Who files (irs-4137-form-2025::sec::what-s-new::b02): tips of $20 or more in a
 * month not all reported, or W-2 box 8 allocated tips that must be reported.
 * Both leave line 6 above 0 (line 5 holds only the months under $20), so the
 * form files when any person's line 6 is more than 0. Tips only in months under
 * $20 still reach Form 1040 line 1c with no Form 4137 (Pub. 531, Blue Ocean
 * Restaurant, irs-pub-531-2025::sec::reporting-tips-on-your::b03, b04).
 * The explicit decision still wins.
 */
export function resolve4137Info(inputs: ResolverInputs): Form4137FilingInfo {
  const w2s = w2sOf(inputs);
  const sources = tipSources(inputs, w2s);
  const rows = sources.map((source) => source.row);
  const medicareTips = tipsSubjectToMedicare(rows);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4137",
    fallbacks: [
      {
        rule: `fallback: $${medicareTips} of unreported tips owe Medicare tax (Form 4137 line 6)`,
        value: medicareTips > 0,
        triggeredByFactKeys: sources.map((source) => source.key),
      },
    ],
  });
  const filers = filersOf(sources, w2s);
  const unplaced = [
    ...sources.filter((source) => source.owner === undefined).map((source) => source.key),
    ...w2s.filter((w2) => w2.owner === undefined).map((w2) => w2.key),
  ];
  return {
    mustFile: { "form-4137": resolution },
    missingInputs: {
      "form-4137":
        resolution.value === true
          ? missingInputs(Object.fromEntries([...new Set(unplaced)].map((key) => [key, undefined])))
          : [],
    },
    form4137Filers: filers,
    tipIncomeNotOnLine1a: tipIncomeNotOnLine1a(rows),
    employeeCashTips:
      w2s.some(({ w2 }) => sum(w2.box7, w2.box8) > 0) || rows.some((row) => row.received > 0),
    tipsSubjectToMedicareTotal: rows.length === 0 ? undefined : medicareTips,
  };
}
