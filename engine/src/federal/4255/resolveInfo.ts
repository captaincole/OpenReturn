import {
  getCreditRecaptureFacts,
  hasCreditRecaptureFacts,
  makeCreditRecaptureLineFactKey,
  type CreditRecaptureFacts,
  type Form4255Line,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { LINE_COLUMNS } from "./columns.js";
import type { Form4255FilingInfo, Form4255Result } from "./filingInfo.js";
import {
  partThreeLines,
  partTwoTotals,
  prevailingWageRecapture,
  propertyIncreaseInTax,
  propertyLines,
  type PartThreeLines,
  type PropertyLines,
} from "./lines.js";
import {
  partOneRow,
  partOneTotals,
  rowHasAmount,
  type PartOneRow,
  type RecaptureEvent,
} from "./partOne.js";

/* "If you need to list additional properties, complete and attach additional Forms 4255" (irs-4255-inst-2025::sec::part-ii::b01). */
const PROPERTY_COLUMNS = 4;
const MORE_THAN_FOUR =
  "More than four Part II properties: the instructions attach more Forms 4255 (irs-4255-inst-2025::sec::part-ii::b01), and the engine prints one copy.";
const MORE_THAN_ONE_FACILITY =
  "More than one hydrogen facility: Part III has one column, and the engine prints one copy of Form 4255.";
const NO_WORKSHEET_1 =
  "A Part II property has credit subject to recapture on line 7 but states no Section C amounts (line 3 and the Worksheet 1 amount for line 8, irs-4255-inst-2025::sec::line-8::b01).";
const BY_DECISION_ONLY =
  "Form 4255 files by decision, but no fact states a recapture, an excessive payment or a penalty.";
const EMISSIONS_TIER_LINE: Form4255Line = "1j";

type Figured =
  | { kind: "gap"; reason: string }
  | { kind: "waits"; missing: string[] }
  | { kind: "figured"; result: Form4255Result };

/* Each line's recapture events: Part II properties, Part III, Worksheet 3 and amounts figured elsewhere. */
function eventsByLine(
  found: CreditRecaptureFacts,
  properties: ReadonlyArray<{ line: Form4255Line; lines: PropertyLines }>,
  partThree: PartThreeLines | undefined,
): Map<Form4255Line, RecaptureEvent[]> {
  const events = new Map<Form4255Line, RecaptureEvent[]>();
  const add = (line: Form4255Line, event: RecaptureEvent) =>
    events.set(line, [...(events.get(line) ?? []), event]);
  for (const { line, lines } of properties)
    add(line, {
      increaseInTax: propertyIncreaseInTax(lines),
      carryoverReduction: lines.sectionD?.carryoverReduction ?? 0,
      percent: lines.sectionD?.line15,
    });
  if (partThree !== undefined)
    add(EMISSIONS_TIER_LINE, { increaseInTax: partThree.line9, carryoverReduction: 0 });
  for (const { line, value } of found.lines) {
    for (const entry of value.prevailingWageRecaptures ?? []) {
      const { percent, increaseInTax } = prevailingWageRecapture(entry);
      add(line, { increaseInTax, carryoverReduction: 0, percent });
    }
    const other = value.otherRecapture;
    if (other !== undefined)
      add(line, {
        increaseInTax: other.increaseInTax,
        carryoverReduction: other.carryoverReduction ?? 0,
        percent: other.percentage === undefined ? undefined : other.percentage * 100,
      });
  }
  return events;
}

/* The fact-level checks that stop the whole form. */
function factGap(found: CreditRecaptureFacts): string | undefined {
  if (found.unknownLineKeys.length > 0)
    return `Form 4255 has no line for the fact ${found.unknownLineKeys[0]}.`;
  if (found.properties.length > PROPERTY_COLUMNS) return MORE_THAN_FOUR;
  if (found.facilities.length > 1) return MORE_THAN_ONE_FACILITY;
  const offLine = found.properties.find(({ value }) => !LINE_COLUMNS[value.line]?.includes("h"));
  if (offLine !== undefined)
    return `Form 4255 line ${offLine.value.line} has no recapture column (h) for the property ${offLine.key}.`;
  const unnamed = found.lines.find(
    ({ line, value }) => (line === "1z" || line === "2z") && !value.otherForm,
  );
  if (unnamed !== undefined)
    return `Form 4255 line ${unnamed.line} needs the form the credit came from.`;
  return undefined;
}

/* Part I rows, or the first line's gap. */
function partOne(
  lines: CreditRecaptureFacts["lines"],
  events: Map<Form4255Line, RecaptureEvent[]>,
): Partial<Record<Form4255Line, PartOneRow>> | string {
  const rows: Partial<Record<Form4255Line, PartOneRow>> = {};
  for (const { line, value } of lines) {
    const row = partOneRow(line, value, events.get(line) ?? []);
    if (typeof row === "string") return row;
    rows[line] = row;
  }
  return rows;
}

const otherFormOf = (found: CreditRecaptureFacts, line: "1z" | "2z") =>
  found.lines.find((each) => each.line === line)?.value.otherForm;

function figure(found: CreditRecaptureFacts): Figured {
  const gap = factGap(found);
  if (gap !== undefined) return { kind: "gap", reason: gap };
  const properties = found.properties.map(({ value }) => ({
    line: value.line,
    lines: propertyLines(value),
  }));
  if (properties.some((each) => each.lines === undefined))
    return { kind: "gap", reason: NO_WORKSHEET_1 };
  const figuredProperties = properties as Array<{ line: Form4255Line; lines: PropertyLines }>;
  const facility = found.facilities[0];
  const partThree = facility === undefined ? undefined : partThreeLines(facility.value);
  const events = eventsByLine(found, figuredProperties, partThree);
  const stated = new Set(found.lines.map((each) => each.line));
  const missing = [...events.keys()]
    .filter((line) => !stated.has(line))
    .map(makeCreditRecaptureLineFactKey);
  if (missing.length > 0) return { kind: "waits", missing };
  const rows = partOne(found.lines, events);
  if (typeof rows === "string") return { kind: "gap", reason: rows };
  const propertyColumns = figuredProperties.map((each) => each.lines);
  return {
    kind: "figured",
    result: {
      rows,
      total: partOneTotals(Object.values(rows)),
      otherForms: { "1z": otherFormOf(found, "1z"), "2z": otherFormOf(found, "2z") },
      properties: propertyColumns,
      partTwoTotals: propertyColumns.length === 0 ? undefined : partTwoTotals(propertyColumns),
      partThree,
    },
  };
}

/* The form files with a recapture, an excessive amount or a penalty, and with a gap or a wait (so it shows). */
const filesByFacts = (figured: Figured | undefined): boolean => {
  if (figured === undefined) return false;
  if (figured.kind !== "figured") return true;
  return Object.values(figured.result.rows).some(rowHasAmount);
};

/*
 * Who files: "Use Form 4255 to figure the increase in the amount due for
 * certain credit recaptures, excessive payments, excessive credit transfers,
 * and penalty amounts" (irs-4255-inst-2025::sec::general-instructions::b01).
 * Any of those amounts on a Form 4255 fact files it; the explicit decision wins.
 */
export function resolve4255Info(inputs: ResolverInputs): Form4255FilingInfo {
  const found = getCreditRecaptureFacts(inputs.facts);
  const figured = hasCreditRecaptureFacts(found) ? figure(found) : undefined;
  const factKeys = [...found.lines, ...found.properties, ...found.facilities].map(
    (each) => each.key,
  );
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_4255",
    fallbacks: [
      {
        rule: `fallback: ${factKeys.length} Form 4255 fact(s) with a recapture, an excessive amount or a penalty`,
        value: filesByFacts(figured),
        triggeredByFactKeys: factKeys,
      },
    ],
  });
  const filed = { mustFile: { "form-4255": mustFile } };
  if (mustFile.value !== true) return filed;
  if (figured === undefined) return { ...filed, form4255Gap: BY_DECISION_ONLY };
  if (figured.kind === "gap") return { ...filed, form4255Gap: figured.reason };
  if (figured.kind === "waits")
    return { ...filed, missingInputs: { "form-4255": figured.missing } };
  return { ...filed, form4255: figured.result };
}
