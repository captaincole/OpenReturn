# logain — the credit for prior year minimum tax (synthetic)

Logain Vedrecht is single and lives in Plano, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He is a chip design engineer. In 2024 he exercised incentive stock options and still holds the shares, so he paid AMT for 2024. His 2024 return also had tax-exempt interest on private activity bonds, a net operating loss deduction from an old business, and qualified dividends and capital gains (a 2024 Schedule D Tax Worksheet, with $8,000 of unrecaptured section 1250 gain). He had a $12,000 credit carryforward from 2023. In 2025 he has a W-2, dividends with $250 of foreign tax (the election, no Form 1116) and bank interest. He takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders a filled Form 8801 with Parts I, II and III. Line 7 is above 0 (the 2024 exemption phases out), line 15 is above 0 (exclusion items alone give a minimum tax above his 2024 regular tax), and Part III runs every line through 52. The credit is limited by line 24, reaches Schedule 3 line 6b, and leaves a carryforward to 2026. Form 6251 files because Form 8801 does.

Forms checked: Form 8801, Form 6251, Schedule 3, Schedule B, Form 8959, Form 8960, Schedule 2, Form 1040. Schedule B files because interest ($6,000) and ordinary dividends ($34,000) are each over $1,500. He exercised no options in 2025, so no 2025 spread is recorded and Form 6251 line 2i is blank.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Falme Semiconductor Inc. | box 1 $650,000, box 2 $175,000, box 6 $13,475 |
| 1099-DIV, Tanchico World Index Fund | box 1a $34,000, box 1b $30,000, box 7 $250 |
| 1099-INT, Lugard Savings Bank | box 1 $6,000 |
| 2024 Form 6251 | line 1 $562,000, 2a $10,000, 2e $18,000, 2g $110,000, 8 $280, 10 $151,350, 11 $160,493 |
| 2024 MTCNOL deduction | $15,000 |
| 2024 Form 8801 line 26 | $12,000 |
| 2024 Schedule D Tax Worksheet | line 10 $90,000, 13 $82,000, 14 $480,000, 21 $472,000; Schedule D line 19 $8,000 |
| 2024 foreign tax credit | the election; Schedule 3 line 1 $280 |
| Other answers | single for 2024; no other exclusion items; no 2024 Form 2555 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8801 line 1 | 562,000 + 18,000 | 580,000 |
| 8801 line 2 | 2a 10,000 + 2g 110,000 | 120,000 |
| 8801 line 3 | the MTCNOL deduction | (15,000) |
| 8801 line 4 | 580,000 + 120,000 − 15,000 | 685,000 |
| 8801 lines 5, 6 | 2024 single | 85,700; 609,350 |
| 8801 line 7 | 685,000 − 609,350 | 75,650 |
| 8801 line 8 | 25% of 75,650 = 18,912.50, rounded | 18,913 |
| 8801 line 9 | 85,700 − 18,913 | 66,787 |
| 8801 line 10, 27 | 685,000 − 66,787 | 618,213 |
| 8801 line 28 | worksheet line 13 | 82,000 |
| 8801 line 29 | 2024 Schedule D line 19 | 8,000 |
| 8801 line 30, 31 | smaller of 82,000 + 8,000 and worksheet line 10 (90,000); smaller of line 27 and 30 | 90,000 |
| 8801 line 32 | 618,213 − 90,000 | 528,213 |
| 8801 line 33 | 528,213 × 28% − 4,652 = 143,247.64 | 143,248 |
| 8801 line 34 | 2024 single | 47,025 |
| 8801 line 35 | worksheet line 14 | 480,000 |
| 8801 lines 36, 38, 41 | 47,025 − 480,000 is below 0 | 0 |
| 8801 lines 37, 39 | smaller of 618,213 and 82,000; 82,000 − 0 | 82,000 |
| 8801 line 40 | 2024 single | 518,900 |
| 8801 lines 42, 43 | worksheet line 21; 0 + 472,000 | 472,000 |
| 8801 lines 44, 45, 47 | 518,900 − 472,000; smaller of 82,000 and 46,900; 0 + 46,900 | 46,900 |
| 8801 line 46 | 15% of 46,900 | 7,035 |
| 8801 line 48, 49 | 82,000 − 46,900; 20% | 35,100; 7,020 |
| 8801 lines 50–52 | 528,213 + 46,900 + 35,100; 618,213 − 610,213; 25% | 610,213; 8,000; 2,000 |
| 8801 line 53 | 143,248 + 7,035 + 7,020 + 2,000 | 159,303 |
| 8801 line 54 | 618,213 × 28% − 4,652 = 168,447.64 | 168,448 |
| 8801 line 55, 11 | smaller of 159,303 and 168,448 | 159,303 |
| 8801 line 12 | 2024 Schedule 3 line 1 (the election) | 280 |
| 8801 line 13 | 159,303 − 280 | 159,023 |
| 8801 line 14 | 2024 Form 6251 line 10 | 151,350 |
| 8801 line 15, 17 | 159,023 − 151,350 | 7,673 |
| 8801 line 16 | 2024 Form 6251 line 11 | 160,493 |
| 8801 line 18 | 160,493 − 7,673 | 152,820 |
| 8801 line 19 | 2024 Form 8801 line 26 | 12,000 |
| 8801 line 21 | 152,820 + 12,000 (line 20 blank) | 164,820 |
| Schedule B lines 1, 2, 4 | Lugard Savings Bank, 1099-INT box 1 | 6,000 |
| Schedule B lines 5, 6 | Tanchico World Index Fund, 1099-DIV box 1a | 34,000 |
| 1040 line 15 | 690,000 − 15,750 | 674,250 |
| 1040 line 16 | 644,250 ordinary (37% bracket) + 30,000 at 20% | 201,393 |
| 8801 line 22 | 201,393 + Schedule 2 line 1z (0) − Schedule 3 line 1 (250) | 201,143 |
| 6251 line 4 | 674,250 + 15,750 | 690,000 |
| 6251 line 5 | 88,100 − 25% of 63,650 (15,912.50 → 15,913) | 72,187 |
| 6251 line 9, 8801 line 23 | 587,813 × 28% − 4,782 = 159,806; + 30,000 at 20% | 165,806 |
| 8801 line 24, 25 | 201,143 − 165,806; smaller of 164,820 and 35,337 | 35,337 |
| 8801 line 26 | 164,820 − 35,337 | 129,483 |
| Schedule 3 lines 6b, 7 | 8801 line 25 | 35,337 |
| Schedule 3 line 8, 1040 lines 20, 21 | 250 + 35,337 | 35,587 |
| 1040 line 22 | 201,393 − 35,587: the tax falls to the tentative minimum tax | 165,806 |
| 1040 line 23 | Additional Medicare Tax 4,050 + net investment income tax 1,520 | 5,570 |
