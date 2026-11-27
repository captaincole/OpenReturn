# eward — a made-up trial sponsor in California with an orphan drug credit (synthetic)

Eward Calloran is single and lives in San Diego, a full-year California resident. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Eward runs a business (Schedule C) that pays for the clinical testing of one orphan drug. He does not elect the reduced credit, so the credit on line 2a lowers his deduction for the testing expenses. California has no orphan drug credit of its own and gives the reduction back on Schedule CA. He takes the standard deduction and paid four federal estimated tax payments.

The scenario shows the branch that `jon` does not:

- Form 8820 line 2a checks "No" and takes 25% of line 1.
- Line 2a comes off Schedule C line 26 (wages), line 22 (supplies), line 20a (computer rental) and line 11 (contract testing), each by at most the clinical expenses of its kind (docs/rule-decisions.md A111).
- Form 3800 line 1h takes line 2c, and Schedule 3 line 6a the allowed credit.
- Schedule CA (540) line 3 column B adds the $50,000 back (FTB Pub. 1001), so Form 540 line 14 is $50,000.

Forms that file: Form 1040, Schedules 1, 2, 3, C and SE, Forms 3800, 6251, 8820, 8959 and 8995-A, Schedule CA (540) and Form 540.

## Inputs

| Input | Amounts |
| --- | --- |
| Business (Schedule C), Calloran Rare Disease Trials | receipts $900,000; wages $140,000; contract labor $260,000; supplies $30,000; machinery rent $12,000; other expenses $92,000 |
| Clinical testing expenses | wages $20,000; supplies $10,000; computer rental $6,000; contract testing $164,000.40 |
| Drug | pelvarostide (DRU-2022-8876, 06/08/2022) |
| Estimated tax payments (federal) | 4 × $20,000 |

## Documents

None. The clinical testing amounts and the designation are stated answers from the business's books and the FDA letter: no official form holds them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8820 line 1 | 20,000 + 10,000 + 6,000 + 164,000.40 | 200,000 |
| 8820 line 2a | 200,000 × 25%; "No" checked | 50,000 |
| 8820 line 2c, 4 | no line 2b, no line 3 | 50,000 |
| Schedule C line 26 | 140,000 − 20,000 | 120,000 |
| Schedule C line 22 | 30,000 − 10,000 | 20,000 |
| Schedule C line 20a | 12,000 − 6,000 | 6,000 |
| Schedule C line 11 | 260,000 − 14,000 (the rest of 50,000) | 246,000 |
| Schedule C line 28, 31 | 534,000 − 50,000; 900,000 − 484,000 | 484,000; 416,000 |
| Schedule SE line 12, 13 | 21,836 + 384,176 × 2.9% (11,141); half | 32,977; 16,489 |
| 1040 line 11a | 416,000 − 16,489 | 399,511 |
| 1040 line 13a | 50% of W-2 wages 140,000 (smaller than 20% of QBI) | 70,000 |
| 1040 line 15 | 399,511 − 15,750 − 70,000 | 313,761 |
| 1040 line 16 | 57,231 + 35% × (313,761 − 250,525) | 79,364 |
| Form 3800 line 1h (e) | Form 8820 line 4 | 50,000 |
| Form 3800 line 17, 38 | 79,364 − tentative minimum tax 62,813 | 16,551 |
| Schedule 3 line 6a; 1040 line 20, 22 | 16,551; 79,364 − 16,551 | 16,551; 62,813 |
| Schedule CA line 3 column B | the reduction given back | 50,000 |
| 540 line 13, 14, 17 | 399,511; 50,000; 349,511 | — |
| 540 line 19 | 349,511 − standard deduction 5,706 | 343,805 |
