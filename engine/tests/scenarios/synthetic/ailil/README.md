# ailil — three canceled debts and Form 982 (synthetic)

Ailil Corvane is single and farms wheat and grain sorghum near Hereford, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

Three creditors canceled debts in 2025. Each sent a Form 1099-C (`docs/01` to `docs/03`, made by `generate-docs.ts`):

- A personal credit card, settled in March while she was insolvent by $15,000.
- Her home mortgage, reduced by $40,000 in June. She still lives in the home.
- Her farm operating loan, restructured in October while she was solvent.

She elects line 5 ($4,000 of depreciable basis first) and line 3 (her lots held for sale count as depreciable). The scenario covers Form 982 lines 1b, 1c, 1e, 2, 3, 5, 7, 8, 9, 10b, 11a to 11c, 12 and 13, and Schedule 1 line 8c. `berowyn` covers line 10a and California.

## Inputs

| Input | Amounts |
| --- | --- |
| Farm (Schedule F) | sales $96,000, expenses $67,800 |
| Capital loss carryover from 2024 | $8,000 long-term |
| 1099-C, Lone Star Card Services | box 2 $30,000 (box 3 $1,840 interest included) |
| 1099-C, Caprock Home Lending | box 2 $40,000 |
| 1099-C, Panhandle Farm Credit | box 2 $48,000 |
| Insolvency Worksheet, March 18 | liabilities $405,000, assets $390,000 |
| Tax attributes after the 2025 tax | general business credit $1,500, minimum tax credit $1,000, net capital loss $5,000, passive loss $6,000 and credit $400, foreign tax credit $800 |
| Basis at the start of 2026 | depreciable $20,000, lots for sale $6,000, other $290,000 (farm land $12,000, other business $4,000) |
| Home | loan $260,000, all qualified; basis $210,000 |

The capital loss attribute matches the return: $8,000 carried in, $3,000 used on Schedule D, $5,000 left. The credit and passive carryovers are stated from her records; the scenario does not hold the earlier-year forms that made them (QUESTIONS.md in `engine/src/federal/982`, first proposal).

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 982 line 1b | insolvency $405,000 − $390,000 = $15,000; the card takes it (`line-1b::b01`) | checked |
| 982 line 1e | loan $260,000 all qualified; $40,000 − $0 nonqualified (`line-1e::b03`) | checked |
| 982 line 1c | farm debt, solvent; limit below | checked |
| 982 line 2 | 15,000 + 40,000 + 48,000 | 103,000 |
| 982 line 3 | elected; "Any other debt" path | Yes |
| 982 line 5 | first pass: the $4,000 elected, depreciable basis 20,000 + 6,000 | 4,000 |
| 982 line 7 | 15,000 − 4,000 = 11,000 left; 3 × 1,500 = 4,500 | 4,500 |
| 982 line 8 | 6,500 left; 3 × 1,000 | 3,000 |
| 982 line 9 | 3,500 in the first pass; farm pass 1,500 more of the 5,000 | 5,000 |
| 982 farm limit | 1,500 + (6,000 + 3 × 400) + 3 × 800 + (26,000 − 4,000) + 12,000 + 4,000 = 49,100 ≥ 48,000 | all excluded |
| 982 line 11a | 26,000 − 4,000 | 22,000 |
| 982 line 11b | farm land | 12,000 |
| 982 line 11c | other business property | 4,000 |
| 982 line 12 | 6,000 + 3 × 400 | 7,200 |
| 982 line 13 | 48,000 − 1,500 − 22,000 − 12,000 − 4,000 − 7,200 | 1,300 |
| 982 line 10b | smaller of 40,000 and the $210,000 basis | 40,000 |
| 982 lines 1a, 1d, 4, 6, 10a | nothing applies; the first pass ends before line 10a | blank |
| Schedule 1 line 8c | card 30,000 − 15,000 excluded | 15,000 |
| Schedule 1 line 9 | line 8c | 15,000 |
| Schedule 1 line 10 | farm 28,200 + 15,000 | 43,200 |
| 1040 line 8 | Schedule 1 line 10 | 43,200 |
| 1040 line 9 | 43,200 − 3,000 (line 7a) | 40,200 |
| 1040 line 11a | 40,200 − 1,992 (half of SE tax) | 38,208 |
| Form 8995 line 15 | smaller of 20% × 26,208 = 5,242 and 20% × (38,208 − 15,750) = 4,492 | 4,492 |
| 1040 line 15 | 38,208 − 15,750 − 4,492 | 17,966 |
| 1040 line 16 | tax table 17,950–18,000 single: 1,192.50 + 12% × 6,050 = 1,918.50 | 1,919 |
| 1040 line 24 | 1,919 + 3,984 SE tax | 5,903 |

## Compared with real examples

The 1099-C generator (`engine/tests/scenarios/documents/form1099C.ts`) is the first of its type. It was compared with:

- [Form 1099-C, Rev. April 2025](https://www.irs.gov/pub/irs-pdf/f1099c.pdf), the official form. Same boxes and labels: creditor, the two TINs, debtor, account number, boxes 1 to 7. Ours prints Copy B only, with no VOID or CORRECTED box.
- [Form 1099-C, 2022](https://irs.gov/pub/irs-prior/f1099c--2022.pdf), the earlier revision. The same seven boxes in the same places.
- [Pub. 4681 (2025)](https://www.irs.gov/publications/p4681), the car example: a 1099-C "showing $1,500 in box 2 ... and $7,000 in box 7". Ours prints box 7 the same way for `berowyn`'s car.

The debtor's TIN prints masked to its last four digits, as creditors may do on Copy B. Every name, address and number is made up.
