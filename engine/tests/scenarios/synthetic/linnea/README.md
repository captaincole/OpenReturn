# linnea — a made-up holder of a Mortgage Credit Certificate (synthetic)

Linnea Castellano is single and lives in Tampa, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2 and one Form 1098. A county housing agency issued her a Mortgage Credit Certificate (MCC) at a 25% credit rate. Her 2024 Form 8396 carried credit forward from 2022, 2023 and 2024. She also put insulation in her attic (Form 5695 Part II). She itemizes. The return is federal only: Florida has no income tax.

The scenario fills every line of Form 8396 except the header address (her home is the address on the return). It checks that line 3 reduces Schedule A line 8a, that line 9 reaches Schedule 3 line 6g, and that the credit ends at Form 1040 line 20. The published examples that check the rules are unit tests (`tests/unit/federal/8396/`).

Forms that file: Form 1040, Schedule A, Schedule 3, Form 5695, Form 8396.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Harborview Dental Group | box 1 $36,000, box 2 $2,400 |
| Form 1098, Pelican State Mortgage | box 1 $11,520, box 2 $228,400, box 3 06/14/2021 |
| MCC, Gulf Coast Housing Finance Authority (`docs/01-mortgage-credit-certificate.pdf`) | rate 25%, certified indebtedness $200,000 |
| Her answer: the loan's original amount | $240,000 |
| 2024 Form 8396 carryforwards | 2022 $300, 2023 $450, 2024 $600 |
| Insulation invoice | $1,200 |
| Schedule A answers | real estate tax $4,100, cash gifts $3,000 |

The Mortgage Credit Certificate comes from `generate-docs.ts` and the generator `tests/scenarios/documents/mortgageCreditCertificate.ts`, with the values in `facts.ts`. It prints the issuer, number, date, rate and certified indebtedness. The loan's original amount (her loan papers) and the interest (Form 1098 box 1) are in the same fact but not on the certificate. The other inputs have no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8396 line 1 | 11,520 × 200,000 / 240,000 (loan larger than the certified indebtedness) | 9,600 |
| 8396 line 2 | the certificate rate | 25 |
| 8396 line 3 | 9,600 × 25% = 2,400; above 20%, at most $2,000 | 2,000 |
| 8396 lines 4, 5, 6 | the 2024 Form 8396 lines 16, 14, 17 | 300; 450; 600 |
| 8396 line 7 | 2,000 + 300 + 450 + 600 | 3,350 |
| Schedule A line 8a | 11,520 − 8396 line 3 | 9,520 |
| Schedule A line 17 | 4,100 + 9,520 + 3,000 | 16,620 |
| 1040 line 15 | 36,000 − 16,620 | 19,380 |
| 1040 lines 16, 18 | tax table, 19,350–19,400, single | 2,087 |
| 5695 lines 18b, 32 | 1,200 × 30%; under the $1,200 limit and the tax | 360 |
| Worksheet line 1 | 1040 line 18 | 2,087 |
| Worksheet line 2 | 5695 line 32 (no child tax credit, no other listed credit) | 360 |
| Worksheet line 3, 8396 line 8 | 2,087 − 360 | 1,727 |
| 8396 line 9 | smaller of 3,350 and 1,727 | 1,727 |
| 8396 lines 10, 11 | 2,000 + 300; line 7 | 2,300; 3,350 |
| 8396 lines 12, 13 | larger of 1,727 and 2,300; 3,350 − 2,300 | 2,300; 1,050 |
| 8396 lines 14, 15 | smaller of 600 and 1,050; 1,050 − 600 | 600; 450 |
| 8396 line 16 | smaller of 450 and 450 | 450 |
| 8396 line 17 | 2,000 − 1,727 | 273 |
| Schedule 3 lines 5b, 6g, 7, 8 | 360; 1,727; 1,727; 360 + 1,727 | 360; 1,727; 1,727; 2,087 |
| 1040 lines 20, 21, 22, 24 | Schedule 3 line 8; 2,087; 2,087 − 2,087 | 2,087; 2,087; 0; 0 |
| 1040 lines 34, 35a | all withholding refunded | 2,400 |

The 2022 credit ($300) is not used and expires: it has no 2026 line. Her 2026 carryforwards are $600 (2024), $450 (2023) and $273 (2025).
