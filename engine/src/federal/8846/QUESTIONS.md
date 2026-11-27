# Form 8846 — doubts and defaults

The engine fills Form 8846 for an individual: a Schedule C business with tipped employees (food or beverage service, or from 2025 beauty services), and K-1 credits on line 5. The instructions publish one example with numbers (line 2, one employee month). A third-party walkthrough gives a second (Fit Small Business, $10,000 of tips). Both are unit tests. The synthetic taxpayer `natti` fills every line.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Line 1 | Stated rule (a stated payroll total) |
| Line 2 | Published example with numbers; the cap at the month's tips is own reading (item 1) |
| Line 3 | Stated rule |
| Line 4 box | Stated rule (a stated answer) |
| Line 4 | Published example with numbers without the box; stated rule with it (no example) |
| Line 5 | Stated rule; rounding each K-1 is own reading (item 4) |
| Line 6 | Stated rule |
| Schedule C line 23 reduction | Stated rule |
| Form 3800 line 4f | Stated rule; the split into one source per business and per K-1 is own reading (item 5) |

No two texts conflict, so there is no `DECISION` comment.

## Doubts

### 1. Line 2 never takes more than the month's tips

- Source: "Figure the amount of tips included on line 1 that are not creditable for each employee on a monthly basis. This is the total amount that would be payable to the employee at $5.15 or $7.25 an hour reduced by the wages (excluding tips) actually paid to the employee during the month" (`irs-8846-form-2025::sec::line-2::b01`). "The amount of tips for any month that are used to figure the credit must be reduced by the amount by which the wages that would have been payable ... exceed the wages" (`how-the-credit-is-figured::b01`).
- The instructions do not say what happens when the shortfall is larger than the month's tips.
- Default: a month's amount is the smaller of the shortfall and the month's tips. A shortfall never reduces another employee's tips or another month's. The statute agrees: the credit is the tax on tips "to the extent such tips ... exceed the amount by which the wages ... are less than" the minimum wage amount (`usc-26-2025::sec::s45b::b-1`).
- Changes dollars: yes, only when an employer pays less than the minimum wage with tips included, which the Fair Labor Standards Act does not allow. Rare.

### 2. The Medicare-only tips are a stated amount

- Source: "check the box on line 4 and attach a separate computation showing the amount of tips subject to only the Medicare tax rate of 1.45%" (`line-4::b01`).
- Default: the owner states that amount from the payroll records (`tipsSubjectOnlyToMedicare`), the creditable tips of line 3 paid after the employee's wages and tips passed $176,100. The engine does not order the year's paychecks. It checks only that the amount is not more than the business's creditable tips.
- Changes dollars: no; it is the stated input of the attached computation.

### 3. A fiscal year

- Source: "Fiscal-year taxpayers. If you have an employee with wages and tips paid in 2026 that exceeded the 2026 social security wage base of $184,500 ..." (`line-4::b01`).
- Default: the engine files calendar-year individual returns only, so the 2026 wage base is not used.
- Changes dollars: no for a calendar-year return.

### 4. Line 5 rounds each K-1

- Source: line 5 is the credit "from partnerships and S corporations" (`face-page-1::b01`), with no rule for the cents.
- Default: each K-1's code N amount is rounded to the dollar, then added, as Form 3800 rounds each K-1 source (`3800/k1Credits.ts`). Form 3800 line 4f then adds to Form 8846 line 6.
- Changes dollars: at most $1 for each K-1 with cents.

### 5. Form 3800 takes the own credit and each K-1 as separate sources

- Source: line 6, "All others, report this amount on Form 3800, Part III, line 4f" (`face-page-1::b01`); Form 3800 column (c) and Part V list each pass-through entity (`irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b04`, `part-v-3::b01`).
- Default: Form 3800 line 4f has one source for each business's part of line 4 and one for each K-1 (with its EIN and passive answer). Its total equals Form 8846 line 6. With two or more businesses, line 4 is figured on the totals, and each business's part is line 4 prorated by its own credit, so the parts add to line 4. The same part reduces that business's line 23.
- Changes dollars: no.

### 6. The election not to claim

- Source: "You can claim or elect not to claim the credit any time within 3 years from the due date of your return" (`purpose-of-form::b01`); section 45B(d) (`usc-26-2025::sec::s45b::d`).
- Default: the tip credit fact carries `electNotToClaim`. With it, Form 8846 does not file, the business keeps its whole deduction, and Form 3800 takes no own credit. The decision `decisions.scope.must_file_8846` set to false also takes the form and its Form 3800 source off the return, but the Schedule C reduction follows the fact. Cade records the election on the fact.
- Changes dollars: yes, when the decision and the fact disagree. Cade sets the fact.

### 7. The reduction comes off "taxes and licenses"

- Source: Schedule C line 23 lists "Social security and Medicare taxes paid to match required withholding from your employees' wages. Reduce your deduction by the amount shown on Form 8846, line 4" (`irs-1040sc-inst-2025::sec::line-23::b01`).
- Default: the business's stated `taxesAndLicenses` hold the employer taxes before the credit. The engine subtracts the business's part of line 4. When the stated taxes are less than that part, line 4 is a gap: the stated taxes cannot hold the employer taxes on the tips.
- Changes dollars: no.

### 8. California

- Source: Schedule CA lists the federal credits whose reduced deductions differ for California, and this credit is not on the list (`ca-540-sched-ca-inst-2025::sec::business-deductions-related-to::b01`). FTB Pub. 1001 treats the federal Work Opportunity Credit's reduced wage expense as a column B subtraction (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07`).
- Default: no Schedule CA adjustment. California has no tip credit, so the federal reduction may be a California difference, but neither text names it.
- Changes dollars: yes for a California resident with this credit (Schedule CA line 3, column B, the amount of line 4).

### 9. A passive business

- Default: a credit from a Schedule C business the owner does not materially participate in is a passive activity credit. The engine does not figure a passive Schedule C business (its line 31 stays blank), so the Form 3800 source is a gap. Form 8846 itself still fills.
- Changes dollars: no; the engine stops.

## Proposals for a discussion

- **California (item 8).** Add Form 8846 line 4 to Schedule CA line 3 column B for a California return, if a person agrees that California allows the full deduction.
- **The facts layer reads a form's figures.** `facts/kinds/activitiesOnReturn.ts` imports `federal/8846/figures.ts` to reduce Schedule C line 23 for every form that reads the business, as it already applies the Form 4797 recapture. It is the first import from `facts/` into a form folder. The figures read only facts, so no cycle is possible. A person may prefer the arithmetic in the fact kind instead.
