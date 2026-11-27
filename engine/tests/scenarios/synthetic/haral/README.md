# haral — a made-up owner in the 11th year of a credit (synthetic)

Haral Brightwater is single and lives in Sarasota, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Haral has one W-2. He owns Marrow Court, a 30-unit building, by himself. Its section 42(e) rehabilitation has its own Form 8609 and its own Form 8609-A (item B, the rehabilitation box). The rehabilitation's credit period began in 2015, so 2025 is year 11. The units filled up over 2015: the first-year modified percentage was .3750, and .9000 of the building was low-income at the close of 2015. The 11th year gets back the part of the first year's credit that the modified percentage deferred (line 17). He takes the standard deduction. The return is federal only: Florida has no income tax.

This scenario is the other branch of `ewin`: in the 11th year the engine leaves lines 4 and 6 to 15 blank (the `DECISION` in `engine/src/federal/8609-a/copies.ts`), so one taxpayer cannot show line 17 and lines 4 to 15 together.

Forms that file: Form 1040, Schedule 3, Forms 8609-A, 8586, 3800 and 8582-CR. The credit goes to Form 8586 line 3 and Form 3800 line 4d. Haral is not a real estate professional, so the credit is passive; with no passive income, Form 8582-CR allows the tax on $25,000 and carries the rest to 2026. The values after Form 8586 were checked by hand and re-locked on 2026-11-27.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Gulfline Structural Partners | box 1 $168,000, box 2 $31,000 |
| Form 8609, Marrow Court rehabilitation (made by `generate-docs.ts`) | BIN FL-15-01126; line 1b $97,200; line 2 9%; line 3a $1,080,000; line 7 $1,200,000; line 8a $1,080,000; first credit year 2015 |
| Building at the end of 2025 | 27 of 30 units, 23,400 of 25,500 square feet low-income |
| First year (his 2015 Form 8609-A and rent roll) | line 2 .3750; .9000 at the close of 2015 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| A | Form 8609 item E | FL-15-01126 |
| B | section 42(e) rehabilitation expenditures | checked |
| 1 | Form 8609 line 7 | 1,200,000 |
| 2 | smaller of 27/30 = .9000 and 23,400/25,500 = .9176 | .9000 |
| 3 | 1,200,000 × .9000; not more than line 8a, so no additions | 1,080,000 |
| 5 | Form 8609 line 2, not below 9% | .0900 |
| 4, 6 to 15 | the 11th year: no credit of its own | blank |
| 16 | no credit of its own | 0 |
| 17 | 1,200,000 × (.9000 − .3750) × .0900 | 56,700 |
| 18 | 0 + 56,700 | 56,700 |
| 1040 line 1a, 9, 11a | W-2 box 1 | 168,000 |
| 1040 line 15 | 168,000 − 15,750 | 152,250 |
| 1040 line 16 | 17,651 + 24% × (152,250 − 103,350) | 29,387 |
| 8586 line 1, 2 | one Form 8609-A; item E "No" | 1; No |
| 8586 line 3, 5 | Form 8609-A line 18; line 4 blank | 56,700 |
| 8582-CR line 3a, 5, 7, 34 | Worksheet 3; no passive income | 56,700 |
| 8582-CR line 35, 37 | tax on 152,250 less tax on 127,250: 25,000 × 24% | 6,000 |
| 3800 line 13, 27 | 25% × (29,387 − 25,000) = 1,096.75; 29,387 − 1,097 | 1,097; 28,290 |
| 3800 line 4d (d), (g); line 38 | passive credit; allowed | 56,700; 6,000; 6,000 |
| Schedule 3 line 6a, 8, 1040 line 20 | Form 3800 line 38 | 6,000 |
| 1040 line 22, 24 | 29,387 − 6,000 | 23,387 |
| 1040 line 34, 35a | 31,000 − 23,387 | 7,613 |

The instructions' own example factor for line 17 (1.0000 − .1250) would give 1,200,000 × .6250 × .0900 = 67,500 here. The engine follows the "deferred balance" rule instead (the `DECISION` in `copies.ts`; `docs/rule-decisions.md`).

The Form 8609 here is made by the same generator as `ewin`'s; see that README for the comparison with real examples.
