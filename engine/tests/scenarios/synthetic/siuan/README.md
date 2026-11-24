# siuan — a beneficiary's lump-sum distribution on Form 4972 (synthetic)

Siuan Ferrandel is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

She is 67 and retired. She gets a pension from a former employer. In 2025 she also received her father's entire balance in a profit-sharing plan, as his beneficiary. He was born in 1929 and died in 1995, before August 21, 1996. The payment was cash, employer stock and an annuity contract. She makes the 20% capital gain election, uses the 10-year tax option, and includes the stock's net unrealized appreciation (NUA) in income. The estate's administrator gave her the death benefit exclusion ($5,000) and the federal estate tax paid on the distribution ($3,000). The return is federal only: Nevada has no income tax.

One taxpayer shows every Form 4972 branch except a shared distribution: Part II, Part III, the NUA Worksheet, the Death Benefit Worksheet, the minimum distribution allowance (lines 13 to 16), estate tax (line 18) and an annuity (lines 20 to 22 and 26 to 28). The unit tests cover a shared distribution (the Step 5 worksheet).

Forms that file: Form 1040, Schedule 1-A (the senior deduction), Form 4972.

## Input documents

Both Forms 1099-R are made documents in `docs/`, rendered by `generate-docs.ts` from the fact objects in `facts.ts` (`documents/form1099R.ts`): `01-truckee-valley-water-1099-r.pdf` (the pension) and `02-harlow-tool-works-1099-r.pdf` (the lump sum). The payers' addresses and phone numbers are invented. The Part I answers, the elections, the death benefit exclusion and the estate tax are her answers: no Form 1099-R prints them.

## Inputs

| Input | Amounts |
| --- | --- |
| 1099-R, Truckee Valley Water District Pension Plan | box 1 and 2a $24,000, box 4 $2,400, code 7 |
| 1099-R, Harlow Tool Works Profit-Sharing Plan | box 1 $52,000, box 2a $46,000, box 3 $5,520, box 4 $9,200, box 6 $6,000, code 4A, box 8 $9,000, total distribution |
| Death benefit exclusion | $5,000 |
| Federal estate tax on the distribution | $3,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| NUA A, B | box 3, box 2a | 5,520; 46,000 |
| NUA C | 5,520 / 46,000 | .1200 |
| NUA D, E, F, G | box 6; 0.12 × 6,000; 6,000 − 720; 5,520 + 720 | 6,000; 720; 5,280; 6,240 |
| DBW A, B | NUA G; box 2a + box 6 | 6,240; 52,000 |
| DBW C | 6,240 / 52,000 | .1200 |
| DBW D, E, F | her share (only recipient); 5,000 × 0.12; 6,240 − 600 | 5,000; 600; 5,640 |
| 4972 line 6 | DBW F − estate tax × C: 5,640 − 360 | 5,280 |
| 4972 line 7 | 20% of line 6 | 1,056 |
| 4972 line 8 | 46,000 − 5,520 + NUA F 5,280 | 45,760 |
| 4972 line 9 | DBW D − E | 4,400 |
| 4972 line 10 | 45,760 − 4,400 | 41,360 |
| 4972 line 11 | box 8 | 9,000 |
| 4972 line 12 | 41,360 + 9,000 (under $70,000) | 50,360 |
| 4972 lines 13–16 | 10,000 (cap); 30,360; 6,072; 10,000 − 6,072 | 3,928 on line 16 |
| 4972 line 17 | 50,360 − 3,928 | 46,432 |
| 4972 line 18 | 3,000 − 360 | 2,640 |
| 4972 line 19 | 46,432 − 2,640 | 43,792 |
| 4972 line 20 | 9,000 / 50,360 = 0.17871 | .1787 |
| 4972 line 21 | 3,928 × 0.1787 = 701.93 | 702 |
| 4972 line 22 | 9,000 − 702 | 8,298 |
| 4972 line 23 | 10% of 43,792 = 4,379.20 | 4,379 |
| 4972 line 24 | 260.50 + 14% × 2,109 = 555.76 | 556 |
| 4972 line 25 | 556 × 10 | 5,560 |
| 4972 line 26 | 10% of 8,298 = 829.80 | 830 |
| 4972 line 27 | 11% × 830 = 91.30 | 91 |
| 4972 line 28 | 91 × 10 | 910 |
| 4972 line 29 | 5,560 − 910 | 4,650 |
| 4972 line 30 | 1,056 + 4,650 | 5,706 |
| 1040 lines 5a, 5b | the pension only; Part III takes the lump sum off line 5 | 24,000 |
| 1040 line 11a | 24,000 | 24,000 |
| 1040 line 12e | single, 65 or older: 15,750 + 2,000 | 17,750 |
| 1040 line 13b | Schedule 1-A senior deduction | 6,000 |
| 1040 line 15 | 24,000 − 23,750 | 250 |
| 1040 line 16 | table tax on 250 (26) + Form 4972 line 30; box 2 | 5,732 |
| 1040 line 25b | 1099-R box 4: 2,400 + 9,200 | 11,600 |
| 1040 line 34 | 11,600 − 5,732 | 5,868 |

Part I: line 1 Yes, line 2 No, line 3 Yes, line 4 No, line 5a No, line 5b No.
