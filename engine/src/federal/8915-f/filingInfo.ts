import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8915FFigure } from "./figure.js";
import type { FromForm8606Kinds } from "./partIII.js";

/* One printed Form 8915-F: its figure and what Part III needs from Form 8606. */
export interface Form8915FCopy {
  figure: Form8915FFigure;
  /* Line 17: which IRA kinds of the Part I distributions Form 8606 takes. */
  onForm8606: FromForm8606Kinds;
  /* Why some printed fields cannot be filled (more disasters than the form has room for). */
  printGaps: { itemC?: string; partIStatement?: string; partIVTable?: string };
}

/* What Form 1040 lines 4b and 5b take from every Form 8915-F of the return. */
export interface Form8915FReturn {
  /* Why lines 4b and 5b cannot be figured. */
  gap?: string;
  /* The taxable part of the 1099-Rs that the forms take over, cents kept; and the forms' income. */
  ira: { takenFromRows: number; income: number };
  pension: { takenFromRows: number; income: number };
  /*
   * The one form's Part III reads Form 8606: line 4b adds that form's line 26
   * and, with a Roth IRA distribution, takes off Form 8606 line 25b.
   */
  partIIIFromForm8606?: FromForm8606Kinds;
}

export interface Form8915FFilingInfo extends BaseFilingInfo {
  /* One copy per Form 8915-F fact that files, in the order recorded. */
  form8915FCopies?: Form8915FCopy[];
  /* Which copy this one is (renderCopies sets it); absent means the first. */
  form8915FCopyIndex?: number;
  /* Why the printed lines cannot be figured. */
  form8915FGap?: string;
  form8915FReturn?: Form8915FReturn;
}
