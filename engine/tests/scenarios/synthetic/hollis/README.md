# hollis — a made-up futures trader (synthetic)

Hollis Varga is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He has one W-2 and two Form 1099-Bs that report only section 1256 contracts (boxes 8–11). One broker reports a gain and one a loss. He takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders a filled Form 6781 Part I and checks that its results reach Schedule D lines 4 and 11 and the tax on Form 1040. The published examples that check the rules are unit tests (`tests/unit/federal/6781/`).

Forms that file: Form 1040, Schedule D, Form 6781.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Bluebonnet Logistics | box 1 $95,000, box 2 $11,000 |
| 1099-B, Ridgeline Futures LLC | box 8 $9,840, box 9 ($1,250), box 10 $2,115, box 11 $13,205 |
| 1099-B, Mesa Commodity Partners | box 8 ($4,318), box 11 ($4,318) |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 6781 line 1, row 1 (c) | Ridgeline box 11 | 13,205 |
| 6781 line 1, row 2 (b) | Mesa box 11, a loss | 4,318 |
| 6781 line 2 (b), (c) | add each column | 4,318; 13,205 |
| 6781 line 3 | 13,205 − 4,318 | 8,887 |
| 6781 line 4 | no straddle or hedge input | blank |
| 6781 line 5 | line 3 + line 4 | 8,887 |
| 6781 line 6 | a net gain: skip | blank |
| 6781 line 7 | line 5 | 8,887 |
| 6781 line 8 | 8,887 × 40% = 3,554.80 | 3,555 |
| 6781 line 9 | 8,887 × 60% = 5,332.20 | 5,332 |
| Schedule D line 4, line 7 | 6781 line 8 | 3,555 |
| Schedule D line 11, line 15 | 6781 line 9 | 5,332 |
| Schedule D line 16 | 3,555 + 5,332 | 8,887 |
| Schedule D lines 17, 20 | both gains; lines 18 and 19 blank | Yes, Yes |
| 1040 line 7a | Schedule D line 16 | 8,887 |
| 1040 line 9, 11a | 95,000 + 8,887 | 103,887 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 103,887 − 15,750 | 88,137 |
| 1040 line 16 | QDCG worksheet, below | 13,936 |
| 1040 line 24 | line 16 | 13,936 |
| 1040 line 37 | 13,936 − 11,000 withheld | 2,936 |

Line 16, the Qualified Dividends and Capital Gain Tax Worksheet: line 4 is the net capital gain, the smaller of Schedule D lines 15 and 16 (5,332). Line 5 is 88,137 − 5,332 = 82,805. The 0% band (to $48,350) is full with ordinary income, so all 5,332 is taxed at 15%: 799.80. Tax on 82,805 from the tax table (82,800–82,850, single) is 13,136. Line 23 is 13,935.80. Tax on 88,137 from the table is 14,302. The smaller is 13,935.80, so line 16 is 13,936.
