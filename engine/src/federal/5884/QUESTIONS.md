# Form 5884 — doubts and defaults

Form 5884 claims the work opportunity credit for wages paid to employees that a state workforce agency certified as members of a targeted group. The engine fills it for an individual with employees in a Schedule C business or a Schedule F farm. The form (Rev. March 2021) and its instructions publish no example with numbers. The synthetic `byar` (a farm, federal) and `daved` (a business, California) are the scenarios; `tests/unit/federal/5884/` holds the limit tests.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Lines 1a, 1b, 1c: the rates and the hour thresholds | Stated rule (form face; section 51(i)(3) agrees) |
| Lines 1a, 1b, 1c: the wage limit of each group | Stated rule (instructions); the earlier-year part is own reading (item 2) |
| Line 2 | Stated rule |
| Line 3 | Stated rule; the other notices are own reading (item 5) |
| Line 4 | Stated rule |
| Lines 5 and 6 | Stated rule: blank for an individual |
| The wage reduction (Schedule C line 26, Schedule F line 22) | Stated rule; the share of each activity is own reading (item 3) |
| Schedule CA (540) line 3 and Schedule CA (540NR) Part II line 3, column B | Stated rule (FTB Publication 1001); a unit test checks the 540NR copy |
| Schedule CA line 6 column B (a California farm) | Stated rule (FTB Publication 1001); a gap when the farm also states another wage credit (item 4) |
| Lines 1a to 4 with an employee of a rental or a farm rental | Unsupported (item 7) |

## Two texts conflict

None. No two official texts conflict, so there is no `DECISION` comment and no row in `docs/rule-decisions.md`. The statute was read for items 1 and 2: section 51(i)(3) (`usc-26-2025::sec::s51::i-3`) counts the hours "of service for the employer" with no period, and section 51(b)(2) and (b)(3) (`usc-26-2025::sec::s51::b`) tie the wage limit to the 1-year period. Both agree with the instructions.

## Should we do this now

Each item is a default the engine applies. "Now" says whether it is done or why not.

1. **Which hours count.** "Qualified first-year wages of employees who worked for you at least 120 hours but fewer than 400 hours" (`irs-5884-face-2025::sec::face-page-1::b01`); "The amount of qualified wages for any employee is zero if: The employee didn't work for you for at least 120 hours" (`irs-5884-inst-2025::sec::qualified-wages::b01`). Default: the fact states the hours the employee worked for the taxpayer, counted to the end of 2025; an employee hired in 2024 counts the hours of both years. The blind fill read it the same way (its case 8). Changes dollars for such an employee (25% against 40%). Now: done.
2. **A wage limit over two tax years.** The limit is on "the amount of qualified first-year wages that may be taken into account for any employee", and the first-year wages are those "for work performed during the 1-year period beginning on the date the employee begins work for you" (`lines-1a-1b-and-1c::b01`). That period can span two tax years. Default: the fact states the wages an earlier return already took into account, and the limit less that amount caps this year's wages. Now: done.
3. **The wage reduction of each business or farm.** "In general, you must reduce your deduction for salaries and wages by the amount on line 2. This is required even if you can't take the full credit this year" (`line-2::b01`); Schedule C line 26 and Schedule F line 22 name Form 5884 (`irs-1040sc-inst-2025::sec::line-26::b01`, `irs-1040sf-inst-2025::sec::line-22::b01`). Default: each activity's reduction is lines 1a to 2 figured for its own employees, so two activities can differ from line 2 by $1. A credit from a K-1 does not reduce the wages ("Do not reduce your deduction for any portion of a credit that was passed through to you"). Only stated wages are reduced, never below 0. Now: done.
4. **The farm's employmentCredits.** Schedule F line 22 takes the credits of Forms 5884, 8844, 8932 and 8994. Default: the farm fact's `employmentCredits` holds the other three credits, and the engine adds the Form 5884 credit of the farm's employee facts. A farm that stated the Form 5884 credit there and also has employee facts would count it twice; Cade records one or the other. In California, Schedule CA line 6 column B takes the Form 5884 part (the labor hired it took off, at most the stated labor). A farm that also states another wage credit stays a named gap, because the fact does not say which form each stated dollar came from. Now: done; splitting the stated credits by form waits for a scenario with one of those forms.
5. **Line 3 and the credits from pass-through entities.** "All other filers figuring a separate credit on earlier lines also report the above credits on line 3" (`line-3::b01`); Form 3800 asks for each pass-through entity's EIN in column (c) and lists each one in Part V (`irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b04`). Default: line 3 adds the K-1 code J credits of partnerships and S corporations, and any stated Form 3800 line 4b credit that names its pass-through entity. Form 3800 keeps each as its own source. A trust's K-1 (Form 1041) of 2025 has no work opportunity code; its credit is box 13 code ZZ, which Form 3800 line 1zz holds as a gap. Now: done.
6. **Electing not to claim.** "You can claim or elect not to claim the work opportunity credit any time within 3 years from the due date of your return" (`general-instructions::b01`). Default: the employee facts are the claim. The decision `decisions.scope.must_file_5884 = false` takes the form and its Form 3800 source off the return, but the facts still reduce the wages, because the facts layer does not read decisions. Now: not done; Cade records no employee for a credit the taxpayer does not claim, so the two do not disagree in practice.
7. **An employee of a rental or a farm rental.** Line 2 reduces "your deduction for salaries and wages" (`line-2::b01`), on the schedule that deducts them. Schedule E has no wage line, and Form 4835 is not wired to these facts. An employee fact whose activity is not a Schedule C business or Schedule F farm of the return makes lines 1a to 4 and the Form 3800 source unsupported. Now: not done; no scenario has a rental with targeted group employees.
8. **A stated line 4b credit next to the employees.** A stated Form 3800 line 4b credit with no pass-through entity, next to employee facts, makes the Form 3800 source a gap: the engine cannot tell whether it is the same credit. A stated line 4b credit alone stays as before. Now: done.
9. **A passive business or farm.** Form 3800 column (e) holds the credit "not subject to the passive activity limitation of section 469 because of your material participation in the trade or business" (`transferees-of-eligible-credits-under-section::b05`). Default: line 2 of the employees of an activity with Schedule C line G or Schedule F line E "No" is a passive source of its own (column (d), Form 8582-CR). Now: done.
10. **Controlled groups, successor employers, the exclusions.** A member of a controlled group enters "your share of the credit on line 2" with a statement (`member-of-controlled-group-or::b01`); a successor employer reduces its wages by the previous employer's (`lines-1a-1b-and-1c::b04`); the wages exclude several kinds (`qualified-wages::b02`, `::b03`). Default: the fact states qualified wages already net of the exclusions, and no fact says the business is in a controlled group or is a successor. Now: not done; it needs a new field on the business fact (Pattern change below).
11. **Rows and copies.** Form 5884 has no rows: each line adds every employee's wages, so nothing repeats past a limit. Now: nothing to do.
12. **Rounding of lines 1a to 1c.** The form and its instructions give no rounding rule. Default: each line adds its employees' wages with cents and rounds the total once; the credit is that total times the rate, rounded to the nearest dollar. Line 2 adds the rounded lines. The blind fill used the same method. Now: done.

## Pattern change

### Proposals for a discussion

- **A controlled group or a successor employer.** Before: the engine figures line 2 from the employee facts and assumes the business is in no controlled group and succeeds no employer. After: the business fact would say whether it is a member of a controlled group, with its share of the group's credit as a stated amount on line 2 and the statement the engine prints.
- **The certification as a document.** Before: the employee facts are stated answers from the payroll records and the certifications. After: the state workforce agency's certification letter and the employer's Form 8850 would be input documents, but no official form holds the wages or the hours, so what such a document looks like is a person's decision.

## Second opinions

- **Blind fill (2026-11-27).** A blind preparer filled 14 cases from the blank form and irs-5884-inst-2025 only. Every line of every case matched the engine. Its doubts are items 1, 2, 5 and 12.
- **PolicyEngine-US 2.154.1** (commit 0fbed6dd). It does not model the work opportunity credit: `general_business_credit` is a bare input with no formula. Nothing to compare.
- **IRS Direct File.** It supports no business with employees and no Form 3800, so it has no Form 5884 logic to compare.
- **The statute.** Section 51(b) and 51(i)(3) were read on 2026-11-27 (items 1 and 2). They agree with the instructions.
