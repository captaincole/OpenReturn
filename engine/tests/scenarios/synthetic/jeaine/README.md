# jeaine — a California side business with its own health policy (synthetic)

Jeaine Valtessa is single and lives in Sacramento, California, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She works part time at a bookbindery (a W-2); its health plan is not open to part-time staff. She also runs a book restoration business (Schedule C) and buys a self-only bronze policy in her own name, outside the Marketplace. She takes the standard deduction. There are no input documents: the facts are the W-2 boxes, her books, her premium statements and her answers.

She has one source of self-employment income, no long-term care premiums and no Form 2555, so no Form 7206 files: the Form 1040 worksheet figures Schedule 1 line 17 with the same arithmetic (irs-1040-inst-2025::sec::line-17::b04). California conforms, so Schedule CA (540) line 17 column A copies it and column B is blank. The sister scenario `ispan` files Form 7206.

Forms that file: Form 1040, Schedules 1, 2, C and SE, Form 8995, Form 540 and Schedule CA (540).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Delta Heritage Bindery LLC | box 1, 3, 5 and 16 $52,000; box 2 $13,000; box 17 $3,300 |
| Valtessa Restoration (Schedule C) | receipts $46,000; advertising $1,200, office $2,000, supplies $6,300 |
| Health premiums, 2025 | $7,980.36 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Schedule C line 31 | 46,000 − 9,500 | 36,500 |
| Schedule SE line 4a | 36,500 × 92.35% | 33,708 |
| Schedule SE line 9 | 176,100 − 52,000 | 124,100 |
| Schedule SE line 12 | 33,708 × 12.4% = 4,180; × 2.9% = 978 | 5,158 |
| Schedule SE line 13, Schedule 1 line 15 | half of 5,158 | 2,579 |
| Worksheet line 1 | premiums, rounded | 7,980 |
| Worksheet line 2 | 36,500 − 2,579 − 0 | 33,921 |
| Worksheet line 3, Schedule 1 line 17 | smaller of 7,980 and 33,921 | 7,980 |
| Schedule 1 line 26, 1040 line 10 | 2,579 + 7,980 | 10,559 |
| 1040 line 11a | 88,500 − 10,559 | 77,941 |
| 8995 line 1(c) | 36,500 − 2,579 − 7,980 | 25,941 |
| 8995 line 15, 1040 line 13a | 20% of 25,941 | 5,188 |
| 1040 line 15 | 77,941 − 15,750 − 5,188 | 57,003 |
| 1040 line 16 | tax table, 57,000–57,050, single | 7,460 |
| 1040 line 34 | 13,000 − (7,460 + 5,158) | 382 |
| Schedule CA line 17 column A | Schedule 1 line 17 | 7,980 |
| Schedule CA line 26 column A | 2,579 + 7,980 | 10,559 |
| 540 line 13 | federal AGI | 77,941 |
