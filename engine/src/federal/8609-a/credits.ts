/*
 * What Form 8586 reads from the Forms 8609-A: "The credit for the year is
 * figured on Form 8609-A for each building ... Enter on line 3 the total credit
 * for attached Form(s) 8609-A" (irs-8586-form-2025::sec::line-3::b01), and line
 * 2 asks for the BINs of the buildings whose qualified basis decreased
 * (::face-page-1::b01). Form 8586's own rules are not written yet; it reads
 * form8609ABuildingCredits.
 */

import { unsupported, type Unsupported } from "../../types.js";
import type { Form8609ACopy, Form8609AFilingInfo } from "./filingInfo.js";

export interface Form8609ABuildingCredit {
  buildingIdentificationNumber: string;
  /* Item E: the qualified basis decreased in 2025 (Form 8586 line 2). */
  qualifiedBasisDecreased: boolean;
  /*
   * Line 18, the taxpayer's credit for the building. 0 when Part II has no
   * credit (items C or D "No", a qualified basis of zero, or a year after the
   * credit). Undefined while the copy waits on its fact; unsupported when a line
   * up to 18 is.
   */
  credit: number | Unsupported | undefined;
}

const LINE_18 = 18;

function creditOf(copy: Form8609ACopy): number | Unsupported | undefined {
  if (copy.gap && copy.gap.fromLine <= LINE_18) return unsupported(copy.gap.reason);
  if (copy.waitingOn && copy.waitingOn.length > 0) return undefined;
  return copy.partII.line18 ?? 0;
}

/* One entry for each Form 8609-A, in copy order; none when the form does not file. */
export function form8609ABuildingCredits(
  info: Form8609AFilingInfo,
): ReadonlyArray<Form8609ABuildingCredit> {
  if (info.mustFile?.["form-8609-a"]?.value !== true) return [];
  return (info.form8609ACopies ?? []).map((copy) => ({
    buildingIdentificationNumber: copy.building.form8609.buildingIdentificationNumber,
    qualifiedBasisDecreased: copy.building.qualifiedBasisDecreased,
    credit: creditOf(copy),
  }));
}
