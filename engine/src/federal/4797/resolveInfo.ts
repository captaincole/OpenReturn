import {
  SECTION_1231_KEYS,
  businessesOnReturn,
  getForm1099SFacts,
  readBusinessPropertySaleFacts,
  readSection179RecaptureFacts,
  type BusinessPropertySaleFact,
  type Form1099SFactValue,
  type Section179RecaptureFact,
} from "../../facts/index.js";
import { filingStatusOf, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve8582Info } from "../8582/resolveInfo.js";
import { describeItem, entityTitle, passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import type { Form4797FilingInfo, Form4797Overflow } from "./filingInfo.js";
import { form4797Lines } from "./lines.js";
import { placeProperty, saleGap, type PlacedProperty } from "./properties.js";

const MUST_FILE_KEY = "decisions.scope.must_file_4797";
const ROWS_ON_PAPER = 4;

/* Forms with no rules whose amounts Form 4797 takes (lines 4, 5, 15, 16). */
const OTHER_FORMS = [
  { decision: "decisions.scope.must_file_6252", name: "Form 6252" },
  { decision: "decisions.scope.must_file_8824", name: "Form 8824" },
] as const;

/* The K-1s with a net section 1231 gain or loss, which goes in Part I (irs-4797-inst-2025::sec::line-7::b01). */
function section1231K1s(inputs: ResolverInputs, joint: boolean) {
  return passThroughEntitiesOnReturn(inputs.facts, joint).entities.flatMap((entity) => {
    const items = entity.items.filter(
      (item) => item.type === "net_section_1231_gain" && (item.amount ?? 0) !== 0,
    );
    return items.length > 0 ? [{ entity, items }] : [];
  });
}

/*
 * A loss on line 2 or 10 while Form 8582 files: "If you have an overall loss from
 * passive activities and you report a loss on an asset used in a passive activity,
 * use Form 8582 ... to see how much loss is allowed before entering it on Form 4797"
 * (irs-4797-inst-2025::sec::passive-loss-limitations::b01). No fact ties a sale to
 * its activity, so the loss is a gap, not the whole loss.
 */
function passiveLossGap(inputs: ResolverInputs, placed: PlacedProperty[]): string | undefined {
  const losses = placed.flatMap((each) =>
    each.part !== "part_iii" && each.row.gainOrLoss < 0 ? [each.row.description] : [],
  );
  if (losses.length === 0) return undefined;
  if (resolve8582Info(inputs).mustFile?.["form-8582"]?.value !== true) return undefined;
  return `${losses.join(", ")}: a loss on line 2 or 10 while Form 8582 files. A loss on an asset used in a passive activity goes through Form 8582 first (passive-loss-limitations::b01), and no fact ties a sale to its activity.`;
}

/* Why lines 7–18b cannot be figured: a K-1 section 1231 item, or a form the engine does not carry. */
function summaryGap(inputs: ResolverInputs, joint: boolean): string | undefined {
  const k1s = section1231K1s(inputs, joint).map(
    ({ entity, items }) => `${entityTitle(entity)}: ${items.map(describeItem).join(", ")}`,
  );
  if (k1s.length > 0) {
    return `${k1s.join("; ")} goes in Part I (irs-4797-inst-2025::sec::line-7::b01), and the engine has no route for a K-1 section 1231 item.`;
  }
  const others = OTHER_FORMS.filter((form) => inputs.decisionByKey.get(form.decision) === true);
  if (others.length === 0) return undefined;
  return `${others.map((form) => form.name).join(" and ")} file, and the engine does not carry their amounts to Form 4797.`;
}

/* The Form 1099-S keys that more than one sale names (a building and its land in one closing). */
function sharedForms(sales: BusinessPropertySaleFact[]): Set<string> {
  const keys = sales.flatMap((sale) => sale.value.form1099SKey ?? []);
  return new Set(keys.filter((key, index) => keys.indexOf(key) !== index));
}

/*
 * The gross sales price: the stated one, else box 2 of the Form 1099-S the sale
 * names. A form that more than one sale names gives no sale its box 2: the amount
 * realized is split between the properties by fair market value
 * (irs-4797-inst-2025::sec::depreciable-property-and-other-property::b01), so each
 * sale states its own price.
 */
function priceOf(
  sale: BusinessPropertySaleFact,
  forms: Map<string, Form1099SFactValue>,
  shared: Set<string>,
) {
  if (sale.value.grossSalesPrice !== undefined) return sale.value.grossSalesPrice;
  const key = sale.value.form1099SKey ?? "";
  return shared.has(key) ? undefined : forms.get(key)?.box2;
}

/* A sale with no stated price whose Form 1099-S also reports another sale. */
function sharedFormGap(sales: BusinessPropertySaleFact[], shared: Set<string>) {
  const sale = sales.find(
    ({ value }) => value.grossSalesPrice === undefined && shared.has(value.form1099SKey ?? ""),
  );
  return sale === undefined
    ? undefined
    : `${sale.value.description}: its Form 1099-S also reports another property's sale, and the amount realized is split between them by fair market value (depreciable-property-and-other-property::b01); the sale states no price of its own.`;
}

/* Line 1a: box 2 of each Form 1099-S a sale names, each form once (irs-4797-inst-2025::sec::line-1a::b01). */
function reportedProceeds(
  sales: BusinessPropertySaleFact[],
  forms: Map<string, Form1099SFactValue>,
) {
  const named = new Set(sales.flatMap((sale) => sale.value.form1099SKey ?? []));
  return [...named].flatMap((key) => {
    const form = forms.get(key);
    return form === undefined ? [] : [form.box2];
  });
}

function overflowOf(placed: PlacedProperty[]): Form4797Overflow | undefined {
  const count = (part: string) => placed.filter((each) => each.part === part).length;
  const overflow = {
    partI: count("part_i") > ROWS_ON_PAPER,
    partII: count("part_ii") > ROWS_ON_PAPER,
    partIII: count("part_iii") > ROWS_ON_PAPER,
  };
  return Object.values(overflow).some(Boolean) ? overflow : undefined;
}

/* Line 35 reaches only a Schedule C business on this return; any other recapture is a gap for its column. */
function partIVGaps(recaptures: Section179RecaptureFact[], businessIds: Set<string>) {
  const gapFor = (column: string) => {
    const lost = recaptures.filter(
      ({ value }) =>
        value.column === column &&
        (value.businessId === undefined || !businessIds.has(value.businessId)),
    );
    return lost.length === 0
      ? undefined
      : `${lost.map(({ value }) => value.description).join(", ")}: line 35 goes on the schedule that took the deduction (irs-4797-inst-2025::sec::line-35::b01); the engine carries it only to a Schedule C business on this return.`;
  };
  const gaps = { section179: gapFor("section_179"), section280f: gapFor("section_280f") };
  return gaps.section179 || gaps.section280f ? gaps : undefined;
}

/*
 * Who files: a sale or exchange of business property, a K-1 section 1231 item,
 * or a recapture when business use drops to 50% or less
 * (irs-4797-inst-2025::sec::general-instructions::b01,
 * ::where-to-make-first-entry-for-certain-items::b04). The explicit decision still wins.
 */
function mustFile4797(inputs: ResolverInputs, joint: boolean) {
  const sales = readBusinessPropertySaleFacts(inputs.facts);
  const recaptures = readSection179RecaptureFacts(inputs.facts);
  const k1Keys = section1231K1s(inputs, joint).map(({ entity }) => entity.key);
  const keys = [
    ...sales.sales.map((sale) => sale.key),
    ...sales.malformedKeys,
    ...recaptures.recaptures.map((each) => each.key),
    ...recaptures.malformedKeys,
    ...k1Keys,
  ];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} business property sale, K-1 section 1231 or Part IV recapture fact(s)`,
        value: keys.length > 0,
        triggeredByFactKeys: keys,
      },
    ],
  });
  return { resolution, sales, recaptures, factCount: keys.length };
}

const NO_FACTS =
  "Form 4797 files by decision, but no business property sale, K-1 section 1231 or Part IV recapture fact gives its amounts.";

export function resolve4797Info(inputs: ResolverInputs): Form4797FilingInfo {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const { resolution, sales, recaptures, factCount } = mustFile4797(inputs, joint);
  const filed: Form4797FilingInfo = { mustFile: { "form-4797": resolution } };
  if (resolution.value !== true) return filed;
  if (factCount === 0) return { ...filed, form4797Gap: NO_FACTS };
  const malformed = [...sales.malformedKeys, ...recaptures.malformedKeys];
  if (malformed.length > 0) {
    return { ...filed, form4797Gap: `Malformed Form 4797 fact(s): ${malformed.join(", ")}.` };
  }
  const forms = getForm1099SFacts(inputs.facts);
  const shared = sharedForms(sales.sales);
  const gap =
    sharedFormGap(sales.sales, shared) ??
    sales.sales.map((sale) => saleGap(sale.value, priceOf(sale, forms, shared))).find(Boolean);
  if (gap) return { ...filed, form4797Gap: gap };
  const placed = sales.sales.map((sale) =>
    placeProperty(sale.value, priceOf(sale, forms, shared) ?? 0),
  );
  const lines = form4797Lines({
    properties: placed,
    reportedProceeds: reportedProceeds(sales.sales, forms),
    nonrecapturedLosses: num(inputs, SECTION_1231_KEYS.nonrecapturedLosses),
    recaptures: recaptures.recaptures.map((each) => each.value),
  });
  const businessIds = new Set(
    businessesOnReturn(inputs.facts, joint).businesses.map((each) => each.key.split(".")[1] ?? ""),
  );
  return {
    ...filed,
    form4797: lines,
    form4797SummaryGap: summaryGap(inputs, joint) ?? passiveLossGap(inputs, placed),
    form4797Overflow: overflowOf(placed),
    form4797PartIVGap: partIVGaps(recaptures.recaptures, businessIds),
    form4797Section1250: placed.flatMap((each) =>
      each.part === "part_iii" && each.kind === "section_1250"
        ? [
            {
              line22: each.column.line22,
              line24: each.column.line24,
              line26g: each.column.line26g ?? 0,
            },
          ]
        : [],
    ),
    missingInputs: {
      "form-4797": lines.waitsForLine8 ? [SECTION_1231_KEYS.nonrecapturedLosses] : [],
    },
  };
}
