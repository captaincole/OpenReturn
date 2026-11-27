# Form 7210 — open doubts

Form 7210 figures the clean hydrogen production credit (section 45V) of one facility. The instructions publish no example with numbers. Each item below names the text, the default the engine applies, and whether it changes dollars. The items are in three groups: two official texts that conflict, work that could be done now, and changes to a repository pattern.

## Two texts conflict

### Line 11 or line 2a for a K-1 credit (row A116)

- Text A: line 11 takes "the total clean hydrogen production credit amount from your distributive share" on the K-1, code Y, and line 12 adds lines 10 and 11 (`irs-7210-inst-2025::sec::line-11::b01`, `irs-7210-face-2025::sec::face-part-iv::b01`).
- Text B, the same block: a taxpayer who also figures a credit of its own enters the distributive share "as 'Credit From Pass-Through Entities' on Form 7210, Part I, line 2a".
- Decided: text A. Line 11 of the first Form 7210 takes the K-1 credits; line 2a stays the facility's address. `DECISION` comment in `resolveInfo.ts`; row A116 in `docs/rule-decisions.md`.
- Dollars: none. Form 3800 line 1g is the same either way.

## Should we do this now

### Line A with more than one process

- Text: "Enter the facility's lifecycle greenhouse gas emissions value or rate ... for each hydrogen production process" (`irs-7210-inst-2025::sec::specific-instructions::b01`). The box on the form holds 9 characters: one rate.
- Default: one process prints its rate and DOE control number. Two or more processes make line A(i) unsupported, and A(ii) too when a process has a control number.
- Not now: the instructions do not say where a second rate goes (a statement, or a second form), and lines 6a to 12 do not read line A. Dollars: none.

### Line 7 adds column (c) with cents

- Text: "Add column (c) of lines 6a through 6d" (`irs-7210-inst-2025::sec::line-7::b01`). The Form 1040 rule: "include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`).
- Done: each row prints rounded; line 7 adds the rows with their cents and rounds once, the repository's rule for a total of computed rows (`CLAUDE.md`, Form 4562 line 44).
- Other reading: line 7 adds the whole-dollar entries as printed. The blind fill chose it (case 3: $2,353 against the engine's $2,354). Dollars: at most $2 on line 7 with four rows, then times 5 on line 10. The `rand` scenario has none.

### Two processes in one emissions row

- Text: "Only one emissions rate should be used to calculate the credit for each hydrogen production process" (`irs-7210-inst-2025::sec::line-7::b01`). The form has one row for each band.
- Done: processes in one band add their kilograms in column (a); column (c) is the total times column (b), rounded once. Dollars: at most $1 for each extra process. The blind fill agreed (case 2).

### Construction that began on January 29, 2023

- Text: "A facility the construction of which begins prior to January 29, 2023" (`irs-7210-inst-2025::sec::increased-credit-amount-for-qualified-clean::b01`); "The apprenticeship requirements only apply to facilities for which construction began on or after January 29, 2023" (`::line-5::b02`).
- Done: January 29, 2023 is not "prior to", so that facility needs the apprenticeship answer too (`facility.ts`, `APPRENTICESHIP_START`). The texts agree; the blind fill agreed (case 7).

### A facility with no 2025 credit files no Form 7210

- Texts: no section 45V credit at a facility with a section 45Q credit (`irs-7210-inst-2025::sec::apprenticeship-requirements::b03`) or a section 48(a)(15) election (`irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02`); construction must begin before 2028 (`::apprenticeship-requirements::b02`); the 10-year credit period (`::general-instructions::b01`).
- Done: such a facility has no copy, and the must-file rule counts only facilities with a credit. The explicit decision still files the form. Dollars: none.

### The 10-year period ends during 2025

- Text: "for the 10-year period beginning on the date the facility ... is originally placed in service" (`irs-7210-inst-2025::sec::line-4::b01`).
- Done: the facility fact states only the kilograms made inside the period. Dollars: none, when the kilograms are stated as defined.

### Line 5 for construction before January 29, 2023, and Form 7220

- Text: the facility "satisfies the prevailing wage requirements with respect to any alterations or repairs occurring after January 29, 2023" (`irs-7210-inst-2025::sec::increased-credit-amount-for-qualified-clean::b01`, `::b02`). A facility that claims line 10's increase through the wage and apprenticeship rules "must complete and attach" Form 7220 (`::what-s-new::b01`).
- Done: the stated `prevailingWageMet` answer is true when there was no alteration or repair. The apprenticeship answer is not asked.
- Not now: Form 7220 is not in the engine; it is an attachment of records, and line 5 does not wait for it. Dollars: the times-5 increase, when an answer is wrong.

### Same facility on Form 3468

- Text: "No credit will be allowed under section 45V or section 45Q for any tax year with respect to any specified clean hydrogen production facility" (`irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02`).
- Done: the facility fact answers `energyPropertyElection`. When a Form 3468 Section M property of the return has the same registration number, address or coordinates and the answer is false, every amount line and Form 3800 line 1g are unsupported. Dollars: the whole credit, until a person corrects the facts.

### Elections and a purchased credit

- Texts: "eligible taxpayers ... that don't elect payment can elect to transfer all or part" (`irs-7210-inst-2025::sec::applicable-amount::b04`); "report the entire amount ... on Form 3800, Part III, line 1g" (`::line-12::b02`).
- Done: as Form 3468, the transfer or elective payment is stated with its amount and registration number and passes to Form 3800, whose columns (h) and (j) are a gap for an elective payment. Both elections, or an elected amount above line 10, is a gap on line 1g.
- Done: a purchased credit is the buyer's, reported on Form 3800 only. The seller "earned and reported the credit on the appropriate source credit form" (`irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b01`). A purchase on a facility fact is a gap. A stated general business credit on line 1g with `transfer.direction` "purchased" goes in column (f) as a positive amount. A stated line 1g credit with no purchase stays a gap, because the engine figures Form 7210.
- Not now: a facility placed in service from 2023 must first elect payment in its placed-in-service year (`::applicable-amount::b03`). The engine does not read earlier returns.

### Line 2 for a single-member LLC

- Text: "If the owner of the facility is different from the filer, include the owner's name and taxpayer identification number" (`irs-7210-inst-2025::sec::line-2::b01`).
- Done: line 2 prints the stated owner. The `rand` scenario names the LLC that holds the plant, which a disregarded entity's owner may or may not list. Dollars: none.

### Calendar-year filers only

- Text: the $0.60 amount is adjusted "for the calendar year in which the qualified clean hydrogen is produced" (`irs-7210-inst-2025::sec::applicable-amount::b01`).
- Done: column (b) is always the 2025 amount. The engine has no fiscal-year return. Dollars: none for a calendar-year individual.

## Pattern change

None. The Form 3800 change for a purchased credit is one rule in `3800/sources.ts`, applied the same way to every line that a source form of the engine fills.

## Confidence

| Field group | Confidence |
| --- | --- |
| Column (b) amounts, lines 6a–6d | published table (`applicable-amount::b01`) |
| Lines 7–10, 12 | stated rule |
| Lines 8a–8d | stated rule; the ratio prints 6 places (decision A99) |
| Line 11 | stated rule; first copy only (decision A116) |
| Line 5 | stated rule, from stated answers |
| Part I lines 1–4, 2b | stated rule |
| Line A(i), A(ii) | stated rule for one process; unsupported for more |
| Who files, no-credit facilities | own reading of the stated rules |

## Second opinions

- **Blind fill** (15 cases, from the blank form and instructions only): one difference, on line 7 of case 3 ($2,354 against $2,353, through lines 9, 10 and 12). It is the rounding of a total of computed rows ("Line 7 adds column (c) with cents" above). Every other line of every case matches, including the band edges (0.45, 2.5, 4.0), the hydrogen above 4.0 left off, the 45Q facility and the ended credit period (no Form 7210), the bond lines and the K-1 credit on line 11 (row A116).
- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1): it does not model the clean hydrogen production credit. Its `general_business_credit` is a bare input, so it cannot check Form 7210 or line 1g of Form 3800.
- **IRS Direct File**: Direct File covers no business credits. Not compared.
