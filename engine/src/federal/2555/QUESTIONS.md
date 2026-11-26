# Form 2555: open questions

Each item names the text, the block id, the default the engine applies, and whether it changes dollars.

## Doubts

1. **Exchange rate for Part IV and line 28.** Part IV says: "Report amounts in U.S. dollars, using the exchange rates in effect when you actually or constructively received the income" (`irs-2555-face-2025::sec::face-part-iv::b01`). The fact has no dates for its amounts. Default: every foreign amount takes the IRS yearly average of 2025, as decision row 10 in `docs/rule-decisions.md` does for an amount with no date. Changes dollars: yes, a little, when the rate moved during the year.
2. **Line 34, employer-provided amounts.** The instructions list wages, in-kind pay, rent paid by the employer and reimbursements (`irs-2555-inst-2025::sec::line-34::b01`). Default: line 34 is line 27 less lines 20a and 20b, so line 23 ("other foreign earned income") counts as employer-provided. Changes dollars: only for line 23 income that is self-employment income.
3. **Line 33 at zero or less.** "If the result is zero or less, don't complete the rest of this part or any of Part IX" (`face-part-vi::b01`). Default: line 33 prints 0, and lines 34 to 36 stay blank. No dollars.
4. **Line 44, decimal places.** Pub. 54 multiplies by a percentage with two decimals (`irs-pub-54-2025::sec::how-to-report-deductions::b04`–`b06`). Example 4 rounds (52.74% from 0.527397); example 2 cuts (98.48% from 0.98488). Default: the share is rounded to four places every time. Changes dollars: $7 in example 2 (66,673, not 66,666).
5. **Line 44, which share.** Pub. 54 multiplies by "your foreign earned income exclusion" over "your foreign earned income" (`::how-to-report-deductions::b01`); line 44 says "allocable to the excluded income". Default: line 43 (both exclusions) over line 27. Changes dollars: only with a housing exclusion and related deductions together.
6. **Line 44, the self-employment tax.** Line 44 names "the deductible part of self-employment tax" (`irs-2555-inst-2025::sec::line-44::b01`); Pub. 54's examples 2 to 5 leave it out. Default: the whole Schedule 1 line 15 is related when the person answers that every Schedule SE amount comes from this form's business (`allSelfEmploymentOnForm`). Other self-employment income makes line 44 a gap. Changes dollars: yes, the share of the deduction.
7. **Line 45 below zero.** Pub. 54 example 4: "Because this amount is negative, enter it as a positive (no parentheses) on line 8d of Schedule 1" (`::how-to-report-deductions::b05`). Default: Schedule 1 line 8d holds line 45 as is, so line 9 adds it back. The printed sign of a negative line 8d is not checked. No dollars.
8. **Line 18 rows.** The form asks for travel "during the 12-month period". Default: the rows list every stay of the period, the principal country too, and the 330-day check adds column (d) of the rows outside the United States. With no row the whole period counts. Changes dollars: the form files or not.
9. **The qualifying period for lines 31 and 38.** Default: the period of line 10 (bona fide residence) or line 16 (physical presence), from no earlier than the first tax home, cut to 2025. A fact can name another period (`qualifyingPeriod`) for a person who qualifies under more than one 12-month period. Changes dollars: yes, through the days.
10. **Bona fide residence that continues.** The test needs "an uninterrupted period that includes an entire tax year" (`irs-2555-inst-2025::sec::part-ii-taxpayers-qualifying-under::b01`). Default: a residence marked "Continues" is taken as the taxpayer states it; one that ended must cover a whole calendar year. No dollars beyond who files.
11. **Part IX with a carryover but no current excess.** Part IX is completed "only if (a) line 33 is more than line 36, and (b) line 27 is more than line 43" (`face-part-ix::b01`). Default: with either condition false, Part IX and the 2024 carryover stay blank. Changes dollars: the carryover, in that rare case.
12. **Text on two lines.** Lines 15a, 15e, 20b, 21d, 22f and 23 have a second line. Default: text after a line break in the answer goes on the second line. No dollars.
13. **"N/A" in Part I.** The form: "If an item doesn't apply, enter 'N/A'" (`face-part-i::b02`). Default: lines 3, 4a and 4b print "N/A" when the answer is missing; other blank items stay blank. No dollars.
14. **U.S. Government employees.** "Income from working abroad as an employee of the U.S. Government does not qualify" (`irs-2555-inst-2025::sec::who-qualifies::b01`). Default: no fact says so; Cade must not record such pay as foreign earned income. No dollars in the engine.

## Proposals for a discussion

- **Notice 2025-16's table.** Line 29b for a high-cost location needs the notice's limit for that location. The notice is not in the corpus or the engine. Proposal: commit the table as engine data (one row per location: full-year limit and daily limit), with its source and download day, as the exchange-rate tables are. Until then a listed location makes Parts VI to IX a gap.
- **Link the business on line 20a to its Schedule C fact.** Today the Form 2555 fact restates the business's gross income and expenses. Proposal: the fact names the Schedule C business by its slug, and the engine reads the amounts from it. That also lets QBI leave out only that business (today every business of the owner is a gap).
- **The 30% rule (line 20, capital a material factor).** It needs the business's own deduction for the employer-equivalent part of self-employment tax. Proposal: a Schedule SE helper that figures that deduction for one business.
- **Pub. 915, Pub. 590-A and Pub. 970 worksheets.** Taxable social security, the IRA deduction and the student loan interest deduction are gaps with Form 2555, because their MAGI adds the exclusions back in worksheets the engine does not have.
- **Form 6251's Foreign Earned Income Tax Worksheet** and **Form 1116 line 12** (taxes on excluded income) are gaps with Form 2555.

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
| Line 44 | Pub. 54 examples with numbers; self-employment tax share own reading |
| Line 45 | stated rule |
| Part IX, lines 46 to 50 | stated rule; carryover worksheet stated |
| Line 20, capital material | unsupported (30% rule) |
| Foreign Earned Income Tax Worksheet | stated rule, no example with numbers |
