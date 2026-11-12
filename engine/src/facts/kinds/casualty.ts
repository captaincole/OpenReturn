/*
 * Form 4684 Section A answers: one fact per casualty or theft event of
 * personal-use property. The form files once per event through line 12
 * (irs-4684-inst-2025::sec::section-a-personal-use-property::b01), with one
 * column per property lost or damaged in it. The taxpayer states each amount;
 * the FEMA declaration number is public (FEMA.gov/Disaster). Business and
 * income-producing property (Section B) is not modeled.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface CasualtyPropertyValue {
  /* Line 1 "Type of Property": "House", "Car". */
  type: string;
  city?: string;
  state?: string;
  zip?: string;
  dateAcquired?: string; // MM/DD/YYYY
  /* Line 2. */
  costBasis: number;
  /* Line 3: received or expected, whether or not a claim was filed; 0 when none. */
  reimbursement: number;
  /* Lines 5 and 6. */
  fairMarketValueBefore: number;
  fairMarketValueAfter: number;
}

export interface CasualtyEventFactValue {
  /* The taxpayer's name for the event: "Fire", "Hurricane". */
  description: string;
  date?: string; // MM/DD/YYYY
  /*
   * The loss is attributable to a federally declared disaster: the box above
   * line 1, with the FEMA DR- or EM- number. A personal casualty loss that is
   * not is deductible only up to personal casualty gains (line 14 instructions).
   */
  federallyDeclaredDisaster: boolean;
  femaDeclarationNumber?: string;
  /*
   * A qualified disaster loss (Disaster Losses, "Qualified disaster losses"):
   * the $500 floor on line 11, no 10% of AGI floor, and an increased standard
   * deduction for a filer who does not itemize.
   */
  qualifiedDisasterLoss: boolean;
  /* Properties A through D, in order. */
  properties: CasualtyPropertyValue[];
}

export interface CasualtyEventFact {
  eventSlug: string;
  event: CasualtyEventFactValue;
  factKey: string;
}

const CASUALTY_CATEGORY = "other";
const CASUALTY_PREFIX = "casualty.";

export function makeCasualtyEventFactKey(eventSlug: string): string {
  return `${CASUALTY_PREFIX}${eventSlug}`;
}

export function isCasualtyEventFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && parts[0] === "casualty" && parts[1] !== "";
}

/* Every casualty event fact, in the order recorded: the order of the Forms 4684. */
export function getCasualtyEventFacts(facts: ReadonlyArray<FactRow>): CasualtyEventFact[] {
  return facts
    .filter((row) => row.category === CASUALTY_CATEGORY && isCasualtyEventFactKey(row.key))
    .map((row) => ({
      eventSlug: row.key.slice(CASUALTY_PREFIX.length),
      event: row.value as CasualtyEventFactValue,
      factKey: row.key,
    }));
}
