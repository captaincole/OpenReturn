/*
 * Form 6765 Section F (lines 42 to 48) and Section G (lines 49 to 56): the
 * qualified research expenses. Pure arithmetic.
 *
 * Section G is "optional for all filers for tax years beginning before 2026"
 * (irs-6765-inst-2025::sec::section-g-business-component::b01): a fact with
 * business components fills it, and Section F takes its column totals ("If
 * you completed Section G, enter the total amount from column 53", line-42::b01).
 * A fact without them fills Section F from its stated totals.
 *
 * Every cell keeps the cents of what it adds and rounds once, the rule of a
 * document sum and of a total of computed rows (CLAUDE.md, whole-dollar rounding).
 */

import type {
  BusinessComponentType,
  ContractResearchPaid,
  ResearchBusinessComponent,
  ResearchExpenses,
  ResearchSoftwareType,
} from "../../facts/kinds/researchCredit.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Line 45 and column 56: 100% of qualified energy research by an eligible
 * small business, a university or a federal laboratory, 75% of research by a
 * qualified research consortium, 65% of all other contract research
 * (irs-6765-inst-2025::sec::line-45::b01, ::b02; section-g-columns-50-56::b04).
 */
export const ENERGY_RESEARCH_RATE = 1;
export const CONSORTIUM_RATE = 0.75;
export const OTHER_CONTRACT_RATE = 0.65;

/* Section G prints 15 business components; the rest are "Total from attachments" (how-to-complete-section-g::b03). */
export const COMPONENT_ROWS = 15;

/* "Aggregate Business Components" in column 49(c) (irs-6765-inst-2025::sec::d-non-ius::b01). */
export const AGGREGATE_NAME = "Aggregate Business Components";

/* Column 49(d) as printed (statistical-sampling::b02, ::b03). */
export const COMPONENT_TYPE_TEXT: Readonly<Record<BusinessComponentType, string>> = {
  product: "Product",
  process: "Process",
  all_others: "All Others",
};

/* Column 49(e) as printed (statistical-sampling::b03). */
export const SOFTWARE_TEXT: Readonly<Record<ResearchSoftwareType, string>> = {
  ius: "A. IUS",
  dfs: "B. DFS",
  non_ius: "C. Non-IUS",
  excepted: "D. Excepted from IUS",
};

/* Line 45 or column 56 before rounding: the applicable amount of the contract research paid. */
export function applicableContractResearch(
  paid: ContractResearchPaid | undefined,
): number | undefined {
  if (paid === undefined) return undefined;
  const parts = [
    paid.energyResearch === undefined ? undefined : paid.energyResearch * ENERGY_RESEARCH_RATE,
    paid.researchConsortium === undefined ? undefined : paid.researchConsortium * CONSORTIUM_RATE,
    paid.other === undefined ? undefined : paid.other * OTHER_CONTRACT_RATE,
  ];
  return parts.every((part) => part === undefined) ? undefined : sum(...parts);
}

/* What was paid for contract research, before the percentages: the amount the business deducts. */
export const contractResearchPaid = (paid: ContractResearchPaid | undefined) =>
  sumOrBlank(paid?.energyResearch, paid?.researchConsortium, paid?.other);

/* One column of Section G before rounding, by component. */
interface RawAmounts {
  line50?: number;
  line51?: number;
  line52?: number;
  line53?: number;
  line54?: number;
  line55?: number;
  line56?: number;
}

export type ColumnAmounts = RawAmounts;

export interface ComponentRow extends ColumnAmounts {
  name: string;
  aggregate: boolean;
  type?: string;
  software?: string;
}

export interface SectionG {
  rows: ComponentRow[];
  attachments?: ColumnAmounts;
  total: ColumnAmounts;
}

export interface SectionF {
  line42?: number;
  line43?: number;
  line44?: number;
  line45?: number;
  line47?: number;
  line48?: number;
}

const COLUMNS = ["line50", "line51", "line52", "line53", "line54", "line55", "line56"] as const;

function rawOf(component: ResearchBusinessComponent): RawAmounts {
  const wages = [
    component.directResearchWages,
    component.directSupervisionWages,
    component.directSupportWages,
  ];
  return {
    line50: component.directResearchWages,
    line51: component.directSupervisionWages,
    line52: component.directSupportWages,
    line53: sumOrBlank(...wages),
    line54: component.supplies,
    line55: component.computerRental,
    line56: applicableContractResearch(component.contractResearch),
  };
}

/* Each column of the raw rows, added with their cents and rounded once; blank when no row has it. */
function columnTotals(rows: RawAmounts[]): ColumnAmounts {
  const total: ColumnAmounts = {};
  for (const column of COLUMNS)
    total[column] = roundDollars(sumOrBlank(...rows.map((row) => row[column])));
  return total;
}

const qresOf = (raw: RawAmounts) => sum(raw.line53, raw.line54, raw.line55, raw.line56);

/*
 * Section G: "Each business component representing the 80%/Top 50 must be
 * listed in descending order by the total QREs per business component"
 * (how-to-complete-section-g::b01); the aggregate entry comes last. Rows past
 * the 15th are summed on "Total from attachments", and "Total" adds every row.
 */
export function sectionGOf(components: ResearchBusinessComponent[]): SectionG {
  const named = components.filter((component) => component.aggregate !== true);
  const aggregate = components.filter((component) => component.aggregate === true);
  const ordered = [
    ...named
      .map((component) => ({ component, raw: rawOf(component) }))
      .sort((left, right) => qresOf(right.raw) - qresOf(left.raw)),
    ...aggregate.map((component) => ({ component, raw: rawOf(component) })),
  ];
  const rows = ordered.slice(0, COMPONENT_ROWS).map(({ component, raw }) => {
    const isAggregate = component.aggregate === true;
    return {
      ...columnTotals([raw]),
      name: isAggregate ? AGGREGATE_NAME : component.name,
      aggregate: isAggregate,
      type:
        isAggregate || component.type === undefined
          ? undefined
          : COMPONENT_TYPE_TEXT[component.type],
      software:
        isAggregate || component.software === undefined
          ? undefined
          : SOFTWARE_TEXT[component.software],
    };
  });
  const rest = ordered.slice(COMPONENT_ROWS).map((each) => each.raw);
  return {
    rows,
    attachments: rest.length > 0 ? columnTotals(rest) : undefined,
    total: columnTotals(ordered.map((each) => each.raw)),
  };
}

/* Lines 42 to 48 from lines 42 to 45. Line 46 is a corporation's basic research payments (line-46::b01, line-2::b01): blank. */
function sectionFFrom(lines: Pick<SectionF, "line42" | "line43" | "line44" | "line45">): SectionF {
  const line47 = sumOrBlank(lines.line45);
  return { ...lines, line47, line48: sumOrBlank(lines.line42, lines.line43, lines.line44, line47) };
}

/* Section F from Section G's totals: columns 53, 54, 55 and 56 (line-42::b01 to line-45::b01). */
export function sectionFFromSectionG(sectionG: SectionG): SectionF {
  return sectionFFrom({
    line42: sectionG.total.line53,
    line43: sectionG.total.line54,
    line44: sectionG.total.line55,
    line45: sectionG.total.line56,
  });
}

/* Section F from the stated totals. */
export function sectionFFromExpenses(expenses: ResearchExpenses | undefined): SectionF {
  return sectionFFrom({
    line42: roundDollars(expenses?.wages),
    line43: roundDollars(expenses?.supplies),
    line44: roundDollars(expenses?.computerRental),
    line45: roundDollars(applicableContractResearch(expenses?.contractResearch)),
  });
}

/* What the business paid in each category that Section F counts, before the contract percentages: the reduction caps (reduction.ts). */
export interface PaidByCategory {
  wages: number;
  supplies: number;
  computerRental: number;
  contractResearch: number;
}

export function paidByCategory(
  expenses: ResearchExpenses | undefined,
  components: ResearchBusinessComponent[] | undefined,
): PaidByCategory {
  if (components === undefined) {
    return {
      wages: sum(expenses?.wages),
      supplies: sum(expenses?.supplies),
      computerRental: sum(expenses?.computerRental),
      contractResearch: sum(contractResearchPaid(expenses?.contractResearch)),
    };
  }
  const total = (pick: (component: ResearchBusinessComponent) => number | undefined) =>
    sum(...components.map(pick));
  return {
    wages: total((each) =>
      sum(each.directResearchWages, each.directSupervisionWages, each.directSupportWages),
    ),
    supplies: total((each) => each.supplies),
    computerRental: total((each) => each.computerRental),
    contractResearch: total((each) => contractResearchPaid(each.contractResearch)),
  };
}
