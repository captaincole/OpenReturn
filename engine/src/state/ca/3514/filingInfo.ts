/*
 * FTB 3514, the California EITC, YCTC and FYTC. The amounts the steps test
 * (federal AGI, investment income, the federal lines Worksheet 3 adds) are
 * read from Form 1040 and Schedule 1 through the form accessor; these slots
 * are what the facts give.
 */

import type { DependentFact } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/** The answers the steps read: the federal EIC's shared ones and FTB 3514's own. */
export interface CaEitcAnswers {
  /** Step 1, question f (eic.nonresident_alien). */
  nonresidentAlien?: boolean;
  /** Step 4, question e, and the qualifying-child questionnaire (eic.qualifying_child_of_another). */
  qualifyingChildOfAnother?: boolean;
  /** Step 4, question f (eic.claimable_as_dependent). */
  claimableAsDependent?: boolean;
  /** Line 1a (eic.denied_in_earlier_year). */
  irsDisallowedEarlierYear?: boolean;
  /** Line 1b (ca_eitc.ftb_disallowed_earlier_year). */
  ftbDisallowedEarlierYear?: boolean;
  /** Step 1, question d: lived apart from the spouse for the last 6 months of 2025. */
  livedApartLastSixMonths?: boolean;
  /** Step 1, question d: legally separated and apart at the end of 2025. */
  legallySeparatedApartAtYearEnd?: boolean;
  /** Step 10: in California foster care at 13 or older, by spouse. */
  fosterYouthTaxpayer?: boolean;
  fosterYouthSpouse?: boolean;
  /** Line 33: consent to the CDSS check, by spouse. */
  cdssConsentTaxpayer?: boolean;
  cdssConsentSpouse?: boolean;
}

/** A business for lines 18a–18e: the one with the largest net profit (loss). */
export interface CaEitcBusiness {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  code?: string;
}

export interface Form3514FilingInfo extends BaseFilingInfo {
  caEitcAnswers?: CaEitcAnswers;
  /** Part III's children: qualifying children with a valid SSN or ITIN, young children first. */
  caEitcChildren?: DependentFact[];
  /** A dependent's qualifying-child test still waits on an answer. */
  caEitcChildrenOpen?: boolean;
  /** decisions.scope.ca_residency is full_year: Form 540, not 540NR (Steps 7, 9 and 11 are skipped). */
  caFullYearResident?: boolean;
  /** Line 13: W-2 box 16 for California, plus disability pay before the minimum retirement age; undefined while a pension's age answer is missing. */
  caEitcWages?: number;
  /** W-2 box 11 on the California W-2s (line 15's nonqualified plan pension may be in it). */
  caNonqualifiedPlanBox11?: number;
  /** W-2 box 12 code Q, nontaxable combat pay (line 17's election). */
  caCombatPay?: number;
  /** W-2 box 12 code II, Medicaid waiver payments (line 13 includes them; line 14's election). */
  caMedicaidWaiverPayments?: number;
  /** Line 23a: W-2 box 1 on the W-2s with no California wages (wages not subject to CA withholding). */
  caWagesOutsideCalifornia?: number;
  /** Lines 18a–18e; undefined with no business, or while a net profit waits. */
  caEitcBusiness?: CaEitcBusiness;
  /** A business is on the return: line 18 waits for Schedule 1 line 3. */
  caEitcHasBusiness?: boolean;
}
