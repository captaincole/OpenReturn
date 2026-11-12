# tcb-us-009 — TaxCalcBench ty25-us-009

Source: [TaxCalcBench](https://github.com/column-tax/tax-calc-bench) by Column Tax, case `ty25-us-009`, commit `192c082f` (2026-11-03). MIT license: `docs/TAXCALCBENCH-LICENSE`. The data is fake.

A married person filing separately in Florida, born 1951, who lived with the spouse all year. They have a W-2, interest, dividends, two self-rental properties (one with a $43,636 loss, one with $10,000 of income) and a passive royalty.

The answer key is the case's correct return: the IRS e-file XML in the case's `output.xml`. `expected.ts` copies its values.

Forms checked: Form 1040, Schedules 1, 2 and E, Forms 8582, 8959, 8960 and 8995 (federal only; the case has no state answer key).

## Inputs

| Input | Kind | File |
| --- | --- | --- |
| W-2, mcd ($150,000) | document, copied | `docs/01-mcd-w2.pdf` |
| 1099-INT, Int ($600) | document, copied | `docs/02-int-1099-int.pdf` |
| 1099-DIV, div ($1,500, all qualified) | document, copied | `docs/03-div-1099-div.pdf` |
| Last year's Form 1040 | not ingested (#79); read for the carryovers | `docs/04-form-1040-2024.pdf` |
| Filing status, dates of birth, living with the spouse | answers | `decisions.ts`, `facts.ts` |
| Two self-rentals: address, days, rents, expenses, active participation, QBI | answers | `facts.ts` |
| Royalty: royalties, passive | answers | `facts.ts` |
| Not a real estate professional; payments that require Form 1099, not filed | answers | `facts.ts` |

Last year's return is in `docs/` as the source of the carryover answers only; the engine does not read it. It prints no amounts and has no Schedule E or Form 8582, so every property's `priorYearUnallowedLoss` is 0.

## Where the facts go past the answers

- The spouse's name and SSN come from the key's header.
- The spouse does not itemize (`filing_status.spouse_itemizes` false): not in the answers; the key takes the standard deduction.
- The royalty files no Form 6198 (`allInvestmentAtRisk`), and the key's Form 8582 shows no prior-year loss for any property.
- The self-rentals' code 7 says the taxpayer materially participates in the business that rents them (irs-1040se-inst-2025::sec::line-1b::b01). No fact names that business.

## Lines the key fills that are not checked

- Schedule E lines 1a (the addresses): the text is not checked. Lines A and B (payments that require Form 1099): the answers say yes and not filed; the key prints neither.
- Form 8582 Parts VII and VIII: the ratio ("1.00000") and the form-or-schedule column ("SCH E") are text.
- Form 8995 line 1(a) and 1(b): the key prints "SELF-RENTAL 1 Address" and the SSN; the names are text and not checked.
- Lines that are 0 by the form's rule, which the e-file key prints or leaves out: Form 8959 lines 8, 14 and 20–24 except 21, Form 8960 line 4c. They are not checked.

## The self-rentals

A self-rental's net income is nonpassive (irs-pub-925-2025::sec::rental-of-property-to::b01). Property C's $10,000 is not on Form 8582 (irs-pub-925-2025::sec::disclosure-requirement::b05), and Form 8960 line 4b takes it out of net investment income (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b02). Property A's loss is passive: Form 8582 allows $2,000 of it against the royalty's income, and the rest carries to 2026.

## Known mismatch: Part IV or Part V

The return is married filing separately, and the spouses lived together. The instructions put property A in Part V: "Married individuals who file separate returns and lived with their spouses at any time during the tax year don't qualify under the active participation rule and must use Part V instead of Part IV" (irs-8582-inst-2025::sec::part-iv-2::b01). The key puts it in Part IV (line 1) and skips Part II. The engine follows the instructions, and `index.ts` lists the key's lines in `knownMismatches`. Lines 3, 10 and 11, Parts VII–VIII and every other form agree either way.

PolicyEngine-US 2.117.4 has no Form 8582 model, so it gives no second opinion on the part. Its Form 8960 notes agree that property rented to the owner's nonpassive business leaves net investment income on line 4b.
