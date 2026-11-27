import type { ResearchCreditFactValue } from "../../facts/kinds/researchCredit.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { ResearchFigures } from "./figures.js";

/* The research business as Section G and Form 3800 read it. */
export interface ResearchBusiness {
  name: string;
  /* Schedule C line D: column 49(a). */
  ein?: string;
  /* Schedule C line B: column 49(b), the principal business activity code. */
  code?: string;
  /* Schedule C line G; undefined while not answered. */
  materiallyParticipated?: boolean;
}

/* Form 6765 as the resolver figures it: every line but 35 and 36 reads only facts. */
export interface Form6765Lines {
  fact: ResearchCreditFactValue;
  /* Line 28 is a gap when the business is not on the return or cannot take the 280C reduction. */
  figures: ResearchFigures;
  /* Undefined when the research business is not a Schedule C business of this return. */
  business?: ResearchBusiness;
  /* Line 29: the research credits of the K-1s; blank with none or with no credit figured. */
  line29: number | Unsupported | undefined;
}

export interface Form6765FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 6765 does not file, or files with no research credit fact. */
  researchCredit?: Form6765Lines;
}
