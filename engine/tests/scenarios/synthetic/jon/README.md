# jon — a made-up clinical researcher with an orphan drug credit (synthetic)

Jon Tervale is single and lives in Bellevue, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Jon runs a clinical research practice (Schedule C). It pays for human clinical testing of three drugs that the FDA designated for rare diseases. He elects the reduced credit under section 280C, so the orphan drug credit lowers no Schedule C expense. Two study coordinators are reservists: the practice has a Form 8932 credit of $2,400, and $900 of it is on wages that are also in line 1. The Form 8932 credit lowers the practice's Schedule C wages (line 26). Jon is also a general partner in a drug development partnership. Its Schedule K-1 (Form 1065) reports business income in box 1 and an orphan drug credit in box 15 code Z. He takes the standard deduction and paid four estimated tax payments. The return is federal only: Washington has no income tax.

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
| Schedule C line 26 | 190,000 less the Form 8932 credit 2,400 (the election: no orphan drug reduction) | 187,600 |
| Schedule C line 22 | the election: no reduction | 46,000 |
| Schedule C line 31 | 820,000 − 447,600 | 372,400 |
| Schedule SE line 4a | 372,400 × 92.35% = 343,911.40 | 343,911 |
| Schedule SE line 12, 13 | 176,100 × 12.4% + 343,911 × 2.9% = 21,836 + 9,973; half of 31,809 = 15,904.50 | 31,809; 15,905 |
| 1040 line 9, 11a | 372,400 + 25,000; less 15,905 | 397,400; 381,495 |
| 1040 line 13a | 20% of (372,400 − 15,905) = 71,299 | 71,299 |
| 1040 line 15 | 381,495 − 15,750 − 71,299 | 294,446 |
| 1040 line 16 | 57,231 + 35% × (294,446 − 250,525) = 72,603.35 | 72,603 |
| Form 6251 line 4, 6, 7 | 294,446 + 15,750; less 88,100; × 26% = 57,744.96 | 310,196; 222,096; 57,745 |
| Form 3800 line 1h (e) | Form 8820 line 4 | 36,836 |
| Form 3800 line 1w (e) | stated | 2,400 |
| Form 3800 line 13 | 25% × (72,603 − 25,000) = 11,900.75 | 11,901 |
| Form 3800 line 14 | Form 6251 tentative minimum tax | 57,745 |
| Form 3800 line 16, 17, 38 | 72,603 − 57,745 | 14,858 |
| Schedule 3 line 6a, 8; 1040 line 20 | Form 3800 line 38 | 14,858 |
| 1040 line 22 | 72,603 − 14,858 | 57,745 |
| 1040 line 23 | SE tax 31,809 + Additional Medicare Tax 0.9% × (343,911 − 200,000) = 1,295 | 33,104 |
| 1040 line 24, 33, 37 | 57,745 + 33,104; payments 60,000; owed | 90,849; 60,000; 30,849 |

Form 3800 applies the K-1's $4,250 first, then $10,608 of the practice's line 1h credit, and carries $21,978 forward (Part V line 2 column (k)).
