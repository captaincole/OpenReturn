# cerandin — a rancher's late estimated tax (synthetic)

Cerandin Marrowby is single and runs a cow-calf ranch near Lusk, Wyoming. She also works a winter job at the feed store. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the Form 2210-F instructions, then locked (`verification: "unverified"`). The return is federal only: Wyoming has no income tax.

She is a farmer for the penalty: $260,000 of her $274,000 gross income is from farming (95%). A farmer has one estimated tax payment, due January 15, 2026. She paid $9,000 on January 12, which was not enough. She pays the rest with her return on March 20. An October barn fire destroyed the ranch's records for weeks, so she asks to waive $40 of the penalty (box A).

The scenario covers Form 2210-F box A and every line of Parts II and III, the fuel tax credit on line 4, and the penalty on Form 1040 lines 38 and 37. Form 2210 does not file: a farmer uses Form 2210-F. `dyelin` covers box B, a payment after January 15 and a refund.

No input documents: the W-2 holds its boxes as printed, and the rest are her books and answers.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1 | Form 1040 line 22 | 12,927 |
| 2 | Schedule 2 line 4, self-employment tax (12,826 + 3,000) | 15,826 |
| 3 | 12,927 + 15,826 | 28,753 |
| 4 | Schedule 3 line 12, fuel tax credit: 4,000 gallons × $.243 | 972 |
| 6 | 28,753 − 972 | 27,781 |
| 7 | 27,781 × 0.667 = 18,529.93 | 18,530 |
| 8 | Form 1040 line 25d | 1,200 |
| 9 | 27,781 − 1,200 | 26,581 |
| 10 | her 2024 tax | 21,400 |
| 11 | smaller of 18,530 and 21,400 | 18,530 |
| 12 | $9,000 paid January 12, 2026, + 1,200 | 10,200 |
| 13 | 18,530 − 10,200 | 8,330 |
| 14 | paid with the return | 03/20/26 |
| 15 | January 15 to March 20: 16 + 28 + 20 | 64 |
| 16 | 8,330 × 64 / 365 × 0.07 = 102.24 → 102, less $40 waived | 62 |
| Box A | waiver requested, line 13 above 0 | checked |
| Form 1040 line 38 | Form 2210-F line 16 | 62 |
| Form 1040 line 37 | 28,753 − 11,172 + 62 | 17,643 |
