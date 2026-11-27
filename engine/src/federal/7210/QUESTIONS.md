# Form 7210 — open doubts

Form 7210 figures the clean hydrogen production credit (section 45V) of one facility. The instructions publish no example with numbers. Each doubt below names the text, the default the engine applies, and whether it changes dollars.

## Line A with more than one process

- Text: "Enter the facility's lifecycle greenhouse gas emissions value or rate ... for each hydrogen production process" (`irs-7210-inst-2025::sec::specific-instructions::b01`).
- The box on the form holds 9 characters: one rate.
- Default: one process prints its rate and DOE control number. Two or more processes make line A(i) unsupported, and A(ii) too when a process has a control number.
- Dollars: none. Lines 6a to 12 do not read line A.

## Line 7 adds column (c) with cents

- Text: "Add column (c) of lines 6a through 6d" (`irs-7210-inst-2025::sec::line-7::b01`).
- Default: each row prints rounded; line 7 adds the rows with their cents and rounds once, the rule for a total of computed rows in `CLAUDE.md` (Form 4562 line 44). The Form 1040 rule says the same: "If you have to add two or more amounts to figure the amount to enter on a line, include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`).
- Other reading: line 7 adds the whole-dollar column (c) entries as printed. The blind fill chose it (case 3: $786 + $473 + $530 + $564 = $2,353, against the engine's $2,354 from $2,353.9975).
- Dollars: at most $2 on line 7 with four rows (then times 5 on line 10). The `rand` scenario has none.

## Two processes in one emissions row

- Text: "Only one emissions rate should be used to calculate the credit for each hydrogen production process" (`irs-7210-inst-2025::sec::line-7::b01`). The form has one row for each emissions band, not for each process.
- Default: processes in the same band add their kilograms in column (a), and column (c) is the total kilograms times column (b), rounded once.
- Dollars: at most $1 for each extra process, against rounding each process before the add. The blind fill made the same choice (case 2).

## Construction that began on January 29, 2023

- Text: "A facility the construction of which begins prior to January 29, 2023" (`irs-7210-inst-2025::sec::increased-credit-amount-for-qualified-clean::b01`); "The apprenticeship requirements only apply to facilities for which construction began on or after January 29, 2023" (`irs-7210-inst-2025::sec::line-5::b02`).
- Default: January 29, 2023 is not "prior to", so that facility needs the apprenticeship answer too (`facility.ts`, `APPRENTICESHIP_START`).
- Dollars: yes, the times-5 increase. The texts agree; the blind fill made the same choice (case 7).

## A facility with no 2025 credit files no Form 7210

- Texts: no section 45V credit at a facility with a section 45Q credit (`irs-7210-inst-2025::sec::apprenticeship-requirements::b03`) or a section 48(a)(15) election (`irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02`); construction must begin before 2028 (`::apprenticeship-requirements::b02`); the 10-year credit period (`::general-instructions::b01`).
- Default: such a facility has no copy, and the must-file rule counts only facilities with a credit. The explicit decision still files the form.
- Dollars: none; the credit is 0 either way.

## The 10-year period ends during 2025

- Text: "for the 10-year period beginning on the date the facility ... is originally placed in service" (`irs-7210-inst-2025::sec::line-4::b01`).
- Default: the facility fact states only the kilograms made inside the period. A facility placed in service on January 1, 2015 has no 2025 day.
- Dollars: none, when the taxpayer states the kilograms as defined.

## Line 5 for construction before January 29, 2023

- Text: the facility "satisfies the prevailing wage requirements with respect to any alterations or repairs occurring after January 29, 2023" (`irs-7210-inst-2025::sec::increased-credit-amount-for-qualified-clean::b01`, `::b02`).
- Default: the stated `prevailingWageMet` answer is true when there was no alteration or repair (section 45V(e)(2)(A) asks only about them). The apprenticeship answer is not asked.
- Dollars: yes, the whole times-5 increase, when the answer is wrong. Form 7220 is not in the engine; it is an attachment, and line 5 does not wait for it.

## Same facility on Form 3468

- Text: "No credit will be allowed under section 45V or section 45Q for any tax year with respect to any specified clean hydrogen production facility" (`irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02`).
- Default: the facility fact answers `energyPropertyElection`. When a Form 3468 Section M property of the return has the same registration number, address or coordinates and the answer is false, every amount line and Form 3800 line 1g are unsupported: the engine does not pick which credit stands.
- Dollars: yes, the whole credit, until a person corrects the facts.

## Elections

- Texts: "eligible taxpayers ... that don't elect payment can elect to transfer all or part" (`irs-7210-inst-2025::sec::applicable-amount::b04`); "report the entire amount ... on Form 3800, Part III, line 1g" (`::line-12::b02`).
- Default: as Form 3468, the transfer or elective payment is stated with its amount and registration number and passes to Form 3800, whose columns (h) and (j) are a gap for an elective payment. A purchased credit on a facility fact, both elections, or an elected amount above line 10 is a gap on line 1g.
- Not checked: a facility placed in service from 2023 must first elect payment in its placed-in-service year (`::applicable-amount::b03`); the engine does not read earlier returns.
- Dollars: none on Form 7210.

## Calendar-year filers only

- Text: the $0.60 amount is adjusted "for the calendar year in which the qualified clean hydrogen is produced" (`irs-7210-inst-2025::sec::applicable-amount::b01`). The IRS publishes separate 2026 amounts for fiscal-year filers.
- Default: column (b) is always the 2025 amount. The engine has no fiscal-year return.
- Dollars: none for a calendar-year individual.

## Confidence

| Field group | Confidence |
| --- | --- |
| Column (b) amounts, lines 6a–6d | published table (`applicable-amount::b01`) |
| Lines 7–10, 12 | stated rule |
| Lines 8a–8d | stated rule; the ratio prints 6 places (decision A99) |
| Line 11 | stated rule; first copy only (decision A110) |
| Line 5 | stated rule, from stated answers |
| Part I lines 1–4, 2b | stated rule |
| Line A(i), A(ii) | stated rule for one process; unsupported for more |
| Who files, no-credit facilities | own reading of the stated rules |

## Second opinions

- **Blind fill** (15 cases, from the blank form and instructions only): one difference, on line 7 of case 3 ($2,354 against $2,353, through lines 9, 10 and 12). It is the rounding of a total of computed rows ("Line 7 adds column (c) with cents" above). The instructions give no rounding rule for line 7; the engine keeps the repository's rule and the Form 1040 rule. Every other line of every case matches, including the band edges (0.45, 2.5, 4.0), the hydrogen above 4.0 left off, the 45Q facility and the ended credit period (no Form 7210), the bond lines and the K-1 credit on line 11 (row A110).
- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1): it does not model the clean hydrogen production credit. A search of `variables/gov/irs` and `parameters/gov/irs` for "hydrogen" and "45V" finds nothing. Its `general_business_credit` is a bare input, so it cannot check Form 7210 or line 1g of Form 3800.
- **IRS Direct File**: the repository names no checkout, and Direct File covers no business credits. Not compared.
