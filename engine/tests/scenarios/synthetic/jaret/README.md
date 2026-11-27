# jaret — a business owner with empowerment zone employees (synthetic)

Jaret Quillon is single and lives in El Paso, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Jaret owns a commercial cleaning company (Schedule C) in the El Paso empowerment zone. Five employees worked for it in 2025. He is also a general partner in a trail outfitter. Its Schedule K-1 (Form 1065) reports business income and an empowerment zone credit (box 15 code L). He takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario fills Form 8844 for an individual:

- Line 1: each qualified employee's wages, up to $15,000. One employee worked fewer than 90 days, and one is Jaret's nephew: neither counts. One left in her sixth week for misconduct: the 90-day rule does not apply to her.
- Line 2: 20% of line 1. Schedule C line 26 takes the wages less this credit.
- Line 3: the K-1 credit. Lines 5 and 6 are for cooperatives, estates and trusts: blank.
- Line 4 goes to Form 3800 Part III line 3, with Part V rows for the two sources, Part II Section B, and Schedule 3 line 6a.

Simplifications: the K-1 prints no box 14 and no section 199A statement, so the partnership income has no self-employment tax and no QBI.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 8844 and 8995.

## Inputs

| Input | Amounts |
| --- | --- |
| Schedule C, Sunset Heights Cleaning Co. | receipts $236,000; wages $98,000; advertising $2,400; insurance $6,800; supplies $14,200; utilities $3,100 |
| Rosa Ibarra | qualified, zone wages $32,000 |
| Tomas Garay | qualified, zone wages $9,800.50 |
| Lena Ortiz | fewer than 90 days, zone wages $7,200 |
| Marco Quillon | nephew, zone wages $21,000 |
| Dalia Roque | fewer than 90 days, terminated for misconduct, zone wages $3,400 |
| K-1, Franklin Ridge Outfitters LLC (00-0008845) | box 1 $14,000; box 15 L $1,200 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. The employee facts come from the payroll records: no information return prints them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8844 line 1 | 15,000 + 9,800.50 + 0 + 0 + 3,400, rounded once | 28,201 |
| 8844 line 2 | 20% × 28,201 = 5,640.20 | 5,640 |
| 8844 line 3 | K-1 box 15 code L | 1,200 |
| 8844 line 4 | 5,640 + 1,200 | 6,840 |
| Schedule C line 26 | 98,000 − 5,640 | 92,360 |
| Schedule C line 28, 31 | 2,400 + 6,800 + 14,200 + 3,100 + 92,360; 236,000 − 118,860 | 118,860; 117,140 |
| Schedule SE line 4a, 12, 13 | 117,140 × 92.35%; 13,414 + 3,137; half | 108,179; 16,551; 8,276 |
| 1040 line 9, 11a | 117,140 + 14,000; less 8,276 | 131,140; 122,864 |
| 8995 line 1i(c), 15 | 117,140 − 8,276; smaller of 20% × 108,864 and 20% × 107,114 | 108,864; 21,423 |
| 1040 line 15, 16 | 122,864 − 15,750 − 21,423; tax table | 85,691; 13,763 |
| 6251 line 4, 7 | 85,691 + 15,750; 26% × (101,441 − 88,100) | 101,441; 3,469 |
| 3800 Part III line 3 (e), (g) | 1,200 + 5,640 | 6,840 |
| 3800 line 18, 20 | 75% × 3,469; 13,763 − 2,602 | 2,602; 11,161 |
| 3800 line 22, 26, 38 | Part III line 3 (e); smaller of 6,840 and 11,161 | 6,840 |
| Schedule 3 line 6a; 1040 line 22 | 3800 line 38; 13,763 − 6,840 | 6,840; 6,923 |
| 1040 line 24 | 6,923 + 16,551 | 23,474 |
