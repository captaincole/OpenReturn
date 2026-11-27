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
| Line 5 | Stated rule; rounding each K-1 is a decision of the author (item 4) |
| Line 6 | Stated rule |
| Schedule C line 23 reduction | Stated rule |
| Form 3800 line 4f | Stated rule; the split into one source per business and per K-1 is own reading (item 5) |

One decision has two texts that point different ways: the rounding of line 5 (item 4). It has a `DECISION` comment in `resolveInfo.ts` and row A96 in `docs/rule-decisions.md`.

The form has no rows to run out of: one Form 8846 adds every business and every K-1 of the return.

## Two texts conflict

### 4. Line 5 rounds each K-1

- Source: line 5 is the credit "from partnerships and S corporations" (`face-page-1::b01`), with no rule for the cents. The Form 1040 instructions: "include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). Line 6 goes to Form 3800 line 4f, whose aggregate "from more than one pass-through entity" is broken down by each entity's EIN in Part V (`irs-3800-inst-2025::sec::part-v-3::b01`).
- Decision: each K-1's code N amount is rounded to the dollar, then added, as Form 3800 rounds each K-1 source (`3800/k1Credits.ts`). Form 3800 line 4f then adds to Form 8846 line 6. The blind fill followed the 1040 rule instead: K-1s of $600.40 and $1,200.40 give line 5 of $1,801 (blind) or $1,800 (engine). The statute leaves the rounding to the forms and instructions (`usc-26-2025::sec::s6102::a`).
- Changes dollars: at most $1 for each K-1 with cents.

## Should we do this now

### 1. Line 2 never takes more than the month's tips

- Source: "Figure the amount of tips included on line 1 that are not creditable for each employee on a monthly basis. This is the total amount that would be payable to the employee at $5.15 or $7.25 an hour reduced by the wages (excluding tips) actually paid to the employee during the month" (`irs-8846-form-2025::sec::line-2::b01`). "The amount of tips for any month that are used to figure the credit must be reduced by the amount by which the wages that would have been payable ... exceed the wages" (`how-the-credit-is-figured::b01`).
- The instructions do not say what happens when the shortfall is larger than the month's tips.
- Default: a month's amount is the smaller of the shortfall and the month's tips. A shortfall never reduces another employee's tips or another month's. The statute agrees: the credit is the tax on tips "to the extent such tips ... exceed the amount by which the wages ... are less than" the minimum wage amount (`usc-26-2025::sec::s45b::b-1`).
- Changes dollars: yes, only when an employer pays less than the minimum wage with tips included, which the Fair Labor Standards Act does not allow. Rare.
- Status: done.

### 2. The Medicare-only tips are a stated amount

- Source: "check the box on line 4 and attach a separate computation showing the amount of tips subject to only the Medicare tax rate of 1.45%" (`line-4::b01`).
- Default: the owner states that amount from the payroll records (`tipsSubjectOnlyToMedicare`), the creditable tips of line 3 paid after the employee's wages and tips passed $176,100. The engine does not order the year's paychecks. It checks only that the amount is not more than the business's creditable tips.
- Changes dollars: no; it is the stated input of the attached computation.
- Status: done.

### 3. A fiscal year

- Source: "Fiscal-year taxpayers. If you have an employee with wages and tips paid in 2026 that exceeded the 2026 social security wage base of $184,500 ..." (`line-4::b01`).
- Default: the engine files calendar-year individual returns only, so the 2026 wage base is not used.
- Changes dollars: no for a calendar-year return.
- Status: not now; the engine files no fiscal-year return.

### 5. Form 3800 takes the own credit and each K-1 as separate sources

- Source: line 6, "All others, report this amount on Form 3800, Part III, line 4f" (`face-page-1::b01`); Form 3800 column (c) and Part V list each pass-through entity (`irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b04`, `part-v-3::b01`).
- Default: Form 3800 line 4f has one source for each business's part of line 4 and one for each K-1 (with its EIN and passive answer). Its total equals Form 8846 line 6. With two or more businesses, line 4 is figured on the totals, and each business's part is line 4 prorated by its own credit, so the parts add to line 4. The same part reduces that business's line 23.
- Changes dollars: no.
- Status: done.

### 6. The election not to claim

- Source: "You can claim or elect not to claim the credit any time within 3 years from the due date of your return" (`purpose-of-form::b01`); section 45B(d) (`usc-26-2025::sec::s45b::d`). "Reduce the income tax deduction for employer social security and Medicare taxes by the amount on line 4" (`line-4::b01`).
- Default: the tip credit fact carries `electNotToClaim`. With it, Form 8846 does not file, the business keeps its whole deduction, and Form 3800 takes no own credit. The decision `decisions.scope.must_file_8846` set to false also takes the form off the return. The Schedule C reduction reads only facts, so with that decision and a claimed fact, Form 3800 line 4f is a gap that tells Cade to record the election on the fact (`form3800.ts`). The return never loses the deduction and the credit together.
- Changes dollars: no; the conflicting case stops with a reason.
- Status: done as a gap. The full rule (the decision also restores the deduction) is a proposal below.

### 7. The reduction comes off "taxes and licenses"

- Source: Schedule C line 23 lists "Social security and Medicare taxes paid to match required withholding from your employees' wages. Reduce your deduction by the amount shown on Form 8846, line 4" (`irs-1040sc-inst-2025::sec::line-23::b01`).
- Default: the business's stated `taxesAndLicenses` hold the employer taxes before the credit. The engine subtracts the business's part of line 4. When the stated taxes are less than that part, line 4 is a gap: the stated taxes cannot hold the employer taxes on the tips.
- Changes dollars: no.
- Status: done.

### 8. California

- Source: Schedule CA lists the federal credits whose reduced deductions differ for California, and this credit is not on the list (`ca-540-sched-ca-inst-2025::sec::business-deductions-related-to::b01`). FTB Pub. 1001 treats the federal Work Opportunity Credit's reduced wage expense as a column B subtraction (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07`).
- Default: no Schedule CA adjustment. California has no tip credit, so the federal reduction may be a California difference, but neither text names it.
- Changes dollars: yes for a California resident with this credit (Schedule CA line 3, column B, the amount of line 4).
- Status: not now; no text names the adjustment, so it waits for a person (proposal below).

### 9. A passive business

- Default: a credit from a Schedule C business the owner does not materially participate in is a passive activity credit. The engine does not figure a passive Schedule C business (its line 31 stays blank), so the Form 3800 source is a gap. Form 8846 itself still fills.
- Changes dollars: no; the engine stops.
- Status: not now; it needs the passive Schedule C business first.

### 10. A food business and a beauty business on one form

- Source: the rate is set by the employer type: "Food or beverage employers ... $5.15 an hour"; "Beauty service employers ... $7.25 an hour" (`how-the-credit-is-figured::b01`). The instructions do not discuss a taxpayer with both.
- Default: each business's employee months use its own rate (the tip credit fact's `kind`), and line 2 adds all of them. The blind fill made the same choice.
- Changes dollars: yes, for an owner of both kinds of business: a month of 120 hours at $300 wages is $570 at $7.25 and $318 at $5.15.
- Status: done.

### 11. Cents in line 2 and line 4

- Source: line 2 is figured "for each employee on a monthly basis" (`line-2::b01`); line 4 with the box: "multiply the difference by 0.0765. Then, multiply the tips subject only to the Medicare tax by 0.0145. Enter the sum of these amounts on line 4" (`line-4::b01`).
- Default: line 2 keeps the cents of each month and rounds only the total; line 4 keeps the cents of both products and rounds the sum once (the 1040 rule, `irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). The blind fill made the same choices.
- Changes dollars: at most $1 on each line, against a reading that rounds each month or each product.
- Status: done.

## Pattern change

### 12. The facts layer reads a form's figures

- Before: the fact kinds in `facts/` imported nothing from a form folder; Schedule C read the stated business with only the Form 4797 recapture added.
- After: `facts/kinds/activitiesOnReturn.ts` imports `federal/8846/figures.ts` and takes Form 8846 line 4 off each business's taxes, so every form that reads the business sees the reduced line 23. The figures read only facts, so no cycle is possible.

## Second opinions

- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1, 2026-11-26).** It has no Form 8846 or section 45B formula: `general_business_credit` is a bare input. Its constants agree with the engine: the 2025 social security wage base of $176,100 (`payroll/social_security/cap.yaml`), the employer rates 6.2% and 1.45% (`payroll/social_security/rate/employer.yaml`, `payroll/medicare/rate/employer.yaml`), which add to line 4's 7.65%. It has no $5.15 or $7.25 rate for this credit. No lead.
- **IRS Direct File.** Not compared: it files no Schedule C business with employees and no Form 3800, so it has no Form 8846 logic.

## Proposals for a discussion

- **California (item 8).** Add Form 8846 line 4 to Schedule CA line 3 column B for a California return, if a person agrees that California allows the full deduction.
- **The facts layer reads a form's figures (item 12).** A person may prefer the arithmetic in the fact kind instead of an import from `federal/8846/`.
- **The decision not to file reaches the deduction (item 6).** `businessesOnReturn` takes only facts, and about 25 resolvers call it. Passing the decisions to it would let `decisions.scope.must_file_8846` = false also restore Schedule C line 23, so the conflict gap is no longer needed.
