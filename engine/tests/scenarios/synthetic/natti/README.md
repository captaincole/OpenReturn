# natti — a made-up salon owner with tipped employees (synthetic)

Natti Varrow is single and lives in Galveston, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Natti owns a hair, nail and spa salon (Schedule C). Her stylists receive tips, and the salon pays employer social security and Medicare taxes on them. Two assistants were paid less than $7.25 an hour in three months; one of those months had less in tips than the shortfall. A senior stylist's wages and tips passed the $176,100 wage base. Natti is also a general partner in a restaurant partnership. Its Schedule K-1 (Form 1065) reports business income in box 1 and the same credit in box 15 code N. She takes the standard deduction and paid four estimated tax payments. The return is federal only: Texas has no income tax.

The scenario fills every line of Form 8846, with the line 4 box checked:

- Line 2 takes each employee month paid below $7.25, never more than the month's tips.
- Line 4 takes the Medicare-only tips at 1.45% and the rest at 7.65%.
- Line 5 takes the K-1 credit, and line 6 goes to Form 3800 Part III line 4f.
- Schedule C line 23 is the stated taxes and licenses less line 4.
- Form 3800 Part V lists the salon's credit and the K-1's. The credit is a specified credit; it reaches Schedule 3 line 6a.

The salon's tip amounts are stated answers from its payroll records: no information return reports them. The K-1 prints no box 14 and no section 199A statement, so the partnership adds no self-employment tax and no QBI. Form 3800 lines 14 to 16 are a gap the form already has: Form 6251 does not file for specified credits alone.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 8995, 3800 and 8846.

## Inputs

| Input | Amounts |
| --- | --- |
| Salon (Schedule C), Varrow Hair & Nail Studio | receipts $985,000; wages $452,000; taxes and licenses $56,200 (employer taxes before the credit); other expenses $349,800 |
| Salon tip records | tips $184,600.40; four employee months listed below; Medicare-only tips $21,480 |
| K-1, Saltgrass Oyster Bar LLC (00-0008846) | box 1 $12,000; box 15 N $2,350 |
| Estimated tax payments | 4 × $6,000 |

| Employee month | Hours | Wages | Tips | Hours × $7.25 − wages | Line 2 amount |
| --- | --- | --- | --- | --- | --- |
| Ilse, March | 120 | 360.00 | 1,450 | 510.00 | 510.00 |
| Ilse, April | 130 | 390.00 | 1,600 | 552.50 | 552.50 |
| Teodor, July | 80 | 170.40 | 300 | 409.60 | 300.00 (the month's tips) |
| Teodor, August | 100 | 800.00 | 410 | below 0 | 0 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8846 line 1 | tips, rounded | 184,600 |
| 8846 line 2 | 510 + 552.50 + 300 + 0 = 1,362.50 | 1,363 |
| 8846 line 3 | 184,600 − 1,363 | 183,237 |
| 8846 line 4 box | a stylist passed $176,100 | checked |
| 8846 line 4 | (183,237 − 21,480) × 0.0765 + 21,480 × 0.0145 = 12,374.41 + 311.46 | 12,686 |
| 8846 line 5 | K-1 code N | 2,350 |
| 8846 line 6 | 12,686 + 2,350 | 15,036 |
| Schedule C line 23 | 56,200 − 12,686 | 43,514 |
| Schedule C line 28 | 858,000 − 12,686 | 845,314 |
| Schedule C line 31 | 985,000 − 845,314 | 139,686 |
| Schedule SE line 4a, 12 | 139,686 × 0.9235; 129,000 × 15.3% | 129,000; 19,737 |
| Schedule 1 line 10, 1040 line 9 | 139,686 + 12,000 | 151,686 |
| 1040 line 11a | 151,686 − 9,869 (half of SE tax) | 141,817 |
| 1040 line 13a | Form 8995: 20% of (141,817 − 15,750), smaller than 20% of 129,817 | 25,213 |
| 1040 line 15 | 141,817 − 15,750 − 25,213 | 100,854 |
| 1040 line 16 | tax computation worksheet, single | 17,102 |
| Form 3800 line 4f (e), (g) | 12,686 + 2,350 | 15,036 |
| Form 3800 line 37, 38 | smaller of line 29 (17,102) and line 36 (15,036) | 15,036 |
| Schedule 3 line 6a, 8; 1040 line 20 | Form 3800 line 38 | 15,036 |
| 1040 line 22 | 17,102 − 15,036 | 2,066 |
| 1040 line 24 | 2,066 + 19,737 | 21,803 |
| 1040 line 26, 33 | estimated payments | 24,000 |
| 1040 line 34, 35a | 24,000 − 21,803 | 2,197 |
