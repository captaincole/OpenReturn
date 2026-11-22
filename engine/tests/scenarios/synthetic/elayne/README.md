# elayne — a made-up couple who bought two electric cars (synthetic)

Elayne and Gareth Marwick are married and file jointly. They live in Round Rock, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Each spouse has one W-2. In 2025 they bought a new electric SUV and a used electric hatchback from dealers. They use both cars for personal driving only. They kept both credits for the return: no credit went to a dealer. Their 2025 modified AGI is over the $150,000 joint limit for a used vehicle, but their 2024 AGI is under it, so both credits stand. They take the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders Form 8936 Parts I, III and IV. Lines 3a–5 print because the used vehicle reaches Schedule A line 13c. Schedule A (Form 8936) has no catalog in the engine, so it is not rendered; its lines are in the hand check. The published examples that check the rules are unit tests (`tests/unit/federal/8936/`).

Forms that file: Form 1040, Schedule 3, Form 8936.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Brushy Creek Analytics (Elayne) | box 1 $96,400, box 2 $9,800 |
| W-2, Hill Country Water District (Gareth) | box 1 $62,000, box 2 $6,100 |
| Seller report, new vehicle (`docs/01-seller-report-new-vehicle.pdf`) | maximum credit $7,500, no transfer, sold 2025-03-10, placed in service 2025-03-14 |
| Seller report, used vehicle (`docs/02-seller-report-previously-owned-vehicle.pdf`) | sales price $14,600, no transfer, sold 2025-06-20, placed in service 2025-06-21 |
| Answers | 0% business use; not resold; no earlier used-vehicle credit; nobody can claim them; 2024 AGI $142,000, filed jointly |

The two seller reports come from `generate-docs.ts` and the generator `tests/scenarios/documents/cleanVehicleSellerReport.ts`, with the values in `facts.ts`.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 9, 11a | 96,400 + 62,000 | 158,400 |
| 1040 line 15 | 158,400 − 31,500 | 126,900 |
| 1040 line 16, 18 | MFJ rate schedule: 2,385 + 8,772 + 22% × 29,950 | 17,746 |
| 8936 line 1a, 2 | 1040 line 11a | 158,400 |
| Sch. A (new) line 8c | 158,400 not over $300,000: skip 8d | — |
| Sch. A (used) line 13b | 158,400 over $150,000: go to 13c | — |
| 8936 line 3a, 4 | 2024 AGI | 142,000 |
| 8936 line 5 | 2024 filing status | MFJ |
| Sch. A (used) line 13c | 142,000 not over $150,000: eligible | — |
| Sch. A (new) lines 9, 10, 11, 12 | 7,500; 0%; 0; 7,500 − 0 | 7,500 |
| 8936 line 6, 8 | Schedule A line 11; line 6 + line 7 (blank) | 0; 0 |
| 8936 line 9 | Schedule A line 12 | 7,500 |
| Sch. A (used) lines 14, 15, 16, 17 | 14,600; 30% = 4,380; 4,000; smaller | 4,000 |
| 8936 line 14 | Schedule A line 17 | 4,000 |
| 8936 line 15 | 1040 line 18 | 17,746 |
| 8936 line 16 | Schedule 3 lines 1–4, 5b, 6d, 6l: none | 0 |
| 8936 line 17, 18 | 17,746 − 0; smaller of 4,000 and 17,746 | 17,746; 4,000 |
| 8936 line 10 | 1040 line 18 | 17,746 |
| 8936 line 11 | Schedule 3 line 6m | 4,000 |
| 8936 line 12, 13 | 17,746 − 4,000; smaller of 7,500 and 13,746 | 13,746; 7,500 |
| Schedule 3 line 6f, 6m | 8936 lines 13, 18 | 7,500; 4,000 |
| Schedule 3 line 7, 8; 1040 line 20, 21 | 7,500 + 4,000 | 11,500 |
| 1040 line 22, 24 | 17,746 − 11,500 | 6,246 |
| 1040 line 25a, 33 | 9,800 + 6,100 | 15,900 |
| 1040 line 34, 35a | 15,900 − 6,246 | 9,654 |
