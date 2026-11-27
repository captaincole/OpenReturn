# nela — a made-up freight hauler who makes her own agri-biodiesel (synthetic)

Nela Quarrendine is single and lives in Lubbock, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Nela runs a truckload freight business (Schedule C). At her yard she makes agri-biodiesel from Texas-grown soybean oil and burns all of it in her own trucks, so the business sells no goods. She is registered on Form 637, her yard can make 250,000 gallons a year, and she sold $5,000 of her second-half credit to a buyer under section 6418. She is also a limited partner in a fiscal-year biofuels partnership. Its Schedule K-1 (Form 1065) reports box 1 income and box 15 code AC. The partnership's statement says the code AC amount holds $1,300 of SAF credit (2024 fuel) and the producer credit on 14,400 gallons. She takes the standard deduction and paid four estimated tax payments. The return is federal only: Texas has no income tax.

The scenario fills every Form 8864 line an individual fills:

- Line A prints the transfer election's registration number.
- Lines 7 and 8 take the gallons before July 1 at $.10 and after June 30 at $.20.
- Line 9 is Schedule C line 6 income, and Form 6251 line 3 subtracts it.
- Line 10 takes the K-1 code AC amount; line 11 adds lines 9 and 10.
- Form 3800 line 1l takes line 9 (less the $5,000 transfer in column (f)) and the K-1's producer credit; line 1ff takes the K-1's SAF credit.
- Lines 12 and 13 are for cooperatives, estates and trusts: blank.

The gallons are stated answers from the yard's production log, and the K-1 split is a stated answer from the partnership's statement: no information return reports them.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 8995-A, 6251, 3800 and 8864.

## Inputs

| Input | Amounts |
| --- | --- |
| Freight business (Schedule C), Quarrendine Freight | receipts $640,000; expenses $450,800 (wages $168,000) |
| Yard production | 61,480 gallons before July 1; 74,215 gallons after June 30; capacity 250,000; transfer $5,000 |
| K-1, Prairie Crush Biofuels LLC (00-0008864) | box 1 $6,500; box 15 AC $4,180 |
| K-1 statement answer | SAF $1,300; 14,400 gallons, capacity 1,800,000 |
| Estimated tax payments | 4 × $9,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8864 line 7 (c) | 61,480 × $.10 | 6,148 |
| 8864 line 8 (c) | 74,215 × $.20 = 14,842.80 | 14,843 |
| 8864 line 9 | 6,148 + 14,843 | 20,991 |
| 8864 line 10 | K-1 code AC | 4,180 |
| 8864 line 11 | 20,991 + 4,180 | 25,171 |
| Schedule C line 6, 7 | line 9; 640,000 + 20,991 | 20,991; 660,991 |
| Schedule C line 31 | 660,991 − 450,800 | 210,191 |
| Schedule SE line 12 | 176,100 × 12.4% + 194,111 × 2.9% = 21,836 + 5,629 | 27,465 |
| 1040 line 9, 11a | 210,191 + 6,500; less 13,733 | 216,691; 202,958 |
| 1040 line 13a | 20% of 187,208 (taxable income limit) | 37,442 |
| 1040 line 15, 16 | 187,208 − 37,442; tax, single | 149,766; 28,791 |
| 6251 line 3 | −line 9 | −20,991 |
| 6251 line 4 | 149,766 + 15,750 − 20,991 | 144,525 |
| 6251 line 7, 9 | (144,525 − 88,100) × 26% | 14,671 |
| 3800 line 1l (e), (f), (g) | 20,991 + 2,880; −5,000 | 23,871; −5,000; 18,871 |
| 3800 line 1ff (e) | SAF part | 1,300 |
| 3800 line 6 (g) | 18,871 + 1,300 | 20,171 |
| 3800 line 16, 17 | 28,791 − 14,671 (greater of TMT and 948) | 14,120 |
| Schedule 3 line 6a; 1040 line 22 | 14,120; 28,791 − 14,120 | 14,120; 14,671 |
| 1040 line 24, 37 | 14,671 + 27,465; less 36,000 | 42,136; 6,136 |
