# rhuarc — a made-up Army Reserve member in California (synthetic)

Rhuarc Delacorte is single. He lives in Redding, California, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He works for a water utility and is in the Army Reserve. He drives his own car to drill weekends at a post 160 miles away, on the standard mileage rate. The unit paid a travel allowance, not in W-2 box 1, that was more than his mileage, tolls and lodging, and paid nothing toward meals. So column A of Form 2106 has an excess (Form 1040 line 1a), and line 10 is his meals at 50%: Schedule 1 line 12 and Schedule CA (540) line 12 column A. He takes the standard deduction.

This scenario covers the branches aviendha cannot: a reservist, the line 1a excess, and California. It shares the federal Form 2106 rules with aviendha; the unit tests hold the published examples (`tests/unit/federal/2106/`).

Forms that file: Form 1040, Schedule 1, Form 2106, Form 540, Schedule CA (540).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Shasta Ridge Water Utility | box 1 $58,000, box 2 $4,300, box 16 $58,000, box 17 $1,900, CA SDI $696 |
| W-2, Reserve Component Pay Center | box 1 $7,400, box 2 $300, box 16 $7,400, box 17 $150 |
| Car (owned, standard mileage) | placed in service 5/10/2022; 14,000 miles, 3,840 reserve miles; 22-mile commute × 230 days |
| Line 2, 3, 5 | tolls $96; lodging $1,320; meals $1,680 |
| Unit allowance (not in box 1) | $4,400 for expenses other than meals |
| Federal per diem for the drill days | lodging $1,560; M&IE $1,476 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 14 | 3,840 ÷ 14,000 | 27.43 |
| 16, 17 | 230 × 22; 14,000 − 3,840 − 5,060 | 5,060; 5,100 |
| 18–21 | Yes; No; Yes; No (no written evidence) | checked |
| 22, 1 | 3,840 × $0.70 | 2,688 |
| 6 A, B | 2,688 + 96 + 1,320; meals | 4,104; 1,680 |
| 7 A | the allowance | 4,400 |
| 8, 9 A | 4,104 − 4,400, at least 0 | 0 |
| 8 B, 9 B | 1,680; × 50% | 1,680; 840 |
| 10 | 0 + 840 | 840 |
| Reservist limit | 1,320 + min(1,680, 1,476) × 50% + 96 + 2,688 = 4,842, more than 840 | no cut |
| Schedule 1 line 12, 26 | line 10 | 840 |
| 1040 line 1a, 1z, 9 | 58,000 + 7,400 + the 296 excess (4,400 − 4,104) | 65,696 |
| 1040 line 10, 11a | 840; 65,696 − 840 | 840; 64,856 |
| 1040 line 12e, 15 | single standard deduction; 64,856 − 15,750 | 15,750; 49,106 |
| 1040 line 16 | tax table, 49,100–49,150, single | 5,722 |
| 1040 line 25a, 37 | 4,300 + 300; 5,722 − 4,600 owed | 4,600; 1,122 |
| Schedule CA line 12 col A | Schedule 1 line 12; no depreciation, so columns B and C blank | 840 |
| Schedule CA line 26, 27 col A | 840; 65,696 − 840 | 840; 64,856 |
| 540 line 13, 17 | federal AGI, no California adjustment | 64,856 |
| 540 line 18, 19 | California standard deduction; 64,856 − 5,706 | 5,706; 59,150 |
| 540 line 31, 32, 33 | tax table; exemption credit; 2,112 − 153 | 2,112; 153; 1,959 |
| 540 line 71, 97 | 1,900 + 150 withheld; 2,050 − 1,959 | 2,050; 91 |
