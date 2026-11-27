# alar — a made-up owner of a low-income housing building and a K-1 credit (synthetic)

Alar Quillfeather is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Alar is a hydrologist with one W-2. He built Sagebrush Terrace, a 30-unit low-income housing building, and owns it by himself. Its credit period began in 2019, so 2025 is year 7. Two units that were low-income at the end of 2024 rent at market at the end of 2025. So the qualified basis decreased since last year (Form 8586 line 2 "Yes"), but it is still the first year's basis, so nothing is recaptured. He is also a limited partner in Juniper Flats Housing Partners LP, whose K-1 passes him a low-income housing credit (box 15 code D). He takes the standard deduction. The return is federal only: Nevada has no income tax.

This scenario shows the K-1 branch of Form 8586 (line 4), which `ewin` and `haral` cannot: each of them owns one building and has no K-1.

Forms that file: Form 1040, Schedules 1, 2, 3 and E, Forms 8609-A, 8586, 8582-CR, 3800 and 8959. Alar is not a real estate professional, so both credits are passive. He has no passive income, so Form 8582-CR allows the tax on $25,000 (Part IV, no income limit for a building placed in service after 1989) and carries the rest to 2026. Lines 6 and 7 of Form 8586 are blank: they are for estates and trusts.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Truckee Basin Hydrology Inc. | box 1 $230,000, box 2 $46,000, box 6 $3,605 |
| Form 8609, Sagebrush Terrace (made by `generate-docs.ts`) | BIN NV-19-00412; line 1b $64,800; line 2 9%; line 3a $720,000; line 7 $900,000; line 8a $720,000; first credit year 2019 |
| Building at the end of 2025 | 24 of 30 units, 21,000 of 25,000 square feet low-income; owned all year, 100% |
| K-1 (Form 1065), Juniper Flats Housing Partners LP, 00-0008587 (made by `generate-docs.ts`) | box 15 code D $4,350; limited partner |

## Documents

`docs/01-form-8609-sagebrush-terrace.pdf` and `docs/02-schedule-k1-juniper-flats-housing.pdf` come from the existing generators (`tests/scenarios/documents/form8609.ts`, `scheduleK1Form1065.ts`). No new kind of document.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8609-A line 2 | smaller of 24/30 = .8000 and 21,000/25,000 = .8400 | .8000 |
| 8609-A line 3 | 900,000 × .8000; not above line 8a, so no additions (lines 7 to 12 blank) | 720,000 |
| 8609-A line 6, 13, 15, 16, 18 | 720,000 × .0900; no grant; not more than 64,800; 100% | 64,800 |
| 8586 line 1 | one Form 8609-A | 1 |
| 8586 line 2 | item E "Yes"; BIN (i) | Yes; NV-19-00412 |
| 8586 line 3 | Form 8609-A line 18 | 64,800 |
| 8586 line 4 | K-1 box 15 code D | 4,350 |
| 8586 line 5 | 64,800 + 4,350 | 69,150 |
| 8586 line 6, 7 | an individual stops at line 5 | blank |
| 1040 line 11a, 15 | 230,000; less 15,750 | 230,000; 214,250 |
| 1040 line 16 | 40,199 + 32% × (214,250 − 197,300) | 45,623 |
| 8582-CR line 3a, 5, 7, 34 | Worksheet 3, two activities; line 6 is 0 | 69,150 |
| 8582-CR line 35, 37 | tax on 214,250 less tax on 189,250 (17,651 + 24% × 85,900 = 38,267) | 7,356 |
| 3800 line 4d (d), (g) | two rows: the building and the K-1 (column (c) 00-0008587) | 69,150; 7,356 |
| 3800 Part V lines 1, 2 | 7,356 split 64,800 : 4,350 | 6,893; 463 |
| 3800 line 13, 27 | 25% × (45,623 − 25,000) = 5,155.75; 45,623 − 5,156 | 5,156; 40,467 |
| 3800 line 38, Schedule 3 line 6a, 1040 line 20 | the smaller of 7,356 and 40,467 | 7,356 |
| 8959 line 7, Schedule 2 line 11, 1040 line 23 | 0.9% × (230,000 − 200,000) | 270 |
| 1040 line 22, 24 | 45,623 − 7,356; plus 270 | 38,267; 38,537 |
| 1040 line 25c | 8959 line 24: 3,605 − 1.45% × 230,000 | 270 |
| 1040 line 33, 34, 35a | 46,000 + 270; less 38,537 | 46,270; 7,733 |
