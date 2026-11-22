# birgitte — a made-up filer who repays two transferred credits (synthetic)

Birgitte Solvang is single and lives in Bellevue, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2. In 2025 she bought a new electric sedan and a used electric crossover from dealers, and transferred each credit to the dealer at the time of sale. Her modified AGI is over both single limits ($150,000 new, $75,000 used) in 2025 and in 2024. So she no longer qualifies, and she repays both credits on Schedule 2. She takes the standard deduction. The return is federal only: Washington has no income tax.

The scenario renders Form 8936 Part I and Schedule 2 lines 1b and 1c. Parts II–V of Form 8936 stay blank. Schedule A (Form 8936) has no catalog in the engine, so it is not rendered; its steps are in the hand check. The scenario `elayne` covers the credits that stand.

Forms that file: Form 1040, Schedule 2, Form 8936.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Lakemont Robotics | box 1 $162,000, box 2 $40,000 |
| Seller report, new vehicle (`docs/01-seller-report-new-vehicle.pdf`) | maximum credit $7,500, transferred $7,500 |
| Seller report, used vehicle (`docs/02-seller-report-previously-owned-vehicle.pdf`) | sales price $19,250, transferred $4,000 |
| Answers | personal use; not resold; no earlier used-vehicle credit; 2024 AGI $155,000, single |

The two seller reports come from `generate-docs.ts` and the generator `tests/scenarios/documents/cleanVehicleSellerReport.ts`, with the values in `facts.ts`.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8936 line 1a, 2 | 1040 line 11a | 162,000 |
| Sch. A (new) line 8c | 162,000 over $150,000: go to 8d | — |
| Sch. A (used) line 13b | 162,000 over $75,000: go to 13c | — |
| 8936 line 3a, 4; line 5 | 2024 AGI; single | 155,000; S |
| Sch. A (new) line 8d | 155,000 over $150,000: Yes, line 4b, repay line 4a | 7,500 |
| Sch. A (used) line 13c | 155,000 over $75,000: Yes, line 4b, repay line 4a | 4,000 |
| Schedule 2 line 1b, 1c | Schedule A line 4a amounts | 7,500; 4,000 |
| Schedule 2 line 1z, 3; 1040 line 17 | 7,500 + 4,000 | 11,500 |
| 1040 line 15 | 162,000 − 15,750 | 146,250 |
| 1040 line 16 | single rate schedule: 1,192.50 + 4,386 + 12,072.50 + 24% × 42,900 | 27,947 |
| 1040 line 18, 22, 24 | 27,947 + 11,500 | 39,447 |
| 1040 line 25a, 33 | W-2 box 2 | 40,000 |
| 1040 line 34, 35a | 40,000 − 39,447 | 553 |
