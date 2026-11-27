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
| Line 7 with fewer than 4 years | Stated rule in the regulation (item 3) |
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
| Schedule CA line 3 with the section 280C reduction | Unsupported: FTB 3523 (item 10) |
| Section G past 15 components | Unsupported: the additional sheets (item 9) |
| Form 3800 line 1c or 4i | Stated rule; one line per source is own reading (item 1) |

## Two texts conflict

- **A103, the Schedule C lines that take the section 280C reduction.** The Form 6765 instructions leave the lines to the taxpayer; the Schedule C instructions name no line for the research credit. The engine reduces line 26, then 22, 20a and 11, each by at most what the business paid in that category. DECISION comment in `reduction.ts`, row A103 in `docs/rule-decisions.md`.

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
- The regulation agrees for line 7: "If ... the taxpayer has been in existence for at least one previous taxable year, but has not been in existence for four taxable years preceding the taxable year, then the average annual gross receipts ... shall be the average annual gross receipts for the number of taxable years preceding the credit year for which the taxpayer has been in existence" (`cfr-26-2025::sec::s1.41-3::a`). The blind fill took the same reading (case 3: 600,000, not 300,000).
- Not covered: a business with no preceding year. The same paragraph makes its line 7 zero, but the fact asks for at least one year, so such a business cannot be stated yet.
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

### 7. Line 34 when the election is more than line 28

- Source: the face asks for "the portion of line 28 elected as a payroll tax credit (do not enter more than $500,000)" (`irs-6765-face-2025::sec::face-page-2::b02`), and the instructions say "Enter the portion of your research credit, figured on line 28, that you are claiming as a payroll tax credit. Don't enter more than $500,000" (`irs-6765-inst-2025::sec::line-34::b01`). Line 36 takes "the smallest of line 28, line 34, or line 35" (`face-page-2::b03`). The statute's portion is the least of "(A) the amount specified in the election ... (B) the credit determined under subsection (a)" (`usc-26-2025::sec::s41::h-2`).
- Default: line 34 is the amount elected, at most $500,000, and is not also capped at line 28. Line 36 applies the line 28 limit. The blind fill took the same reading (case 13: line 34 is 40,000 with line 28 at 30,000).
- Changes dollars: line 34 as printed only (40,000 against 30,000 in that case). Line 36, the payroll tax credit, is the same either way.

### 8. QREs with no method — done

- Source: "Section A—Regular Credit. Skip this section and go to Section B if you are electing or previously elected (and are not revoking) the alternative simplified credit" (`irs-6765-face-2025::sec::face-page-1::b01`): every credit is figured on Section A or B.
- Default: a fact with QREs or energy consortia payments and no method leaves lines 5 to 28 blank, and the form lists `research_credit` in its missing inputs, so Cade asks for the method (`figures.ts` `waitsOnMethod`). A fact with no QREs and no method (the reduced credit election alone) asks nothing.
- Changes dollars: no; the return waits instead of filing with no credit.

### 9. More than 15 business components in Section G — a named gap

- Source: "If you do not e-file and you have more than 15 business components, report for your 80%/Top 50, attach additional sheets of Section G and provide the sum of the additional sheets in the 'Total from Attachments' line" (`irs-6765-inst-2025::sec::how-to-complete-section-g::b03`).
- Default: the engine prints the first 15 rows and counts every component in Total and Section F, so the credit is right. It prints no additional sheet, so each "Total from attachments" cell is a gap (`sectionG.ts` `ATTACHMENT_SHEETS_GAP`) and a person attaches the sheets.
- Not now: Section G is optional for 2025, and printing extra sheets needs a copy of Section G only, which the copies mechanism (a whole form per copy) does not give cleanly.
- Changes dollars: no.

### 10. California and the section 280C reduction — a named gap

- Source: "California law conforms to federal law, but requires the amount of research expenses to be reduced by the amount of the California credit" (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b05`); the federal expenses go in Schedule CA column C, and the California expenses after the California credit in column B (`::b06`).
- Default: when the federal reduction lowered a Schedule C line, Schedule CA (540) line 3 columns B and C are a gap (`state/ca/schedule-ca/answerLines.ts` `CA_RESEARCH_GAP`). Schedule CA (540NR) reads the same rule.
- Not now: the California credit is figured on FTB 3523, which the engine does not have (see the proposal below).
- Changes dollars: yes, California AGI, by the federal credit less the California credit; the gap keeps the return from printing a wrong amount.

## Pattern change

None. The section 280C reduction follows the shape main already has for credits that lower a deduction (`facts/kinds/activitiesOnReturn.ts`, as the work opportunity and tip credits), and the credit reaches Form 3800 as a source of its own (`3800/sources.ts`, as Forms 5884, 8846 and 3468).

## Proposals for a discussion

- **Form 3800's carryforward after a payroll tax election.** "The unused credit for the current year is determined by reducing the amount on Part I, line 6, and Part II, line 36, by the amount on Form 6765, line 36" (`irs-3800-inst-2025::sec::carryback-and-carryforward-of::b03`). Form 3800's carryforward columns (Part III column (i), Part V column (i)) do not subtract line 36 yet. They print only with a transfer or elective payment election or two sources on one line, and no scenario has both. The change is in `federal/3800` (allocation), so it waits for a person.
- **California's research credit (FTB 3523).** Schedule CA line 3 is a gap when the federal 280C reduction applies (item 10). Filling it needs FTB 3523, a new California form with its own rules (California "requires the use of the California tax bracket when determining the elective credit amount", `ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b05`), and a California research fact or answers on this one. Then column B takes the federal reduction less the California credit.
- **Research in a farm, a rental or a K-1 entity of one's own.** The fact names a Schedule C business only. Research in a Schedule F farm is a gap on line 28.
- **Capitalized research expenditures.** A taxpayer who elects section 174A(c) amortization reduces the capital account, not the deduction (`item-a-section-280c-election::b01`). The engine has no section 174A amortization, so it always reduces the Schedule C lines.

## Second opinions

- **Blind fill** (14 cases, 91 lines: Sections A, B, D and F, the section 280C election, line 27). Every line matched the engine, with no blank-against-0 differences. Its two doubts that touch an amount are items 3 and 7.
- **PolicyEngine-US 2.154.1** (commit `0fbed6dd`, 2026-11-26). It does not model Form 6765: `general_business_credit` (`variables/gov/irs/credits/general_business/`) is a bare input with no formula, and nothing in its IRS variables or parameters names section 41, the research credit or the payroll tax election. No constant or formula to compare. No lead.
- **IRS Direct File.** Not compared: no checkout here, and Direct File's scope has no business income, so it has no research credit.
