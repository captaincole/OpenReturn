# FTB 3507 — open questions

The 2025 instructions have no example with numbers. The rules were written from
the form and its instructions (`ca-3507-form-2025`) and Schedule P (540)
(`ca-540-sched-p-inst-2025`). The made-up taxpayers `javindhra` (lines 1 to 6a,
Form 540 lines 43 and 44) and `katerine` (line 7, Form 540 line 45) are the
scenarios.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

### 1. Line 7 carries only the part the $5,000,000 limit disallowed (A77)

- Text A, the texts written for this credit: "Generally, there is no provision for carryover of any unused Prison Inmate Labor Credit to succeeding taxable years, and in no event can taxpayers carry this back and apply it against a prior year's tax. However, for taxable years 2024 through 2026, taxpayers are allowed to carryover the amount of credit disallowed due to the $5,000,000 business credit limitation" (`ca-3507-form-2025::sec::credit-limitation::b02`). The Schedule P (540) face lists the credit under "A1 Credits that reduce excess tax and have no carryover provisions", and its column (d) is shaded (`ca-540-sched-p-face-2025::sec::face-part-iii::b01`). Schedule P (540): "only the disallowed portion of the credit may be carried over" (`ca-540-sched-p-inst-2025::sec::section-a1-instructions::b01`).
- Text B: line 7, "Credit limited by your tax liability cannot be included in an election for refundable credit. ... They can, however, be carried over for future years. Include any such amounts here" (`ca-3507-form-2025::sec::line-7::b01`), and the form's arithmetic, line 5 less lines 6a to 6c.
- The law: the lead read R&TC section 17053.6 from a public copy (california.public.law, 2026-11-26); the California code is not in the library. Subdivision (a) allows a credit of "10 percent of the amount of wages paid or incurred during the taxable year" for each prisoner employed in a joint venture program, against the net tax. Subdivision (b) is a yearly list of employers sent to the Franchise Tax Board. The section has no carryover provision.
- Done (2026-11-26, reversed from Text B): Text A. The statute gives this credit no carryover, the form's own limitation text and Schedule P agree, and the line 7 instruction's general sentence would carry forward a credit the law lets expire. Line 7 is the part the limit disallowed (`disallowedByLimit` in `lines.ts`) less line 6c. The `DECISION` comment is above line 7 in `bindings.ts`; the row is in `docs/rule-decisions.md`.
- The limit case: the engine has a rule for it. Code 162 is the first credit of Schedule P (540) Part III (item 3), so the part the limit disallowed is line 5, capped at Schedule P line 3, less $5,000,000. No case needs a gap for the limit. Example: a credit of $6,000,000 against $5,500,000 of excess tax uses $5,000,000, carries $500,000 (no FTB 3870 election), and loses the other $500,000.
- Line 7 prints 0, not blank, when nothing carries, as lines 6b and 6c do (item 5): it is next year's line 4, and a 0 says that nothing carries.
- Dollars: no change to this year's tax. In `katerine` line 7 is $0, not $2,733: the $2,733 the tax could not use is lost. With Schedule P line 3 at 0 (the blind fill's case 6) line 7 is $0, not $5,000, which agrees with "No You may not take the credit this year or in future years" (`ca-540-sched-p-inst-2025::sec::section-a-instructions::b01`).
- For a person: a California preparer could still confirm two things. First, that FTB reads the line 7 sentence as the shared wording of the 2024 credit forms and does not allow a tax-limited carryover of this credit. Second, that a carryover from the $5,000,000 limit is "extended by the number of taxable years the credit was not allowed" (`::credit-limitation::b02`); the engine prints the amount and does not track its years.

## Should we do this now

### 2. The $5,000,000 limit applies to Schedule P (540) line 4 column (b)

- Source: "The total of all business credits ... may not reduce the 'net tax' ... by more than $5,000,000" (`ca-3507-form-2025::sec::credit-limitation::b01`). The Schedule P (540) face puts the asterisk ("column (b) cannot exceed $5,000,000") on line 5 (b), not on line 4 (b) (`ca-540-sched-p-face-2025::sec::face-part-iii::b01`).
- Done: the limit applies to line 4 too. The credit is not on the list of credits the limit leaves out (`ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01`), and Section A holds line 4.
- Dollars: only for a credit used above $5,000,000.

### 3. Code 162 uses the limit first

- Source: "Business credits should be applied against 'net tax' before other credits" (`::credit-limitation::b01`). Line 4 is the first row of Schedule P (540) Part III.
- Done: no other business credit has used the limit before code 162. A later business credit (FTB 3801-CR's research credit, Section B2) does not count this credit against the limit: that is the open item 8 of `3801-cr/QUESTIONS.md`.
- Dollars: only when the business credits together are above $5,000,000.

### 4. The FTB 3870 election is one answer for the return

- Source: "you must make the same election for all other credits you claimed this year that were also disallowed due to the $5,000,000 credit limitation" (`::line-6c::b01`).
- Done: one fact, `ca_business_credit_limitation.elect_refundable`. Cade is asked for it only when line 5 is above $5,000,000. With no answer the line waits; under the limit line 6c is 0.
- Dollars: none below the limit.

### 5. Lines that print 0

- Line 6b prints 0: "If you are not a corporation, enter -0-" (the form). The engine figures individual returns only.
- Line 6c prints 0 with no election or nothing disallowed. Line 7 prints 0 when the limit disallowed nothing, or line 6c took it all (item 1). Lines 1 to 4 print 0 when the stated amount is 0.
- Done. Dollars: none.

### 6. Line 3 rounds once

- Source: "add the amounts and enter the total" (`::line-3::b01`).
- Done: the stated K-1 credits keep their cents while adding, and only the total is rounded, as for any document sum (CLAUDE.md).
- Dollars: at most $1.

### 7. Line 4 is the stated carryover

- Source: "Enter the amount of credit carryover from 2024 on line 4" (`::line-4::b01`).
- Done: the engine takes last year's line 7 as the taxpayer states it. It does not check that the amount came from the $5,000,000 limit, the only carryover the decision in item 1 allows. `javindhra` states $300 to test the arithmetic.
- Dollars: none this year beyond the stated amount.

### 8. The header

- Done: the name is the names on the return, the box is "SSN or ITIN", and the number is the taxpayer's SSN. The Secretary of State file number belongs to an LLC or a corporation, so it is blank.

### 9. Order on Form 540 lines 43 and 44

- Source: "If you claim one or two other credits, enter the name, code, and amount of the credit from column (b) on Form 540, line 43 and/or line 44" (`ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01`).
- Done: code 162 comes first, in Schedule P (540) Part III order. The name is the Credit Table's, "Prison Inmate Labor". With more than two credits, all of them go on line 45 (`katerine`).
- Dollars: none.

### 10. Line 2 is figured from the rounded line 1

- Source: line 1 takes whole dollars, and line 2 says "Multiply line 1 by 10% (.10)" (the form).
- Done: line 2 is 10% of the rounded line 1, then rounded. The blind fill did the same.
- Dollars: at most $1 (wages of $12,344.50 give $1,235; 10% of the unrounded wages gives $1,234).

### 11. Schedule P (540) line 4 is blank when line 3 is 0

- Source: "If the amount is zero or less than zero, go to question 1 ... Yes You may not take the credit this year. Go to question 2 ... No You may not take the credit this year or in future years" (`ca-540-sched-p-inst-2025::sec::section-a-instructions::b01`), and columns (a) to (d) are completed "for each line on which you are taking a credit" (`ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01`).
- Done: the row is blank and FTB 3507 line 6a is 0 (`schedule-p/prisonLaborRow.ts`, `creditUsed.ts`). The blind fill found it (case 6); the first rules printed column (a).
- Dollars: Schedule P line 4 column (a) blank, not $5,000. No tax changes.
- Not now for Schedule P (540) line 5 (FTB 3506, also Section A1 only): it still prints column (a), with column (b) at 0, when line 3 is 0 (`schedule-p/partIII.ts`). The same text says that row is blank too, but the change is to another form's values, so it waits for its own pull request.

### 12. Line 6a on Form 540NR, or with no Form 540

- Not now: Form 540NR and Schedule P (540NR) have no credit rules yet, and a Form 541, 100S, 565 or 568 return is not in the engine. Each is a named gap (table below).

### 13. Line 3 has one line for every K-1

- Done: line 3 adds any number of stated K-1 credits ("add the amounts and enter the total", `::line-3::b01`), so the form has no row limit to exceed. The form files once per return.

## Pattern change

### 14. The disregarded single member LLC limit

- Before: a credit from wages paid through a disregarded SMLLC, or a K-1 credit through one, makes lines 6a, 6c and 7 a named gap, because the engine figures the regular tax once.
- After: the engine would figure the regular tax a second time without the LLC's income, and limit the credit to the difference (`::c-limitations::b01`). That is a second pass over the return, which FTB 3804-CR also needs; see "Proposals for a discussion".

## Second opinions

- PolicyEngine-US 2.154.1 (commit `0fbed6ddb1`, read 2026-11-26): the California variables and parameters (`policyengine_us/variables/gov/states/ca`, `parameters/gov/states/ca`) have no prison inmate labor credit, no FTB 3507, and no $5,000,000 business credit limit. Nothing to compare.
- IRS Direct File has no California return, so it has no comparison for this form. The repo names no other reference implementation of a California credit.

## Blind fill (2026-11-26)

- 13 cases. 38 values differ only as blank against 0 (lines 1 to 4 with nothing stated, line 6c with no election). One value differed in dollars: Schedule P line 4 column (a) in case 6, fixed (item 11).
- The blind doubts that change dollars are items 1 (line 7), 6 (line 3 rounding), 10 (line 2 rounding) and 11 (Schedule P line 4).

## Unsupported

| Case                                                                                | Why                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Line 6a, 6c and 7 for wages or a K-1 credit through a disregarded single member LLC | "the usable credit amount ... is limited to the difference between the taxpayer's regular tax figured with the income of the disregarded entity, and the taxpayer's regular tax figured without" (`::c-limitations::b01`). The engine does not figure the tax twice.                                                                                                                                                                    |
| Line 6a on Form 540NR                                                               | Form 540NR and Schedule P (540NR) have no credit rules yet.                                                                                                                                                                                                                                                                                                                                                                             |
| Line 6a with no Form 540 (a Form 541, 100S, 565 or 568 return)                      | Those returns are not in the engine.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Line 6a when a decision says Schedule P (540) does not file                         | Only Schedule P (540) figures the tentative minimum tax that limits the credit (`::c-limitations::b02`). A Section A1 credit attaches the schedule (`ca-540-sched-p-inst-2025::sec::b-who-must-file::b01`), so the engine files it on its own; only an explicit "no" leads here. FTB 3801-CR and FTB 3804-CR, which read `540/creditBalance.ts` without Schedule P, then do not see this credit; Form 540 lines 43 to 48 carry the gap. |

## Proposals for a discussion

- The disregarded SMLLC limit needs the regular tax figured twice: with and without the LLC's income. That is a new way of evaluating a return (a second pass), so it waits for a discussion. FTB 3804-CR has the same gap.

## Confidence

| Field group                      | Confidence                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| Header                           | stated rule                                                                               |
| Lines 1 to 5                     | stated rule                                                                               |
| Line 6a, Schedule P (540) line 4 | stated rule (the TMT floor and the column rules); the $5,000,000 limit is own reading (2) |
| Line 6b                          | stated rule                                                                               |
| Line 6c                          | stated rule, own reading of the one answer (4)                                            |
| Line 7                           | decided by the author (1), with the statute as the lead read it                           |
| SMLLC, Form 540NR, other returns | unsupported                                                                               |
