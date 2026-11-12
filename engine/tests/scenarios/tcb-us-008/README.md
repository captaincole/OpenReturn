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
| Filing status, dates of birth, living apart from the spouse | answers | `decisions.ts`, `facts.ts` |
| Consulting business: code, cash method, material participation, office expense, two other expenses, a car at the standard mileage rate, a home office of 144 of 2,950 square feet | answers | `facts.ts` (`business.consulting`) |
| Short-term capital loss carryover ($8,507) | answer | `facts.ts` (`capital_gains.short_term_loss_carryover`) |
| Gifts by cash, gifts other than cash and their carryovers; personal property tax | answers | `facts.ts` |

## Where the facts go past the answers

- The answers give no gross receipts: line 1 is the 1099-NEC's box 1 ($3,882), and the 1099-NEC names the business.
- `sellsGoods` is false (a consultant sells a service; the key has no Part III).
- Two home office answers are not in the case: the same area was used all year, and all of the business's gross income came from its use of the home. The key's line 30 ($720 = 144 × $5) needs both.
- The spouse's name and SSN come from the key's header.
- The gift facts add the answers' limit categories: cash $300 + $30,000, other than cash $100 + $200 + $0, carryovers $3 + $3 + $1 + $2 + $1. The gifts are under 20% of AGI, so no Pub. 526 limit applies.

## Lines the key fills that the engine leaves blank, or that are not checked

- The names: the key prints "Sandy A Smith"; the documents print no middle initial. Schedule C line E (business address): the answers give none, and the home is the business address.
- Schedule D: the key's zero rows for lines 3 and 10 (no sales), and the QOF question (No in the answers). The engine does not model the QOF question.
- Lines that are 0 by the form's rule, which the e-file key leaves out: Schedule D line 15, Form 8959 lines 9–11, 20, 22 and 24, Form 8960 lines 1, 2, 4c, 9d, 11, 12, 16 and 17, Form 8995 lines 8, 9, 12, 16 and 17. They are not checked.
- Form 8995 line 1i(a): the engine prints the business's activity ("consultant"); the key prints the owner's name.

## Which QBI form

The key files Form 8995. The engine files Form 8995 when MAGI's upper bound is at or below the threshold ($197,300 for MFS), and Form 8995-A otherwise (`src/federal/8995/whichForm.ts`).
