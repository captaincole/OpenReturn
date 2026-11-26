# agelmar — a made-up taxpayer hit by two storms (synthetic)

Agelmar Tolliver is single and lives in Pensacola, Florida. Every name, amount and disaster here is made up: DR-9917-FL and DR-9922-FL are not real FEMA numbers. There is no outside source and no answer key. The expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Two 2024 storms damaged his home. The first was on his 2024 Form 8915-F, with $8,000 of qualified disaster distributions in 2024. In 2025 he took $15,000 from his 401(k) and $25,000 from a traditional IRA, both early (code 1), and treats both as qualified disaster distributions: $40,000, more than the $36,000 left. He also took a $12,000 401(k) hardship distribution for a house the second storm kept from being built, and repaid $5,000 of it in time. He spreads the income over 3 years. His 2024 form left income for 2025 and an excess IRA repayment. Florida has no income tax: the return is federal only.

The scenario shows Form 8915-F Parts I to IV, lines 1a to 1e with an earlier and a new disaster, the limit, the cost share, Worksheets 2 to 5, Form 5329 line 1 without the qualified amounts, and Form 1040 lines 4b and 5b. The published examples are unit tests (`tests/unit/federal/8915-f/`).

Forms that file: Form 1040, Schedule 2, Form 5329, Form 8915-F.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Perdido Marine Electric | box 1 $68,000, box 2 $7,200 |
| 1099-R, Gulf Coast Marine 401(k) | box 1 $15,000, box 2a $13,800, box 4 $3,000, box 5 $1,200, code 1, 02/14/2025 |
| 1099-R, Emerald Coast Trust (IRA) | box 1 $25,000, box 2a $25,000, box 4 $2,500, code 1, 03/03/2025 |
| 1099-R, Bayline Shipyard 401(k) hardship | box 1 $12,000, box 2a $11,400, box 4 $2,400, box 5 $600, code 1, 01/20/2025 |
| DR-9917-FL | begins 10/07/2024, declared 10/11/2024, ends 11/08/2024; on the 2024 form, $8,000 used |
| DR-9922-FL | begins 12/27/2024, declared 01/10/2025, ends 01/31/2025; new |
| 2024 Form 8915-F | line 11 $2,000, line 13 $2,000, line 22 $667, line 24 $667, line 25 $1,000 |
| Repayments | $5,000 of the hardship distribution (Part IV); $1,500 of the 401(k) for this year's form |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Periods | DR-9917-FL to 04/08/2025, DR-9922-FL to 07/08/2025 (179 days after the declaration) | both distributions in both |
| 1a, 1b, 1c | one disaster on the 2024 form: 22,000; 8,000 used; 22,000 − 8,000 | 22,000; 8,000; 14,000 |
| 1d, 1e | one new disaster: 22,000; 14,000 + 22,000 | 22,000; 36,000 |
| 2 (a), 3 (a), 4 (a) | box 1 of every 1099-R: 15,000 + 12,000; 25,000; none | 27,000; 25,000; 0 |
| 2 (b), 3 (b) | date order up to 36,000: the 401(k) first, then 21,000 of the IRA (A24) | 15,000; 21,000 |
| 5a, 5b (a), 5b (b), 6 | 52,000 − 40,000; 40,000; smaller of 40,000 and 36,000 | 12,000; 40,000; 36,000; 36,000 |
| 7 | 52,000 − 36,000 − 12,000 on line 28 | 4,000 |
| 8, 9, 10, 11 | line 2 (b); cost 15,000 − 13,800; 13,800; 13,800 ÷ 3 | 15,000; 1,200; 13,800; 4,600 |
| 12, 13 | Worksheet 2: 2024 line 11; 4,600 + 2,000 | 2,000; 6,600 |
| 14, 15 | Worksheet 3: 0 carried, 1,500 repaid; 6,600 − 1,500 | 1,500; 5,100 |
| 16, 17 | IRA amount in column (b), Yes; no Form 8606, No | Yes; No |
| 20, 21, 22 | line 3 (b); 21,000; 21,000 ÷ 3 | 21,000; 21,000; 7,000 |
| 23, 24 | Worksheet 4: 2024 line 22; 7,000 + 667 | 667; 7,667 |
| 25, 26 | Worksheet 5: 1,000 − 667 carried; 7,667 − 333 | 333; 7,334 |
| Part IV table | only DR-9922-FL's window (06/30/2024 to 03/02/2025) holds 01/20/2025 | DR-9922-FL |
| 27, 28, 29, 30 | not on Form 8606, No; 12,000; cost 600; 12,000 − 600 | No; 12,000; 600; 11,400 |
| 31, 32 | repaid 5,000; 11,400 − 5,000, from a plan | 5,000; 6,400 |
| 5329 line 1, 4 | 0 + (25,000 − 21,000) + (11,400 − 5,000); 10% | 10,400; 1,040 |
| Schedule 2 line 8, 21 | Form 5329 line 4 | 1,040 |
| 1040 line 4a, 4b | 25,000; 25,000 − 21,000 + line 26 7,334 | 25,000; 11,334 |
| 1040 line 5a, 5b | 27,000; 25,200 − 13,800 − 11,400 + line 15 5,100 + line 32 6,400 | 27,000; 11,500 |
| 1040 line 9, 11a | 68,000 + 11,334 + 11,500 | 90,834 |
| 1040 line 12e, 15 | single standard deduction; 90,834 − 15,750 | 15,750; 75,084 |
| 1040 line 16 | tax table, 75,050–75,100, single | 11,431 |
| 1040 line 23, 24 | Schedule 2 line 21; 11,431 + 1,040 | 1,040; 12,471 |
| 1040 line 25a, 25b, 25d | 7,200; 3,000 + 2,500 + 2,400; 15,100 | 7,200; 7,900; 15,100 |
| 1040 line 34, 35a | 15,100 − 12,471 | 2,629 |
