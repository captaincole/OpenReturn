# Form 6765 — doubts and defaults

The engine fills Form 6765 for an individual whose sole proprietorship (Schedule C) does qualified research. The instructions publish no example with numbers, and none was found for a prior year. The tests are the form's own lines, limit tests, and the synthetic taxpayers `cowin` (the regular credit, Section G, a K-1) and `dena` (the alternative simplified credit, the section 280C election, the payroll tax election).

The blank PDF is Rev. December 2024; the instructions are Rev. December 2025. Every line the instructions name (1 to 48, 33a, 33b, 49(a) to 56) is on the blank form with the same number and words, so the catalog is not rebuilt.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, Items A and B | Stated rule |
| Section A lines 1, 5 to 13 | Stated rule; line 6's start-up years: stated rule |
| Lines 2 to 4, 15 to 17, 46 (basic research payments) | Stated rule: a corporation's only, blank |
| Section B lines 14, 18 to 26 | Stated rule |
| Line 7 with fewer than 4 years | Own reading (item 3) |
| Line 13 or 26 for a controlled group member | Unsupported: the group credit attachment |
| Lines 27 to 30 | Stated rule; line 27 is a stated answer |
| Lines 31, 32 (estates and trusts) | Stated rule: blank |
| Section D lines 33a to 36 | Stated rule; line 35 reads Form 3800 by the worksheet |
| Section E lines 37, 39, 40 | Stated answers |
| Line 38 (officers' wages) | Own reading (item 5) |
| Line 41 and its amount | Stated rule: an individual files no Schedule M-3 |
| Section F item A | Stated rule: Section G is optional before 2026 |
| Section F lines 42 to 48 | Stated rule |
| Section G lines 49(a) to 49(e), 50 to 56 | Stated rule; the text of 49(d) and 49(e), and 49(a) of a business with no EIN: own reading (item 6) |
| Column 49(f) | Stated rule: original returns leave it blank |
| The section 280C reduction on Schedule C | Decision A103 (`reduction.ts`) |
| Form 3800 line 1c or 4i | Stated rule; one line per source is own reading (item 1) |

## Decided by the author

- **A103, the Schedule C lines that take the section 280C reduction.** The instructions leave the lines to the taxpayer. The engine reduces line 26, then 22, 20a and 11, each by at most what the business paid in that category. `reduction.ts`.

## Should we do this now

Each item is a default with no conflicting text.

### 1. Line 30 on two Form 3800 lines — done

- Source: "Eligible small businesses, stop here and report the credit on Form 3800, Part III, line 4i ... Filers other than eligible small businesses ... line 1c" (`irs-6765-face-2025::sec::face-page-2::b01`); and "Figure the research credit limitation separately for each sole proprietorship or pass-through entity" (`irs-3800-inst-2025::sec::lines-1c-and-4i::b01`).
- Default: line 28 (the taxpayer's own research) and each K-1 on line 29 are separate Form 3800 sources. Each takes its own line: the business by the $50 million test, a K-1 by its eligible small business answer ("A partner ... can't be treated as an eligible small business unless both the partnership ... and the partner ... meet the gross receipts test", `eligible-small-business-for-purposes-of::b02`). Line 1c and line 4i together equal line 30.
- Changes dollars: yes, only when a K-1 and the business differ on the test: line 4i offsets the minimum tax.

### 2. The deduction goes down by line 28 — done

- Source: "reduce your domestic research or experimental expenditures ... by the amount of the research credit" (`irs-6765-inst-2025::sec::item-a-section-280c-election::b01`). The statute: "reduced by the amount of the credit allowed under section 41(a)" (`usc-26-2025::sec::s280c::c-1`).
- Default: the credit is line 28, line 13 or 26 less the Form 8932 part on line 27. A K-1 credit (line 29) reduces nothing: the entity takes the reduction.
- Changes dollars: yes, by line 27, when a Form 8932 credit uses the same wages.

### 3. Line 7 with fewer than 4 preceding years — done

- Source: "Enter the average annual gross receipts ... for the 4 tax years preceding the tax year" (`line-7::b01`). For the eligible small business test: "If your business wasn't in existence for the entire 3-year period, base your average annual gross receipts on the period your business existed" (`eligible-small-business-for-purposes-of::b01`).
- Default: both average the years the fact states (at most 4 for line 7, the last 3 for the test). The gross receipts of section 41(c)(7) and of section 448(c) are taken as the same amounts.
- Changes dollars: yes, for a business younger than 4 years that uses Section A.

### 4. Line 35 reads Form 3800 after the research limitation — done

- Source: the Worksheet for Figuring General Business Credit Carryforward (`line-44::b01`, `::b02`) reads Form 3800 Part I line 6 and Part II lines 25, 36 and 38.
- Default: the worksheet as printed. A research credit that the research credit limitation (`irs-3800-inst-2025::sec::lines-1c-and-4i::b02`) keeps off Part III never reaches those lines, so line 35 does not count it, though it is carried forward.
- Changes dollars: yes, for a business whose attributable taxable income limits the credit: line 36 can be lower.

### 5. Line 38 is blank for a sole proprietorship — done

- Source: "The corporation determines who is an officer under the laws of the state where it is incorporated" (`line-38::b01`).
- Default: a sole proprietorship has no officers: blank.
- Changes dollars: no.

### 6. Section G text — done

- Source: columns 49(d) and 49(e) list their options (`statistical-sampling::b02`, `::b03`).
- Default: 49(d) prints "Product", "Process" or "All Others"; 49(e) prints the letter and short name ("C. Non-IUS"). Column 49(a) prints the business's EIN, blank when it has none; 49(b) prints Schedule C line B. The aggregate entry prints only 49(c) and columns 50 to 56, last. Each cell adds with cents and rounds once.
- Changes dollars: no.

## Proposals for a discussion

- **Form 3800's carryforward after a payroll tax election.** "The unused credit for the current year is determined by reducing the amount on Part I, line 6, and Part II, line 36, by the amount on Form 6765, line 36" (`irs-3800-inst-2025::sec::carryback-and-carryforward-of::b03`). Form 3800's carryforward columns (Part III column (i), Part V column (i)) do not subtract line 36 yet. They print only with a transfer or elective payment election or two sources on one line, and no scenario has both. The change is in `federal/3800` (allocation), so it waits for a person.
- **California.** A California return gets the federal Schedule C with the section 280C reduction. Whether Schedule CA adds it back (California does not adopt section 174A, and its own research credit has its own rules) is not checked. The engine adds nothing on Schedule CA.
- **Research in a farm, a rental or a K-1 entity of one's own.** The fact names a Schedule C business only. Research in a Schedule F farm is a gap on line 28.
- **Capitalized research expenditures.** A taxpayer who elects section 174A(c) amortization reduces the capital account, not the deduction (`item-a-section-280c-election::b01`). The engine has no section 174A amortization, so it always reduces the Schedule C lines.
