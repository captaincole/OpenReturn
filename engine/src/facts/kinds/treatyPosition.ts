/*
 * Form 8833: one treaty-based return position the return discloses. "A
 * taxpayer takes a treaty-based return position by maintaining that a treaty
 * of the United States overrules or modifies a provision of the Internal
 * Revenue Code and thereby causes (or potentially causes) a reduction of tax"
 * (irs-8833-form-2025::sec::who-must-file::b01). One fact per position: "A
 * separate form is required annually for each treaty-based return position
 * taken by the taxpayer, although a taxpayer may treat payments or income
 * items of the same type received from the same payor as a single item"
 * (general-instructions::b01).
 *
 * Every answer is stated. The engine does not decide whether a treaty applies,
 * whether reporting is waived, or what the position is worth: the amount the
 * position changes is recorded where it lands (a Schedule 1 line 8z item, a
 * Form 1116 foreign tax), never here. No document holds these answers.
 */

type FactRow = { key: string; value: unknown; category: string };

export type TreatyPositionOwner = "taxpayer" | "spouse";

export interface TreatyPositionFactValue {
  /* Whose position it is: the header's name and number. Absent: the taxpayer. */
  owner?: TreatyPositionOwner;
  /*
   * "Positions for which reporting is waived" (who-must-file::b04 to b06,
   * Regulations section 301.6114-1(c)): true files no Form 8833 for this
   * position. The taxpayer or the preparer answers it; the engine does not test
   * the waivers.
   */
  reportingWaived: boolean;
  /* Header, first box: the disclosure section 6114 requires (face-page-1::b01). */
  section6114Disclosure: boolean;
  /*
   * Header, second box: a dual-resident taxpayer's disclosure under Regulations
   * section 301.7701(b)-7 (form-8833-rev-12-2022-page-4::b02). "Check one or
   * both": at least one of the two is true.
   */
  dualResidentDisclosure: boolean;
  /* Line 1a: the treaty country, "People's Republic of China". */
  treatyCountry: string;
  /* Line 1b: the article(s), "20(c)". */
  articles: string;
  /* Line 2: the Code provision(s) the position overrules or modifies, "Section 61". */
  codeProvisions: string;
  /*
   * Line 3, only for fixed or determinable annual or periodical income
   * (line-3::b01): the payor's name, identifying number and U.S. address, as it
   * prints. A line break ("\n") starts a new line in the box. Absent: blank.
   */
  payor?: string;
  /* Line 4: the limitation on benefits provision(s) relied on, "if any" (line-4::b01). Absent: blank. */
  limitationOnBenefits?: string;
  /* Line 5: reporting is specifically required by Regulations section 301.6114-1(b). */
  specificallyRequired: boolean;
  /* Line 5, when specificallyRequired: the subsection(s), "301.6114-1(b)(7)" (line-5::b01). */
  requiredSubsections?: string;
  /*
   * Line 6: the explanation, the facts, and the nature and amount of each item
   * (line-6::b01). A line break starts a new paragraph on a new row.
   */
  explanation: string;
}

export interface TreatyPositionFact {
  key: string;
  owner: TreatyPositionOwner;
  /* The answers as recorded; an answer of the wrong type is left out. */
  value: Partial<TreatyPositionFactValue>;
  /* The answers the form needs that the fact does not hold (missingTreatyPositionAnswers). */
  missing: string[];
}

const TREATY_POSITION_CATEGORY = "foreign";
const TREATY_POSITION_PREFIX = "treaty_position.";

export function makeTreatyPositionFactKey(positionSlug: string): string {
  return `${TREATY_POSITION_PREFIX}${positionSlug}`;
}

export function isTreatyPositionFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === TREATY_POSITION_PREFIX && parts[1] !== "";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const textOf = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const flagOf = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

/* The recorded answers, each kept only when it has the right type. */
function answersOf(row: Record<string, unknown>): Partial<TreatyPositionFactValue> {
  return {
    owner: row.owner === "spouse" ? "spouse" : row.owner === "taxpayer" ? "taxpayer" : undefined,
    reportingWaived: flagOf(row.reportingWaived),
    section6114Disclosure: flagOf(row.section6114Disclosure),
    dualResidentDisclosure: flagOf(row.dualResidentDisclosure),
    treatyCountry: textOf(row.treatyCountry),
    articles: textOf(row.articles),
    codeProvisions: textOf(row.codeProvisions),
    payor: textOf(row.payor),
    limitationOnBenefits: textOf(row.limitationOnBenefits),
    specificallyRequired: flagOf(row.specificallyRequired),
    requiredSubsections: textOf(row.requiredSubsections),
    explanation: textOf(row.explanation),
  };
}

/*
 * The answers a filed Form 8833 needs and the fact lacks. A waived position
 * needs nothing more. "Check one or both" of the header boxes; line 5's
 * subsections only with a Yes (line-5::b01); lines 3 and 4 are optional.
 */
export function missingTreatyPositionAnswers(value: Partial<TreatyPositionFactValue>): string[] {
  if (value.reportingWaived === true) return [];
  const needed: Array<[string, unknown]> = [
    ["reportingWaived", value.reportingWaived],
    ["section6114Disclosure", value.section6114Disclosure],
    ["dualResidentDisclosure", value.dualResidentDisclosure],
    ["treatyCountry", value.treatyCountry],
    ["articles", value.articles],
    ["codeProvisions", value.codeProvisions],
    ["specificallyRequired", value.specificallyRequired],
    ["explanation", value.explanation],
  ];
  const missing = needed.filter(([, answer]) => answer === undefined).map(([name]) => name);
  const noBox = value.section6114Disclosure === false && value.dualResidentDisclosure === false;
  const noSubsection =
    value.specificallyRequired === true && value.requiredSubsections === undefined;
  return [
    ...missing,
    ...(noBox ? ["section6114Disclosure"] : []),
    ...(noSubsection ? ["requiredSubsections"] : []),
  ];
}

/* Every treaty position fact, in the order recorded: the order of the Forms 8833. */
export function getTreatyPositionFacts(facts: ReadonlyArray<FactRow>): TreatyPositionFact[] {
  return facts
    .filter((row) => row.category === TREATY_POSITION_CATEGORY && isTreatyPositionFactKey(row.key))
    .map((row) => {
      const value = isRecord(row.value) ? answersOf(row.value) : {};
      return {
        key: row.key,
        owner: value.owner ?? "taxpayer",
        value,
        missing: missingTreatyPositionAnswers(value),
      };
    });
}
