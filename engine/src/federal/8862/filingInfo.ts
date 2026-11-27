import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import type { Schedule8812FilingInfo } from "../schedule-8812/filingInfo.js";
import type { EicOutcomeInfo } from "../schedule-eic/outcome.js";
import type { Form8862EicPart } from "./eicPart.js";

/* What the resolver decides from facts: Part II, and which other parts a stated denial opens. */
export interface Form8862Figured {
  eic: Form8862EicPart;
  /* A child tax credit denial is stated and no ban: Part III when the return claims one of its credits. */
  ctcNeeded: boolean;
  /* An AOTC denial is stated and no ban: Part IV when the return claims the AOTC. */
  aotcNeeded: boolean;
}

/*
 * Line 2 reads the credits as the return figures them: Form 1040 line 27a's
 * outcome (EicOutcomeInfo), Schedule 8812's dependents and Form 8863's
 * students, which Parts III and IV list.
 */
export interface Form8862FilingInfo
  extends
    BaseFilingInfo,
    EicOutcomeInfo,
    Pick<Schedule8812FilingInfo, "dependents">,
    Form8863FilingInfo {
  form8862?: Form8862Figured;
}
