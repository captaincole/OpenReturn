import type { CaFilmCreditFactValue } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { FilmCreditSource } from "./lines.js";

/* One certificate, one form. A field is undefined while its answer waits. */
export interface FilmCertificate {
  factKey: string;
  certificateNumber?: number;
  yearIssued?: number;
  copyrightRegistrationNumber?: string;
  source?: FilmCreditSource;
  credit?: number;
  carryover?: number;
  appliedToSalesAndUseTax: number;
  soldToOthers: number;
  purchasePrice?: number;
  owner?: CaFilmCreditFactValue["owner"];
  throughDisregardedEntity: boolean;
  refundableElection: boolean;
}

/*
 * FTB 3541 reads its certificates here. Form 540 lines 43 to 45 and 74,
 * Schedule P (540), Schedule S, FTB 3801-CR and FTB 3804-CR read them too
 * (creditUsed.ts), so a later copy of the form is never read for a total.
 */
export interface Form3541FilingInfo extends BaseFilingInfo {
  /* In the order of the facts; empty when the form does not file. */
  filmCertificates?: FilmCertificate[];
  /* The copy being evaluated: one form per certificate. */
  form3541CopyIndex?: number;
}
