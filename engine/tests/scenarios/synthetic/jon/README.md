# jon — a made-up clinical researcher with an orphan drug credit (synthetic)

Jon Tervale is single and lives in Bellevue, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Jon runs a clinical research practice (Schedule C). It pays for human clinical testing of three drugs that the FDA designated for rare diseases. He elects the reduced credit under section 280C, so his Schedule C expenses stay whole. Two study coordinators are reservists: the practice has a Form 8932 credit of $2,400, and $900 of it is on wages that are also in line 1. Jon is also a general partner in a drug development partnership. Its Schedule K-1 (Form 1065) reports business income in box 1 and an orphan drug credit in box 15 code Z. He takes the standard deduction and paid four estimated tax payments. The return is federal only: Washington has no income tax.

The scenario fills Form 8820 lines 1 to 4 and Part II:

- Line 1 adds the clinical wages, supplies, computer rental and contract testing (at 100%), with cents, then rounds.
- Line 2a checks "Yes" and takes 19.75% of line 1.
- Line 2b is the $900 of the Form 8932 credit; line 2c is line 2a less line 2b.
- Line 3 takes the K-1 credit, and line 4 goes to Form 3800 Part III line 1h.
- Lines 5 and 6 are for estates and trusts, so they stay blank.
- Part II lists the three drugs.

The other branch (no election, the Schedule C reduction, California) is the `eward` scenario.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 8820, 8959 and 8995-A. Form 6251 files because line 1h is not a specified credit (Form 3800 needs the tentative minimum tax).

## Inputs

| Input | Amounts |
| --- | --- |
| Practice (Schedule C), Tervale Clinical Research | receipts $820,000; wages $190,000; contract labor $88,000; supplies $46,000; machinery rent $9,000; other expenses $117,000 |
| Clinical testing expenses | wages $82,400.60; supplies $21,350.25; computer rental $4,800; contract testing $61,000 |
| Drugs | velmaprostat (DRU-2021-8104, 09/14/2021); orvanexib (DRU-2023-9417, 03/02/2023); talcimide (DRU-2024-10288, 11/20/2024) |
| Form 8932 credit (stated, line 1w) | $2,400; $900 on the same wages |
| K-1, Halvorn Rare Therapeutics LP (00-0008820) | box 1 $25,000; box 15 Z $4,250 |
| Estimated tax payments | 4 × $15,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. The clinical testing amounts, the designations and the Form 8932 credit are stated answers from the practice's books and the FDA letters: no official form holds them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8820 line 1 | 82,400.60 + 21,350.25 + 4,800 + 61,000 = 169,550.85 | 169,551 |
| 8820 line 2a | 169,551 × 0.1975 = 33,486.32; "Yes" checked | 33,486 |
| 8820 line 2b | stated | 900 |
| 8820 line 2c | 33,486 − 900 | 32,586 |
| 8820 line 3 | K-1 code Z | 4,250 |
| 8820 line 4 | 32,586 + 4,250 | 36,836 |
| Schedule C line 26, 22 | the election: no reduction | 190,000; 46,000 |
| Schedule C line 31 | 820,000 − 450,000 | 370,000 |
| Schedule SE line 12, 13 | 176,100 × 12.4% + 341,695 × 2.9% = 21,836 + 9,909; half | 31,745; 15,873 |
| 1040 line 9, 11a | 370,000 + 25,000; less 15,873 | 395,000; 379,127 |
| 1040 line 13a | 20% of (370,000 − 15,873) = 70,825.40 | 70,825 |
| 1040 line 15 | 379,127 − 15,750 − 70,825 | 292,552 |
| 1040 line 16 | 57,231 + 35% × (292,552 − 250,525) | 71,940 |
| Form 3800 line 1h (e) | Form 8820 line 4 | 36,836 |
| Form 3800 line 1w (e) | stated | 2,400 |
| Form 3800 line 14 | Form 6251 tentative minimum tax | 57,253 |
| Form 3800 line 16, 17, 38 | 71,940 − 57,253 | 14,687 |
| Schedule 3 line 6a, 8; 1040 line 20 | Form 3800 line 38 | 14,687 |
| 1040 line 22 | 71,940 − 14,687 | 57,253 |
| 1040 line 23 | SE tax 31,745 + Additional Medicare Tax 1,275 | 33,020 |
| 1040 line 24, 33, 37 | 57,253 + 33,020; payments 60,000; owed | 90,273; 60,000; 30,273 |

Form 3800 carries $22,149 of the practice's line 1h credit forward (Part V column (k)).
