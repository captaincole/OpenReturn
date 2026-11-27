/*
 * Line 10, column B: "Add Section A, line 1z through line 7a, and Section B,
 * line 1 through line 7, line 9a, and line 9b1 through line 9b3 in column B"
 * (the form). These are the lines before the FTB 3805V deductions (lines 9b1
 * and 9b2). FTB 3805V reads them to find California AGI before its own
 * deductions: reading line 10 itself would wait on the deductions it figures.
 * Section B line 2a (alimony) has no column B on either schedule, so the list
 * names no field for it: Schedule CA (540NR) reads each name from its own
 * catalog, and a name with no field there is an error.
 */
export const LINE_10_SUBTRACTIONS_BEFORE_NOL = [
  "0.line.1z_subtractions",
  "0.line.2b_subtractions",
  "0.line.3b_subtractions",
  "0.line.4b_subtractions",
  "0.line.5b_subtractions",
  "0.line.6b_subtractions",
  "0.line.7a_subtractions",
  "0.line.b3_subtractions",
  "0.line.b4_subtractions",
  "0.line.b5_subtractions",
  "0.line.b6_subtractions",
  "0.line.b7_subtractions",
  "2.line.b9a_subtractions",
] as const;
