# rand — a made-up hydrogen producer (synthetic)

Rand Kerrow is single and lives in Pasadena, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Rand owns a clean hydrogen production plant through a single-member LLC (Schedule C). It runs four processes, one in each emissions band. Part of its cost was financed by tax-exempt bonds. Construction began in May 2023, and the plant meets the prevailing wage and apprenticeship requirements. Rand sold $15,000 of the credit to an unrelated buyer under section 6418. He is also a general partner in a hydrogen fueling partnership; its Schedule K-1 (Form 1065) has box 1 income and the same credit in box 15 code Y. He takes the standard deduction and paid four estimated tax payments. The return is federal only: Texas has no income tax.

The scenario fills every line of Form 7210 except line A:

- Lines 6a to 6d take each process's kilograms in its band; line 7 adds column (c).
- Lines 8a to 8d reduce the credit by the bond share (5%, under the 15% cap).
- Line 5 is checked, so line 10 is line 9 times 5.
- Line 11 takes the K-1 credit; line 12 goes to Form 3800 Part III line 1g.
- Line 1 prints the registration number because of the transfer election; line 2 names the LLC.
- Line A(i) is unsupported: the box holds one rate, and the plant has four processes (QUESTIONS.md).

Form 3800 lists the plant's credit and the K-1's in Part V, with the $15,000 sale in column (f). The tentative minimum tax limits the credit to $9,650 on Schedule 3 line 6a; the rest carries forward.

The facility's answers are stated from its records: no information return reports them. Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 8959, 8995-A, 6251, 3800 and 7210.

## Inputs

| Input | Amounts |
| --- | --- |
| Business (Schedule C), Kerrow Hydrogen Works | receipts $486,000; expenses $176,200 |
| Facility processes | 0.38 kg CO2e/kg, 9,400 kg; 1.12, 6,300 kg; 2.05, 4,800 kg; 3.6, 3,600 kg |
| Bond financing | proceeds $120,000; capital account additions $2,400,000 |
| Credit transfer | sold $15,000 |
| K-1, Gulf Coast Hydrogen Partners LP (00-0017210) | box 1 $8,000; box 15 Y $2,750 |
| Estimated tax payments | 4 × $9,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 7210 line 6a | 9,400 × $0.637 = 5,987.80 | 5,988 |
| 7210 line 6b | 6,300 × $0.213 = 1,341.90 | 1,342 |
| 7210 line 6c | 4,800 × $0.159 = 763.20 | 763 |
| 7210 line 6d | 3,600 × $0.127 = 457.20 | 457 |
| 7210 line 7 | 8,550.10, rounded once | 8,550 |
| 7210 line 8a | 120,000 / 2,400,000 | 0.05 |
| 7210 line 8b, 8c, 8d | 8,550 × 0.05 = 427.50; × 0.15 = 1,282.50; smaller | 428; 1,283; 428 |
| 7210 line 9 | 8,550 − 428 | 8,122 |
| 7210 line 10 | line 5 checked: 8,122 × 5 | 40,610 |
| 7210 line 11, 12 | K-1 code Y; 40,610 + 2,750 | 2,750; 43,360 |
| Form 3800 line 1g (e), (f), (g) | 43,360; sold −15,000 | 43,360; −15,000; 28,360 |
| Schedule C line 31 | 486,000 − 176,200 | 309,800 |
| Schedule SE line 12 | 176,100 × 12.4% + 286,100 × 2.9% = 21,836 + 8,297 | 30,133 |
| 1040 line 11a | 309,800 + 8,000 − 15,067 | 302,733 |
| 1040 line 15 | 302,733 − 15,750 − 57,397 (Form 8995-A) | 229,586 |
| 1040 line 16 | 2025 single rates | 50,531 |
| Form 3800 line 14 | (229,586 + 15,750 − 88,100) × 26% | 40,881 |
| Form 3800 line 16, 38; Schedule 3 line 6a | 50,531 − 40,881 | 9,650 |
| 1040 line 22 | 50,531 − 9,650 | 40,881 |
| 1040 line 23 | 30,133 + 775 (Form 8959) | 30,908 |
| 1040 line 37 | 40,881 + 30,908 − 36,000 | 35,789 |
