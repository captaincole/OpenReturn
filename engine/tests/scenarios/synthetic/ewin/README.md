# ewin — a made-up buyer of a share of a low-income housing building (synthetic)

Ewin Coldbrook is single and lives in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Ewin has one W-2. On June 10, 2025 he bought a 60% interest in Larkspur Commons, a 40-unit low-income housing building. He held no interest before. The building's credit period began in 2021, so 2025 is year 5. More units are low-income now than at the close of 2021, so line 3 is more than Form 8609 line 8a (additions to qualified basis). The count did not change from the end of 2024, so the Line 11 Worksheet enters 0. A $50,000 federal grant received in 2024 never reduced the eligible basis; a high-cost area raised the basis to 130%. He takes the standard deduction. The return is federal only: Washington has no income tax.

Forms that file: Form 1040, Form 8609-A. The credit on line 18 goes to Form 8586 line 3, and on to Form 3800. Form 8586 has no rules yet, so the credit does not reach Form 1040 in this scenario. Line 17 is blank: it is for the 11th year (the `haral` scenario). Item E is "No", and the form prints no mark for a "No" (`engine/src/federal/8609-a/QUESTIONS.md`).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Inland Basin Medical Group | box 1 $185,000, box 2 $36,000 |
| Form 8609, Larkspur Commons (made by `generate-docs.ts`) | BIN WA-21-00377; line 1b $70,000; line 2 4%; line 3a $1,750,000; line 3b 130%; line 7 $2,500,000; line 8a $1,750,000; first credit year 2021 |
| Building at the end of 2025 (and of 2024) | 32 of 40 units, 28,440 of 36,000 square feet low-income |
| Ownership | 60%, bought June 10, 2025 |
| Federal grants not in the basis | $50,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| A | Form 8609 item E | WA-21-00377 |
| B, C, D | the building; Form 8609 in records; qualified | checked; Yes; Yes |
| 1 | Form 8609 line 7 | 2,500,000 |
| 2 | smaller of 32/40 = .8000 and 28,440/36,000 = .7900 | .7900 |
| 3 | 2,500,000 × .7900 | 1,975,000 |
| days | June 10: the seller held 10 days of June, Ewin 20, so June is his: June 1 to December 31 | 214 |
| 4 | 1,975,000 × 214/365 = 1,157,945.2 | 1,157,945 |
| 5 | Form 8609 line 2, not below the 4% minimum | .0400 |
| 6 | 1,157,945 × .0400 = 46,317.8 | 46,318 |
| 7 | 1,975,000 − 1,750,000 | 225,000 |
| 8 | 225,000 × 214/365 = 131,917.8 | 131,918 |
| 9 | .0400 / 3 = .01333 | .0133 |
| 10 | 131,918 × .0133 = 1,754.5 | 1,755 |
| 11 | worksheet line 2: 2,500,000 × .7900 = 1,975,000; line 3: 1,975,000 − 1,975,000 = 0 | 0 |
| 12 | 1,755 + 0 | 1,755 |
| 13 | 46,318 − 1,755 | 44,563 |
| 14 | step 1: 50,000 × 1.3000 = 65,000 / 2,500,000 = .0260; step 2: 44,563 × .0260 = 1,158.6 | 1,159 |
| 15 | 44,563 − 1,159 = 43,404, not more than 70,000 | 43,404 |
| 16 | 43,404 × 60% = 26,042.4 | 26,042 |
| 18 | 26,042 + line 17 (blank) | 26,042 |
| 1040 line 1a, 9, 11a | W-2 box 1 | 185,000 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 185,000 − 15,750 | 169,250 |
| 1040 line 16 | 17,651 + 24% × (169,250 − 103,350) | 33,467 |
| 1040 line 25a, 33 | W-2 box 2 | 36,000 |
| 1040 line 34, 35a | 36,000 − 33,467 | 2,533 |

## Compared with real examples

Form 8609 is the first document of its type. The generator (`tests/scenarios/documents/form8609.ts`) was compared with:

- The official blank form, Rev. December 2021 (https://www.irs.gov/pub/irs-pdf/f8609.pdf): same parts, items A to E, lines 1a to 10d and the two signature blocks. Line 5b (the 2021–2022 disaster zone box) is left off: it does not apply to these buildings.
- The Instructions for Form 8609 (https://www.irs.gov/instructions/i8609): the BIN is assigned by the agency, line 3b is a percentage such as 120, and Part II is the owner's first-year certification.
- Copies the agencies hand out, found but not opened: the Massachusetts copy (https://www.mass.gov/doc/f8609pdf/download) and the California compliance manual's (https://www.treasurer.ca.gov/ctcac/compliance/manual/appendix4/8609.pdf). No filled example was found online, so the layout follows the blank form.

Every engine input on Form 8609-A that comes from Form 8609 (BIN, lines 1b, 2, 3a, 3b, 7, 8a, the first credit year) is printed on the document. The names, the agency and the dates are made up.
