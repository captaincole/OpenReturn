# Form 5884 — doubts and defaults

Form 5884 claims the work opportunity credit for wages paid to employees that a state workforce agency certified as members of a targeted group. The engine fills it for an individual with employees in a Schedule C business or a Schedule F farm. The form (Rev. March 2021) and its instructions publish no example with numbers. The synthetic `byar` (a farm, federal) and `daved` (a business, California) are the scenarios; `tests/unit/federal/5884/` holds the limit tests.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Lines 1a, 1b, 1c: the rates and the hour thresholds | Stated rule (form face) |
| Lines 1a, 1b, 1c: the wage limit of each group | Stated rule (instructions); the earlier-year part is own reading (item 2) |
| Line 2 | Stated rule |
| Line 3 | Stated rule; the other notices are own reading (item 5) |
| Line 4 | Stated rule |
| Lines 5 and 6 | Stated rule: blank for an individual |
| The wage reduction (Schedule C line 26, Schedule F line 22) | Stated rule; the share of each activity is own reading (item 3) |
| Schedule CA line 3 column B | Stated rule (FTB Publication 1001) |
| Lines 1a to 4 with an employee of a rental or a farm rental | Unsupported (item 7) |

No two official texts conflict, so there is no `DECISION` comment and no row in `docs/rule-decisions.md`. The law library was not installed, so the statute was not read.

## Doubts with no conflicting text

### 1. Which hours count

- Source: "Qualified first-year wages of employees who worked for you at least 120 hours but fewer than 400 hours" (`irs-5884-face-2025::sec::face-page-1::b01`); "The amount of qualified wages for any employee is zero if: The employee didn't work for you for at least 120 hours" (`irs-5884-inst-2025::sec::qualified-wages::b01`).
- Default: the fact states the hours the employee worked for the taxpayer, counted to the end of 2025. An employee hired late in 2025 who reaches 400 hours in 2026 is on line 1a this year.
- Changes dollars: yes, for such an employee (25% against 40%).

### 2. A wage limit over two tax years

- Source: the limit is on "the amount of qualified first-year wages that may be taken into account for any employee" (`lines-1a-1b-and-1c::b01`); the first-year wages are those "for work performed during the 1-year period beginning on the date the employee begins work for you" (same block). That period can span two tax years.
- Default: the fact states the first-year (and second-year) wages an earlier return already took into account. The limit less that amount caps this year's wages.
- Changes dollars: yes, when the 1-year period started in 2024.

### 3. The wage reduction of each business or farm

- Source: "In general, you must reduce your deduction for salaries and wages by the amount on line 2. This is required even if you can't take the full credit this year" (`line-2::b01`); Schedule C line 26 and Schedule F line 22 name Form 5884 (`irs-1040sc-inst-2025::sec::line-26::b01`, `irs-1040sf-inst-2025::sec::line-22::b01`).
- Default: each activity's reduction is lines 1a to 2 figured for its own employees. With one activity this is line 2 exactly. With two activities the rounded shares can differ from line 2 by $1.
- A credit from a K-1 does not reduce the wages ("Do not reduce your deduction for any portion of a credit that was passed through to you", Schedule C line 26).
- Only stated wages are reduced, never below 0. A business that states no wages has nothing to reduce.
- Changes dollars: $1 at most, with two or more activities.

### 4. The farm's employmentCredits

- Source: Schedule F line 22 takes the credits of Forms 5884, 8844, 8932 and 8994.
- Default: the farm fact's `employmentCredits` now holds the other three credits. The engine adds the Form 5884 credit of the farm's employee facts to it. A farm that stated the Form 5884 credit there and also has employee facts would count it twice; Cade records one or the other.
- Changes dollars: only for a farm that states both.

### 5. Line 3 and the credits from pass-through entities

- Source: "All other filers figuring a separate credit on earlier lines also report the above credits on line 3. All others not using earlier lines to figure a separate credit can report the above credits directly on Form 3800, Part III, line 4b" (`line-3::b01`). Form 3800 asks for each pass-through entity's EIN in column (c) and lists each one in Part V (`irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b04`).
- Default: line 3 adds the K-1 code J credits of partnerships and S corporations, and any stated Form 3800 line 4b credit that names its pass-through entity (a Form 1099-PATR or a trust's K-1). Form 3800 keeps each of them as its own source, with its EIN and its passive answer, and adds line 2 as one more source. Part III line 4b totals line 4.
- A trust's K-1 (Form 1041) of 2025 has no work opportunity code; its credit is box 13 code ZZ, which Form 3800 line 1zz holds as a gap.
- Changes dollars: no. Only the rows of Part V.

### 6. Electing not to claim

- Source: "You can claim or elect not to claim the work opportunity credit any time within 3 years from the due date of your return" (`general-instructions::b01`).
- Default: the employee facts are the claim. A taxpayer who does not claim the credit has no employee facts, and the wages are not reduced. The decision `decisions.scope.must_file_5884 = false` takes the form and its Form 3800 source off the return, but the facts still reduce the wages, because the facts layer does not read decisions.
- Changes dollars: yes, if the decision and the facts disagree. Cade records no employee for a credit the taxpayer does not claim.

### 7. An employee of a rental or a farm rental

- Source: line 2 reduces "your deduction for salaries and wages" (`line-2::b01`), on the schedule that deducts them.
- Default: Schedule E has no wage line, and Form 4835 is not wired to these facts. An employee fact whose activity is not a Schedule C business or Schedule F farm of the return makes lines 1a to 4 and the Form 3800 source unsupported.
- Changes dollars: the whole credit, on such a return.

### 8. A stated line 4b credit next to the employees

- Default: a stated Form 3800 line 4b credit with no pass-through entity, next to employee facts, makes the Form 3800 source a gap: the engine cannot tell whether it is the same credit.
- A stated line 4b credit alone, with no employee facts, stays as before: it goes on Form 3800 and Form 5884 does not file.
- Changes dollars: no.

### 9. A passive business or farm

- Source: Form 3800 column (e) holds the credit "not subject to the passive activity limitation of section 469 because of your material participation in the trade or business" (`transferees-of-eligible-credits-under-section::b05`).
- Default: line 2 of the employees of an activity with Schedule C line G or Schedule F line E "No" is a passive source of its own (column (d), Form 8582-CR Worksheet 4). While line G or line E is not answered, Form 3800 asks for the activity.
- Changes dollars: yes, through Form 8582-CR.

### 10. Not modeled: controlled groups, successor employers, the exclusions

- Source: a member of a controlled group enters "your share of the credit on line 2" with a statement (`member-of-controlled-group-or::b01`); a successor employer reduces its wages by the previous employer's (`lines-1a-1b-and-1c::b04`); the wages exclude several kinds (`qualified-wages::b02`, `::b03`).
- Default: the fact states qualified wages already net of the exclusions. No fact says the business is in a controlled group or is a successor. Such a business is outside the engine's reach for now (proposal below).
- Changes dollars: yes, for such a business.

### 11. Rows and copies

- Form 5884 has no rows: each line adds every employee's wages. Nothing repeats past a limit.

## Proposals for a discussion

- **A controlled group or a successor employer.** Before: the engine figures line 2 from the employee facts and assumes neither. After: the business fact would say whether the business is a member of a controlled group or a group under common control, with its share of the group's credit as a stated amount on line 2 and the attached statement. That is a new field on the business fact and a statement the engine would print.
- **The certification as a document.** The employee facts are stated answers. The state workforce agency's certification letter and the employer's Form 8850 are the documents behind them, but no official form holds the wages or the hours. What such an input document looks like is a person's decision (CLAUDE.md, "When two official texts conflict").
