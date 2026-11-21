# wren — a made-up couple who save for retirement (synthetic)

Wren and Dorian Ashby are married and file jointly. They live in Lubbock, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Each spouse has one W-2 with a 401(k) deferral: Wren code D, Dorian code AA (Roth 401(k)). Each put money in a Roth IRA for 2025. Dorian moved an old 401(k) to an IRA by direct rollover (Form 1099-R code G), and took $300 out of a Roth IRA in 2024, a year they filed jointly. Neither is a student or a dependent. They take the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders a filled Form 8880 with both columns. Line 6 caps both columns. Line 8 sits on the edge of the 0.5 row. Line 11, the tax limit, is smaller than line 10, so it sets the credit. The credit reaches Schedule 3 line 4 and takes the tax to 0. The published examples that check the rules are unit tests (`tests/unit/federal/8880/`).

Forms that file: Form 1040, Schedule 3, Form 8880.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Caprock Dental Group (Wren) | box 1 $29,000, box 2 $850, box 12 D $1,800 |
| W-2, Llano Estacado Freight (Dorian) | box 1 $18,500, box 2 $400, box 12 AA $900 |
| 1099-R, Plainsman Retirement Services (Dorian) | box 1 $4,000, box 2a $0, code G |
| Saver's credit answers, Wren | Roth IRA $1,000; no distributions 2023–2026 |
| Saver's credit answers, Dorian | Roth IRA $1,500; $300 Roth IRA withdrawal in 2024 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8880 line 1 (a), (b) | Roth IRA contributions | 1,000; 1,500 |
| 8880 line 2 (a), (b) | W-2 box 12 D; box 12 AA | 1,800; 900 |
| 8880 line 3 (a), (b) | line 1 + line 2 | 2,800; 2,400 |
| 8880 line 4 (a), (b) | joint return: both spouses' amounts in both columns; the code G rollover stays off | 300; 300 |
| 8880 line 5 (a), (b) | line 3 − line 4 | 2,500; 2,100 |
| 8880 line 6 (a), (b) | smaller of line 5 and $2,000 | 2,000; 2,000 |
| 8880 line 7 | 2,000 + 2,000 | 4,000 |
| 8880 line 8 | 1040 line 11a | 47,500 |
| 8880 line 9 | MFJ, over $39,500, not over $47,500 | 0.5 |
| 8880 line 10 | 4,000 × 0.5 | 2,000 |
| Worksheet line 1 | 1040 line 18 | 1,603 |
| Worksheet line 2 | Schedule 3 lines 1–3, 6d, 6l: none | 0 |
| Worksheet line 3, 8880 line 11 | 1,603 − 0 | 1,603 |
| 8880 line 12 | smaller of 2,000 and 1,603 | 1,603 |
| Schedule 3 line 4, line 8 | 8880 line 12 | 1,603 |
| 1040 line 1a, 1z | 29,000 + 18,500 | 47,500 |
| 1040 line 5a, 5b | the rollover: gross 4,000, taxable 0 | 4,000; 0 |
| 1040 line 9, 11a | line 1z | 47,500 |
| 1040 line 12e | joint standard deduction | 31,500 |
| 1040 line 15 | 47,500 − 31,500 | 16,000 |
| 1040 line 16 | tax table, 16,000–16,050, MFJ | 1,603 |
| 1040 line 20, 21 | Schedule 3 line 8 | 1,603 |
| 1040 line 22, 24 | 1,603 − 1,603 | 0 |
| 1040 line 25a | 850 + 400 withheld | 1,250 |
| 1040 line 34, 35a | all withholding is refunded | 1,250 |
