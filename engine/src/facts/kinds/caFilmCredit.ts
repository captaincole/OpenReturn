/*
 * FTB 3541, a California motion picture and television production credit:
 * one fact per California Film Commission (CFC) credit certificate, because
 * "If you have multiple certificates for the same credit, complete a separate
 * form FTB 3541 for each certificate number"
 * (ca-3541-inst-2025::sec::important-information::b05). The certificate, or
 * the K-1 statement of the entity that passes the credit through, gives the
 * values; the engine reads neither document, so the taxpayer states them.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * How the taxpayer has the credit: Part I line 1 (allocated on the
 * certificate), line 2 (from an S corporation, estate, trust, partnership or
 * LLC) or line 3 (bought from a qualified taxpayer)
 * (ca-3541-inst-2025::sec::part-i-available-credit::b01, ::b02). Line 4a is
 * for an affiliated corporation only, so it is not a choice here.
 */
export type CaFilmCreditSource = "generated" | "pass_through" | "purchased";

export interface CaFilmCreditFactValue {
  /*
   * Line B: the certificate number. Its range names the credit: 1000-4999
   * original, 5000-6999 new, 7000-7999 program 3.0, 8000-8199 soundstage
   * filming, 8200 and higher program 4.0 (the form's check boxes).
   */
  certificateNumber: number;
  /* Line A: the year the CFC issued the certificate. */
  yearIssued: number;
  /* Line C: the copyright registration number (ca-3541-inst-2025::sec::part-i-available-credit::b01). */
  copyrightRegistrationNumber: string;
  source: CaFilmCreditSource;
  /*
   * The 2025 credit in whole dollars: the full certificate amount, the K-1
   * share or the amount bought ("Do not enter the consideration amount paid").
   * 0 for a certificate of an earlier year that only carries over.
   */
  credit: number;
  /* Line 5a: last year's FTB 3541 line 13 for this certificate; 0 when none. */
  carryoverFromPriorYear: number;
  /* Line 9: the part applied against qualified sales and use taxes (a CDTFA election). Absent: none. */
  appliedToSalesAndUseTax?: number;
  /* Line 6: the part sold to an unrelated party (FTB 3551 Part III box 7). Absent: none. */
  soldToOthers?: number;
  /* A purchased credit: the price paid. The buyer reports income when it is less than the credit. */
  purchasePrice?: number;
  /*
   * The owner of the credit as the certificate names it, when it is not the
   * taxpayer (ca-3541-inst-2025::sec::specific-line-instructions::b01).
   * Absent: the taxpayer owns it, and the form says "Same".
   */
  owner?: {
    name: string;
    idType: "ca_corporation_number" | "fein";
    idNumber: string;
    sosFileNumber?: string;
  };
  /* The credit came through a disregarded business entity (ca-3541-inst-2025::sec::c-limitations::b03). */
  throughDisregardedEntity?: boolean;
  /* Program 4.0 only: the one-time election to make the credit that exceeds tax refundable (Part IV). */
  refundableElection?: boolean;
}

export interface CaFilmCreditFact {
  key: string;
  value: CaFilmCreditFactValue;
}

const CA_FILM_CREDIT_CATEGORY = "other";
const CA_FILM_CREDIT_PREFIX = "ca_film_credit.";

export function makeCaFilmCreditFactKey(slug: string): string {
  return `${CA_FILM_CREDIT_PREFIX}${slug}`;
}

export function isCaFilmCreditFactKey(key: string): boolean {
  const slug = key.slice(CA_FILM_CREDIT_PREFIX.length);
  return key.startsWith(CA_FILM_CREDIT_PREFIX) && slug !== "" && !slug.includes(".");
}

/* Every certificate fact, in the order recorded: the order of the forms. */
export function getCaFilmCreditFacts(facts: ReadonlyArray<FactRow>): CaFilmCreditFact[] {
  return facts
    .filter((row) => row.category === CA_FILM_CREDIT_CATEGORY && isCaFilmCreditFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CaFilmCreditFactValue }));
}
