# arram — a made-up landlord with passive credits (synthetic)

Arram Thornwell is single and lives in Lubbock, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Arram is a hospital pharmacist with one W-2. He rents out a duplex he manages himself, at a $6,000 loss. He holds credits from three rental real estate activities, and last year's Form 8582-CR left some of them unallowed. He takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario fills Form 8582-CR in every part but VI:

- Worksheet 1 (lines 1a to 1c): a disabled access credit and an empowerment zone credit from the duplex, and last year's unallowed disabled access credit.
- Worksheet 2 (lines 2a to 2c): a rehabilitation credit and last year's unallowed one.
- Worksheet 3 (lines 3a to 3c): a low-income housing credit and last year's unallowed one.
- Line 6 is 0: Form 8582 line 3 is a loss.
- Part II: modified AGI of $118,000 phases the $25,000 allowance down to $16,000; Form 8582 line 9 used $6,000 of it.
- Part III: the higher phaseout leaves $25,000, less the $6,000.
- Part IV: the tax on the allowance left after Parts II and III.
- Worksheets 5 to 9 split the allowed credit among the seven sources. Form 3800 takes it on lines 3, 24 and 33, and Schedule 3 line 6a takes Form 3800 line 38.

Simplifications: the credit amounts are stated, as their source forms (Forms 8826, 8844, 3468 and 8586) would figure them; the engine does not have those forms. Last year's unallowed credits are stated answers: the product does not read last year's return yet (#79). Part VI (the basis election) is in the unit tests only, since it needs a sale of the credit property.

Forms that file: Form 1040, Schedules 1, 2, 3 and E, Forms 8582, 8582-CR, 3800 and 6251. Schedule 2 prints only 0 on lines 2 and 3: it files with Form 6251, and its rule cannot see that Form 6251 line 11 is 0 (a known gap of the Schedule 2 rule).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, South Plains Regional Hospital | box 1 $118,000, box 2 $13,200 |
| Duplex, 618 Cedar Ln (active participation) | rents $24,000; expenses $30,000 |
| Credits, Cedar Lane duplex (Worksheet 1) | Form 8826 $2,500; Form 8844 $1,200; 2023 Form 8826 carryover $700 |
| Credits, Old Mill Lofts (Worksheet 2) | Form 3468 Part VII $1,000; 2024 carryover $400 |
| Credits, Prairie Commons Apartments (Worksheet 3, placed in service 2019) | Form 8586 $4,000; 2024 carryover $1,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8582 lines 6 to 9 | 150,000 − 118,000; half; smaller of the $6,000 loss | 32,000; 16,000; 6,000 |
| 1040 line 11, 15 | 118,000 − 6,000; less 15,750 | 112,000; 96,250 |
| 1040 line 16 | Tax Table, $96,250 single | 16,095 |
| 8582-CR 1a, 1b, 1c | 2,500 + 1,200; 700 | 3,700; 700; 4,400 |
| 8582-CR 2a, 2b, 2c | 1,000; 400 | 1,400 |
| 8582-CR 3a, 3b, 3c | 4,000; 1,000 | 5,000 |
| 8582-CR 5, 6, 7 | 4,400 + 1,400 + 5,000; net passive loss | 10,800; 0; 10,800 |
| 8582-CR 8 to 12 | smaller of 1c and 7; 150,000 − 118,000; half | 4,400; 32,000; 16,000 |
| 8582-CR 13, 14 | Form 8582 line 9; 16,000 − 6,000 | 6,000; 10,000 |
| 8582-CR 15, 16 | 22% × 10,000 (both incomes in the 22% rows of the Tax Table) | 2,200 |
| 8582-CR 17 to 20 | 10,800 − 2,200; smaller of 2c | 8,600; 1,400 |
| 8582-CR 21 to 26 | 250,000 − 118,000; half, at most 25,000; less 6,000 | 132,000; 25,000; 19,000 |
| 8582-CR 27 to 30 | 22% × 19,000; less 2,200; smaller of 1,400 | 4,180; 1,980; 1,400 |
| 8582-CR 31 to 34 | line 19; less line 30; smaller of 3c | 8,600; 7,200; 5,000 |
| 8582-CR 35, 36 | tax on 25,000 − 6,000 (4,180) less 2,200 + 1,400 | 580 |
| 8582-CR 37 | 0 + 2,200 + 1,400 + 580 | 4,180 |
| Worksheet 5 | 2,200 by 2,500 : 1,200 : 700 | 1,250; 600; 350 |
| Worksheet 6 | 1,400 covers both | 1,000; 400 |
| Worksheet 7 | 580 by 4,000 : 1,000 | 464; 116 |
| Worksheet 8 | line 5 − line 37 = 6,620, the whole of column (d): nothing more allowed | — |
| 3800 line 2, 3 | Part III 1e (d) 2,500 + Part IV 1e (d) 700; allowed 1,250 + 350 | 3,200; 1,600 |
| 3800 line 23, 24 | Part III line 3 (d); allowed | 1,200; 600 |
| 3800 line 32, 33 | 1,000 + 4,000 + 400 + 1,000; allowed 1,000 + 464 + 400 + 116 | 6,400; 1,980 |
| 3800 line 14, 16, 17 | 6251: 26% × (112,000 − 88,100); 16,095 − 6,214; smaller of 1,600 | 6,214; 9,881; 1,600 |
| 3800 line 26, 37, 38 | 600; 1,980; 1,600 + 600 + 1,980 | 4,180 |
| Schedule 3 line 6a; 1040 line 22 | 3800 line 38; 16,095 − 4,180 | 4,180; 11,915 |
| 1040 line 34 | 13,200 − 11,915 | 1,285 |
