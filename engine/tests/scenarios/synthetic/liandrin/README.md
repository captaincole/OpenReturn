# liandrin — credit recapture, excessive payments and penalties (synthetic)

Liandrin Corvesse is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is an energy engineer with a W-2. In earlier years she claimed business credits on property she owns. In 2025 several of those credits come back (recapture), the IRS finds excessive elective payments, and she owes prevailing wage and apprenticeship penalties. Form 4255 figures each amount, and Schedule 2 carries them to Form 1040. The return is federal only: Texas has no income tax.

The scenario keeps to Form 4255. The sales of the properties, their gains and their basis are left out. The earlier-year amounts are stated, as from her earlier Forms 3468, 3800, 7220, 8911 and 8933 and from IRS notices. No input document is new: these are amounts from her own earlier returns.

Forms that file: Form 1040, Schedule 2, Form 8959, Form 4255.

## What it covers

- Part II: four properties. A, a rehabilitated building sold after 2 full years (60%, with a carryforward reduced). B, solar property with more nonrecourse financing (Section C). C, advanced manufacturing property with an expansion (0 years, 100%). D, a heat pump sold after 3 full years, with $1,000 on line 13.
- Part III: a hydrogen facility whose verified emissions support 7.5% instead of 30%.
- Worksheet 3: a prevailing wage failure on a repair, on line 1j.
- Part I: lines 1a, 1b, 1c, 1d, 1j, 2a and 2b; "N/A" in column (g) of line 1j (four events); the penalty split of row A33; columns (q) to (t).
- Schedule 2: lines 1d, 1e and 1f with all eight boxes, 1y, 17a, 17z and 19.

## Hand check: Part II

| Line | A (1b) | B (1j) | C (1d) | D (1j) |
| --- | --- | --- | --- | --- |
| 1 | 20% | 30% | 25% | 30% |
| 2 | 400,000 | 120,000 | 40,000 | 20,000 |
| 3 | 0 | 20,000 | 0 | 0 |
| 4 = 2 − 3 | 400,000 | 100,000 | 40,000 | 20,000 |
| 5 = 1 × 4 | 80,000 | 30,000 | 10,000 | 6,000 |
| 6 | 24,000 | 36,000 | 10,000 | 6,000 |
| 7 = 6 − 5, at least 0 | 0 | 6,000 | 0 | 0 |
| 8 | 0 | 1,500 | 0 | 0 |
| 9 = 7 − 8 | 0 | 4,500 | 0 | 0 |
| 10 (first of the month) | 03/01/2023 | | 02/01/2024 | 11/01/2021 |
| 11 | 08/20/2025 | | 07/15/2025 | 04/30/2025 |
| 12 | 2 | | 0 (expansion) | 3 |
| 13 | 0 | | 0 | 1,000 |
| 14 = 6 − 13 | 24,000 | | 10,000 | 5,000 |
| 15 | 60% | | 100% | 40% |
| 16 = 14 × 15 | 14,400 | | 10,000 | 2,000 |

Line 18 is 4,500. Line 19 is 14,400 + 10,000 + 2,000 = 26,400. Line 20 is 30,900.

## Hand check: Part III and Worksheet 3

- Part III: line 4 = 250,000 × 30% = 75,000. Line 7 = 250,000 × 7.5% = 18,750. Line 8 = 56,250. Line 9 = 20% = 11,250.
- Worksheet 3: 15,000 × 0.80 = 12,000. 06/10/2024 to 09/01/2025 is 1 full year: 80%. 12,000 × 80% = 9,600.

## Hand check: Part I

| Line | (a) | (b) | (c) | (d) | (e) | (f) | (g) | (h) | (i) | (j) | (l) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1a | 20,000 | 20,000 | 5,000 | 15,000 | 0 | 0 | | | | | |
| 1b | 32,000 | | | | 24,000 | 8,000 | 60% | 19,200 | 4,800 | 14,400 | |
| 1c | 8,000 | 8,000 | 0 | 8,000 | 0 | 0 | | | | | |
| 1d | 10,000 | 10,000 | 0 | 10,000 | 0 | 0 | 100% | 10,000 | | | 10,000 |
| 1j | 132,000 | | | | 97,000 | 35,000 | N/A | 27,350 | | 27,350 | |
| 2a | 60,000 | 50,000 | 0 | 50,000 | 0 | 10,000 | | 9,000 | | | 9,000 |
| 2b | 18,000 | | | | 18,000 | 0 | | 3,600 | | 3,600 | |

- Line 1b: 14,400 of tax plus 60% of the 8,000 carryforward (4,800) is 19,200.
- Line 1j: 4,500 (B) + 2,000 (D) + 11,250 (Part III) + 9,600 (Worksheet 3) = 27,350. No elective payment, so all of it is column (j).
- Lines 1d and 2a: only column (d) was used, so the recapture is column (l).
- Column (n): 1a 2,000 / – / 400; 1c 1,000 / 500 / 300; 1d 500 / – / 100; 2a 4,000 / 1,000 / 1,000 (20% of (n)(1) + (n)(2), no reasonable cause).
- Line 1j: (m)(1) 5,000, (m)(2) 1,000, (m)(3) 2,000, (p)(3) 1,200.
- Line 2a penalty 3,000: (o)(1) = 3,000 × 50,000 / 60,000 = 2,500; (o)(2) = 0; (o)(3) = the rest, 500 (row A33).
- Column (q): 1a 2,400; 1c 1,800; 1d 600; 1j 6,000; 2a 6,000 + 9,000 = 15,000; 2b 3,600. Total 29,400.
- Column (r): 1b 14,400; 1d 10,000; 1j 27,350 + 2,000 + 1,200 = 30,550; 2a 3,000. Total 57,950.
- Column (s) = (l) + (n)(1): 1a 2,000; 1c 1,000; 1d 10,500; 2a 13,000. Total 26,500.
- Column (t) = (n)(3) + (o)(1) + (o)(2) + (p)(1) + (p)(2): 400 + 300 + 100 + 3,500 = 4,300.

## Hand check: Schedule 2 and Form 1040

| Line | Rule | Value |
| --- | --- | --- |
| Sch 2 1d | 2a column (l) | 9,000 |
| Sch 2 1e | (n)(1) of 1a, 1c, 1d, 2a; four boxes | 7,500 |
| Sch 2 1f | (n)(3) of the same lines; four boxes | 1,800 |
| Sch 2 1y | ARPCR 3,600 + EPGEPE 1,500 + 6418(g)(2) 6,000 | 11,100 |
| Sch 2 1z, 3 | = Form 4255 line 3 column (q) | 29,400 |
| Sch 2 11 | Form 8959: 0.9% of 280,000 | 2,520 |
| Sch 2 17a | 3468: 14,400 + 27,350; 6418(g)(3): 2,000 | 43,750 |
| Sch 2 17z | PWA8933 3,000 + NPWA 1,200 | 4,200 |
| Sch 2 18 | 17a + 17z | 47,950 |
| Sch 2 19 | 1d column (l) | 10,000 |
| Sch 2 21 | 2,520 + 47,950 + 10,000 | 60,470 |
| 1040 15 | 480,000 − 15,750 | 464,250 |
| 1040 16 | rate schedule, single: 132,034.75 | 132,035 |
| 1040 17, 18 | Sch 2 line 3; 132,035 + 29,400 | 29,400; 161,435 |
| 1040 23, 24 | Sch 2 line 21; 161,435 + 60,470 | 60,470; 221,905 |
| 1040 25a, 25c, 25d | W-2 box 2; Form 8959 line 24 | 230,000; 2,520; 232,520 |
| 1040 34 | 232,520 − 221,905 | 10,615 |

Schedule 2 lines 17a, 17z and 19 together are 57,950, Form 4255 line 3 column (r).
