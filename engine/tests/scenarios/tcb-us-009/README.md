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
