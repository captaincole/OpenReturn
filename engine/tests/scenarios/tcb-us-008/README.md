# tcb-us-008 — TaxCalcBench ty25-us-008

Source: [TaxCalcBench](https://github.com/column-tax/tax-calc-bench) by Column Tax, case `ty25-us-008`, commit `192c082f` (2026-11-03). MIT license: `docs/TAXCALCBENCH-LICENSE`. The data is fake.

A married person filing separately in Florida, born 1986, legally separated and living apart from the spouse. They have a W-2 and a small consulting business paid on a Form 1099-NEC, with a car driven on business, a home office and other expenses. They itemize gifts to charity and taxes, and carry a short-term capital loss from last year.

The answer key is the case's correct return: the IRS e-file XML in the case's `output.xml`. `expected.ts` copies its values.

Forms checked: Form 1040, Schedules 1, 2, A, C, D and SE, Forms 8959, 8960 and 8995 (federal only; the case has no state answer key).

## Inputs

| Input | Kind | File |
| --- | --- | --- |
| W-2, Employer name (box 12 code D $4,403, box 17 $6,794) | document, copied | `docs/01-employer-name-w2.pdf` |
| 1099-NEC, test ($3,882, linked to the consulting business) | document, copied | `docs/02-test-1099-nec.pdf` |
| Last year's Form 1040 | not supported (#79) | not copied |
