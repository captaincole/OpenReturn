# nacelle — a made-up engineer with two jobs (synthetic)

Nacelle Varrow is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the Form 1040 instructions for Schedule 3, then locked (`verification: "unverified"`). The return is federal only: Nevada has no income tax.

She changed jobs in September 2025. Each employer withheld social security tax on its own wages, and neither withheld more than the $10,918.20 maximum. Together they withheld $11,888.50, so $970.30 is excess (Schedule 3 line 11). She filed Form 4868 on April 15, 2026 and paid $2,000 with it (Schedule 3 line 10).

The scenario covers: Schedule 3 lines 10, 11 and 15 and Form 1040 line 31, with no Form 4136. Her Medicare wages are $191,750, under the $200,000 Additional Medicare Tax threshold, so Form 8959 does not file.

No input documents: the facts are the two W-2s' boxes as the documents would print them and her answer about the extension payment.

Forms checked: Schedule 3, Form 1040.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| W-2 box 4 | 6.2% of box 3: 112,450 × .062; 79,300 × .062 | 6,971.90; 4,916.60 |
| Schedule 3 line 10 | paid with Form 4868 (`irs-1040-inst-2025::sec::line-10-4::b01`) | 2,000 |
| Schedule 3 line 11 | 6,971.90 + 4,916.60 = 11,888.50, less 10,918.20 = 970.30 (`::line-11-2::b01`) | 970 |
| Schedule 3 line 15 | lines 9 to 12 and 14: 2,000 + 970 | 2,970 |
| 1040 line 1a, 9, 11a | 112,450 + 79,300 | 191,750 |
| 1040 line 12e | 2025 single standard deduction | 15,750 |
| 1040 line 15 | 191,750 − 15,750 | 176,000 |
| 1040 line 16 | 1,192.50 + 4,386 + 12,072.50 + (176,000 − 103,350) × .24 = 17,436 | 35,087 |
| 1040 line 24 | no other taxes | 35,087 |
| 1040 line 25a, 25d | box 2: 19,800 + 11,400 | 31,200 |
| 1040 line 31, 32 | Schedule 3 line 15 | 2,970 |
| 1040 line 33 | 31,200 + 2,970 | 34,170 |
| 1040 line 37 | 35,087 − 34,170 | 917 |
