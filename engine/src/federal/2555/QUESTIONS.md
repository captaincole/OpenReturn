# Form 2555: open questions

Each item names the text, the block id, the default the engine applies, and whether it changes dollars. The items sit under three headings: two texts that conflict (decided, with a `DECISION` comment and a row in `docs/rule-decisions.md`), work that could be done now, and changes to a pattern of the repository.

## Two texts conflict

1. **Exchange rate for Part IV and line 28.** Part IV says: "Report amounts in U.S. dollars, using the exchange rates in effect when you actually or constructively received the income" (`irs-2555-face-2025::sec::face-part-iv::b01`). The fact has no dates for its amounts. Decided by decision row 10 in `docs/rule-decisions.md` (a person's decision): an amount with no date takes the IRS yearly average of 2025. Changes dollars: yes, a little, when the rate moved during the year.
2. **Lines 35 and 39, decimal places.** The form: "rounded to at least three places"; Pub. 54 prorates by days. Decided: row A28, exactly three places (`lines.ts`).
3. **Line 44, decimal places.** Pub. 54 multiplies by a percentage with two decimals (`irs-pub-54-2025::sec::how-to-report-deductions::b04`–`b06`). Example 4 rounds (52.74% from 0.527397); example 2 cuts (98.48% from 0.98488). Decided: row A29, the share is rounded to four places every time (`lines.ts`). Changes dollars: $7 in example 2 (66,673, not 66,666). The blind fill took the exact fraction ($13,248 against the engine's $13,247 in its case 4).
4. **Line 44, which share.** Pub. 54 multiplies by "your foreign earned income exclusion" over "your foreign earned income" (`::how-to-report-deductions::b01`); line 44 says "allocable to the excluded income". Decided: row A30, line 43 (both exclusions) over line 27 (`lines.ts`). Changes dollars: only with a housing exclusion and related deductions together. The blind fill made the same choice.
5. **Line 44, the self-employment tax.** Line 44 names "the deductible part of self-employment tax" (`irs-2555-inst-2025::sec::line-44::b01`); Pub. 54's example 2, a self-employed person, puts only the business expenses on line 44 (`::how-to-report-deductions::b04`). Decided: row A31, the form's instructions (`results.ts`). The whole Schedule 1 line 15 is related when the person answers that every Schedule SE amount comes from this form's business (`allSelfEmploymentOnForm`); other self-employment income makes line 44 a gap. Changes dollars: $6,671 on line 44 for `romanda`.
6. **A tax home that moves abroad after the bona fide residence starts.** The tax home test: "your tax home must be in a foreign country ... throughout your period of bona fide residence" (`irs-2555-inst-2025::sec::who-qualifies::b01`). Line 31: "Your qualifying period is the period during which you meet the tax home test and either the bona fide residence or physical presence test" (`::line-31::b01`). Decided: row A32, line 31; the qualifying period starts with the tax home (`dates.ts`). Changes dollars: yes, a strict reading of "throughout" takes away the whole exclusion. The blind fill made the same choice.

## Should we do this now

7. **Line 34, employer-provided amounts.** The instructions list wages, in-kind pay, rent paid by the employer and reimbursements (`irs-2555-inst-2025::sec::line-34::b01`). Done: line 34 is line 27 less lines 20a and 20b, so line 23 ("other foreign earned income") counts as employer-provided. Changes dollars: only for line 23 income that is self-employment income.
8. **Line 33 at zero or less.** "If the result is zero or less, don't complete the rest of this part or any of Part IX" (`face-part-vi::b01`). Done: line 33 prints 0, and lines 34 to 36 stay blank. No dollars.
9. **Line 45 below zero.** Pub. 54 example 4: "Because this amount is negative, enter it as a positive (no parentheses) on line 8d of Schedule 1" (`::how-to-report-deductions::b05`). Not now: Schedule 1 line 8d holds line 45 as is, so line 9 adds it back and the dollars are right; only the printed sign of a negative line 8d, a rare case, is not checked.
10. **Line 18 rows.** The form asks for travel "during the 12-month period". Done: the rows list every stay of the period, the principal country too, and the 330-day check adds column (d) of the rows outside the United States. With no row the whole period counts. Changes dollars: the form files or not.
11. **The qualifying period for lines 31 and 38.** Done: the period of line 10 (bona fide residence) or line 16 (physical presence), from no earlier than the first tax home, cut to 2025. A fact can name another period (`qualifyingPeriod`) for a person who qualifies under more than one 12-month period. Changes dollars: yes, through the days.
12. **Bona fide residence that continues.** The test needs "an uninterrupted period that includes an entire tax year" (`irs-2555-inst-2025::sec::part-ii-taxpayers-qualifying-under::b01`). Done: a residence marked "Continues" is taken as the taxpayer states it; one that ended must cover a whole calendar year. No dollars beyond who files.
13. **Part IX with a carryover but no current excess.** Part IX is completed "only if (a) line 33 is more than line 36, and (b) line 27 is more than line 43" (`face-part-ix::b01`). Done: with either condition false, Part IX and the 2024 carryover stay blank. Changes dollars: the carryover, in that rare case.
14. **Text on two lines.** Lines 15a, 15e, 20b, 21d, 22f and 23 have a second line. Done: text after a line break in the answer goes on the second line. No dollars.
15. **"N/A" in Part I.** The form: "If an item doesn't apply, enter 'N/A'" (`face-part-i::b02`). Done: lines 3, 4a and 4b print "N/A" when the answer is missing; other blank items stay blank. No dollars.
16. **U.S. Government employees.** "Income from working abroad as an employee of the U.S. Government does not qualify" (`irs-2555-inst-2025::sec::who-qualifies::b01`). Not now: no fact says so, and Cade must not record such pay as foreign earned income; that is a prompt rule, not an engine rule.
17. **Line 49 with no 2024 carryover.** The form's note: "If line 47 is more than line 48 and you couldn't deduct all of your 2024 housing deduction ... use the Housing Deduction Carryover Worksheet ... Otherwise, go to line 50" (`irs-2555-face-2025::sec::face-part-ix::b01`). Done: line 49 is blank with no 2024 amounts or with line 47 not above line 48; it is 0 only when the worksheet stops at its line 3 ("enter -0- on line 49"). No dollars. The blind fill found this; the engine printed 0 before.
18. **Rows past the form's limit.** Line 14 has 8 rows and line 18 has 4. Done: more stays make those rows a named gap (no attached statement); the days and amounts still count every stay.
19. **The main-home box on Form 1040.** "Your main home can be any location where you regularly live" (`irs-1040-inst-2025::sec::yes-continue-no-stop-11::b01`). Done: a Form 2555 whose qualifying period holds more than 182 days of 2025 leaves the box blank (`federal/1040/header.ts`). With fewer days the box keeps its old rule, which can be wrong for a person who lived abroad before the qualifying period began.
20. **Form 8582 line 6 and Form 2441 earned income.** Done (2026-11-25 review): Form 8582's modified AGI keeps the exclusions subtracted, because line 6 does not list them (`irs-8582-inst-2025::sec::line-6::b01`); Form 2441 lines 4, 5, 18 and 19 subtract each person's line 43 (`irs-2441-inst-2025::sec::lines-4-and-5::b01`). FTB 3506 does not subtract it: California taxes the excluded income.

## Pattern change

### Proposals for a discussion

- **Notice 2025-16's table.** Before: a location the notice lists makes Parts VI to IX a gap, because the notice is not in the corpus or the engine. After: the table is engine data (one row per location: full-year limit and daily limit), with its source and download day, as the exchange-rate tables are, and line 29b reads it.
- **Link the business on line 20a to its Schedule C fact.** Before: the Form 2555 fact restates the business's gross income and expenses, and QBI makes every business of the owner a gap. After: the fact names the Schedule C business by its slug, the engine reads the amounts from it, and QBI leaves out only that business.
- **The 30% rule (line 20, capital a material factor).** Before: such a business makes the form a gap, because the engine figures the self-employment tax deduction only for all businesses together. After: a Schedule SE helper figures that deduction for one business, and line 20 takes the 30% allowance.
- **Pub. 915, Pub. 590-A and Pub. 970 worksheets.** Before: taxable social security, the IRA deduction and the student loan interest deduction are gaps with Form 2555. After: the worksheets that add the exclusions back in their MAGI are engine worksheets.
- **Form 6251's Foreign Earned Income Tax Worksheet and Form 1116 line 12.** Before: both are gaps with Form 2555. After: the minimum tax uses its own Foreign Earned Income Tax Worksheet, and Form 1116 leaves out the taxes on excluded income.

## Second opinions

- **Blind fill (2026-11-25).** 14 cases filled by hand from the blank form and the instructions. One dollar difference: line 44 in case 4, $1, from the share's decimal places (row A29); the engine keeps four places, as Pub. 54's examples do. One blank-or-zero difference: line 49 with no carryover, now blank (item 17).
- **PolicyEngine-US 2.154.0 (commit 363e9fc5).** It takes Form 2555's lines as inputs (line 42, line 36, line 44, line 50) and has no formula or constant for the lines themselves: no $130,000, no housing limits, no days. What it figures from them agrees with the engine: line 43 is line 36 plus line 42; the Foreign Earned Income Tax Worksheet line 2c is lines 45 and 50 less line 2b, at least 0; the MAGI of Schedule 8812, Schedule 1-A and Form 8936 adds back lines 45 and 50; Form 8960's MAGI adds back line 42 less its part of line 44, not the housing amounts; the refundable child tax credit and the earned income credit are not allowed with the exclusion. It also adds the exclusions back in the MAGI of the education credits (Form 8863) and the saver's credit (Form 8880); there the engine leaves a gap with Form 2555, so this is a scope difference, not a disagreement. No disagreement on a constant or a formula.
- **IRS Direct File.** Not compared: no checkout in reach, and its scope did not include Form 2555.
- **Notice 2025-16 (fetched 2026-11-25 from irs.gov).** London is listed ($67,000), so `bair` moved to Manchester, which is not. Faro is not listed (Portugal lists Alverca and Lisbon), so `romanda` keeps the general limit.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Part I, II, III answers | stated rule (the form prints the answer) |
| Line 31 and 38 days | published example with numbers (line 31 example) |
| Part IV lines 19 to 26 | stated rule |
| Line 29b, standard limit | published example with numbers |
| Line 29b, listed location | unsupported (Notice 2025-16 not in the engine) |
| Lines 28, 30, 32, 33 | stated rule (line 32's 365-day amount from the form) |
| Lines 34 to 36 | stated rule; Pub. 54 housing example with numbers |
| Lines 37 to 42 | stated rule; three places on line 39 (decision) |
| Line 44 | Pub. 54 examples with numbers; self-employment tax share by decision A31 |
| Line 45 | stated rule |
| Part IX, lines 46 to 50 | stated rule; carryover worksheet stated |
| Line 20, capital material | unsupported (30% rule) |
| Foreign Earned Income Tax Worksheet | stated rule, no example with numbers |
