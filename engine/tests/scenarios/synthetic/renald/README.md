# renald — a made-up partner with general business credits (synthetic)

Renald Fanwick is single and lives in San Angelo, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Renald is a structural engineer with one W-2. He works in three partnerships and materially participates in each. Their Schedules K-1 (Form 1065) report business income in box 1 and general business credits in box 15. Last year's Form 3800 carried four credits to 2025. He takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario fills Form 3800 for an individual:

- Part III: a research credit (line 1c) cut by the research credit limitation, two disabled access credits (line 1e) capped at $5,000 together, an empowerment zone credit (line 3), and two specified credits (lines 4b, 4h). Column (c) names the pass-through entity.
- Part IV: carryovers on lines 1e (two years), 3 and 4b. Two are marked changed from the original return, and one has $200 recaptured (decision A19).
- Part II: the tax limit stops the general credits (line 17 is less than line 6). The disabled access credit of the second K-1 carries $1,066 to 2026 (Part V column (k)).
- Part V: the two line 1e credits. Part VI: the two line 1e carryovers.
- Form 6251 files for line 14, and Schedule 3 line 6a takes line 38.

Simplifications: the K-1s print no box 14 and no section 199A statement, so there is no self-employment tax and no QBI deduction. The carryovers are stated answers: the product does not read last year's return yet (#79).

Forms that file: Form 1040, Schedules 1, 2, 3 and E, Forms 6251, 8959 and 3800.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Concho Valley Structural Group | box 1 $380,000, box 2 $92,000, box 5 $380,000, box 6 $6,440 |
| K-1, Coldwater Furniture Works LLC (00-0003801) | box 1 $85,000; box 15 K $3,000, M $25,000 |
| K-1, Riverbend Clinic Partners LLC (00-0003802) | box 1 $24,000; box 15 K $4,000, BA $1,800 |
| K-1, Pecos Trail Outfitters LLC (00-0003803) | box 1 $18,000; box 15 L $1,500, J $2,400 |
| Research credit answers (Coldwater) | not an eligible small business; taxable income attributable $80,000 |
| Carryovers (last year's return) | 1e: $900 (2022, changed), $1,100 (2023); 3: $700 (2024); 4b: $1,200 (2021, changed, $200 recaptured) |

## Documents

The three K-1s are PDFs in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. The paper K-1 has two rows in box 15, so each partnership reports two credits.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 9, 11a | 380,000 + Schedule 1 line 10 (85,000 + 24,000 + 18,000) | 507,000 |
| 1040 line 15 | 507,000 − 15,750 | 491,250 |
| 1040 line 16 | rate schedule: 57,231 + 35% × 240,725 | 141,485 |
| 6251 line 4, 6 | 491,250 + 15,750; less the 88,100 exemption | 507,000; 418,900 |
| 6251 line 7, 9 | 26% × 239,100 + 28% × 179,800 | 112,510 |
| 3800 line 7, 9, 11, 12 | 1040 line 16 + Schedule 2 line 1z (none); AMT 0; no other credits | 141,485 |
| 3800 line 13 | 25% × (141,485 − 25,000) | 29,121 |
| 3800 line 14, 15 | 6251 line 9; greater of 13 and 14 | 112,510 |
| 3800 line 16 | 141,485 − 112,510 | 28,975 |
| 3800 Part III 1c (e), (g) | smaller of 25,000 and 141,485 × 80,000 / 491,250 | 23,041 |
| 3800 Part III 1e (e), (g) | 3,000 + 4,000 capped at 5,000 | 5,000 |
| 3800 Part V rows 1, 2 (e) | 5,000 pro rata: 3/7, 4/7 | 2,143; 2,857 |
| 3800 Part III line 2 (e), (g); line 1 | 23,041 + 5,000 | 28,041 |
| 3800 Part IV 1e (f), line 6 (f); line 4 | 900 + 1,100 | 2,000 |
| 3800 line 6 | 28,041 + 2,000 | 30,041 |
| 3800 line 17 | smaller of 30,041 and 28,975 | 28,975 |
| 3800 line 18, 19 | 75% × 112,510; greater of 29,121 | 84,383 |
| 3800 line 20, 21 | 141,485 − 84,383; less 28,975 | 57,102; 28,127 |
| 3800 line 22, 25, 26 | Part III line 3 (e) 1,500 + Part IV line 3 (f) 700 | 2,200 |
| 3800 line 27, 28, 29 | 141,485 − 29,121; 28,975 + 2,200; 112,364 − 31,175 | 112,364; 31,175; 81,189 |
| 3800 line 30 | 2,400 + 1,800 | 4,200 |
| 3800 line 34 | Part IV 4b (f) 1,200 less (h) 200 (decision A19) | 1,000 |
| 3800 line 36, 37 | 4,200 + 1,000; smaller of 81,189 | 5,200 |
| 3800 line 38 | 31,175 + 5,200 | 36,375 |
| 3800 Part IV (g) | line 17 used first by the 2022 and 2023 carryforwards, all of lines 3 and 4b (4b: 1,200 − 200) | 2,000; 700; 1,000 |
| 3800 Part V (i)(1), (k) | 28,975 − 2,000 − 23,041 = 3,934 left: 2,143 to row 1, 1,791 to row 2 | row 1 2,143, 0; row 2 1,791, 1,066 |
| Schedule 3 line 6a, 7, 8; 1040 line 20, 21 | 3800 line 38 | 36,375 |
| 1040 line 22 | 141,485 − 36,375 | 105,110 |
| 1040 line 23, 24 | Additional Medicare Tax 0.9% × 180,000; 105,110 + 1,620 | 1,620; 106,730 |
| 1040 line 25d, 33 | 92,000 + 930 (Form 8959 line 24) | 92,930 |
| 1040 line 37 | 106,730 − 92,930 | 13,800 |
