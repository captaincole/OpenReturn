/*
 * More than 26 orphan drugs: "Attach as many Part II pages as needed to show
 * all orphan drugs" (irs-8820-form-2025::sec::part-ii::b01). Copy n prints the
 * drugs 26n to 26n + 25 in rows 7a to 7z; a later copy prints page 2 only
 * (federal/index.ts), so Part I prints once.
 */

import type { OrphanDrug } from "../../facts/kinds/orphanDrugCredit.js";
import type { Form8820FilingInfo } from "./filingInfo.js";

/* Part II rows 7a to 7z: one page has 26. */
export const PART_II_ROW_LETTERS = "abcdefghijklmnopqrstuvwxyz";
export const DRUGS_PER_PAGE = PART_II_ROW_LETTERS.length;

/* The copies the form needs: one Part II page for each 26 drugs, at least one. */
export function form8820CopyCount(info: Form8820FilingInfo | undefined): number {
  const drugs = info?.form8820?.drugs.length ?? 0;
  let copies = 1;
  while (copies * DRUGS_PER_PAGE < drugs) copies += 1;
  return copies;
}

/* The drugs one copy prints in rows 7a to 7z. */
export function drugsOnCopy(info: Form8820FilingInfo): ReadonlyArray<OrphanDrug> {
  const start = (info.form8820CopyIndex ?? 0) * DRUGS_PER_PAGE;
  return (info.form8820?.drugs ?? []).slice(start, start + DRUGS_PER_PAGE);
}
