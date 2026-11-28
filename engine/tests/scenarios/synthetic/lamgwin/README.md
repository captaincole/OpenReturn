# lamgwin — a made-up holder of new markets investments (synthetic)

Lamgwin Harrowgate is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Lamgwin is a bridge engineer with one W-2. He bought seven qualified equity investments in community development entities (CDEs) for cash at original issue, and holds them directly. Six have a credit allowance date in 2025: credit years 1, 2 and 3 at 5%, and years 4, 5 and 7 at 6%. The seventh, Harbor Light, was made in 2018; its last credit allowance date was in 2024, so it has no row. He is also a general partner in Tallow Row Partners LP, whose K-1 passes him a new markets credit (box 15 code AD, $1,180.40). He materially participates there, and his direct investments are not passive, so no credit is passive. He takes the standard deduction. The return is federal only: Texas has no income tax.

Forms that file: Form 1040, Schedules 1, 2, 3 and E, Forms 8874, 3800, 6251 and 8959. Schedule E Part II lists the partnership with no income, so Schedule 1 shows 0. All six rows of Form 8874 line 1 are full, and lines 2 and 3 hold amounts.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Balcones Span Engineering Inc. | box 1 $520,000, box 2 $140,000, box 6 $10,420 |
| Form 8874-A, Riverbend Community Capital LLC | 03/14/2025, $40,000 |
| Form 8874-A, Prairie Gate Development Fund LP | 06/30/2024, $75,000 |
| Form 8874-A, Lantern Street CDE Inc. | 09/01/2023, $60,000 |
| Form 8874-A, Copperline Neighborhood Fund LLC | 11/15/2022, $120,000 |
| Form 8874-A, Blue Mesa Community Investors LP | 02/08/2021, $50,000 |
| Form 8874-A, Old Mill Renewal Partners LLC | 07/22/2019, $90,000 |
| Form 8874-A, Harbor Light Capital Corp. | 05/05/2018, $30,000 (credit period over) |
| K-1 (Form 1065), Tallow Row Partners LP, 00-0008808 | box 15 code AD $1,180.40; general partner |

Answers: each CDE's address (Form 8874-A prints none), not passive, still held.

## Documents

`docs/01-` to `docs/07-form-8874-a-*.pdf` come from a new generator, `tests/scenarios/documents/form8874A.ts`. `docs/08-schedule-k1-tallow-row-partners.pdf` comes from the existing `scheduleK1Form1065.ts`. Run `npx tsx tests/scenarios/synthetic/lamgwin/generate-docs.ts` from `engine/`.

## Compared with real examples

Form 8874-A is the first document of its type. It is an official IRS form, so the comparison is with the form itself:

- [Form 8874-A (Rev. December 2011)](https://www.irs.gov/pub/irs-pdf/f8874a.pdf): boxes 1 to 8 (CDE, parent, investor, date, amount), 9 (total allowable credit) and 10a to 10g (each year), the CDE official's signature. Ours has the same boxes, labels and order, and the signature block. It matched; nothing was added or removed.
- [IRS Audit Technique Guide, New Markets Tax Credit (2010)](https://www.cdfifund.gov/system/files/documents/atgnmtc.pdf): the CDE gives Form 8874-A to the investor within 60 days and keeps a copy; a separate form for each investment. Our signing dates are within 60 days of each investment.

Every fact the engine reads (boxes 1, 2, 7 and 8) is on ours. The address and the passive answer are the holder's answers.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8874 row 1 | 2025 is year 1: 40,000 × 5% | 2,000 |
| 8874 row 2 | year 2: 75,000 × 5% | 3,750 |
| 8874 row 3 | year 3: 60,000 × 5% | 3,000 |
| 8874 row 4 | year 4: 120,000 × 6% | 7,200 |
| 8874 row 5 | year 5: 50,000 × 6% | 3,000 |
| 8874 row 6 | year 7: 90,000 × 6% | 5,400 |
| Harbor Light | 2025 would be year 8 | no row |
| 8874 line 2 | K-1 code AD, $1,180.40 | 1,180 |
| 8874 line 3 | 24,350 + 1,180 | 25,530 |
| 1040 line 15 | 520,000 − 15,750 | 504,250 |
| 1040 line 16 | 57,231 + 35% × (504,250 − 250,525) | 146,035 |
| 6251 line 4, 6, 9 | 504,250 + 15,750; less 88,100; 26% × 239,100 + 28% × 192,800 | 520,000; 431,900; 116,150 |
| 3800 line 13 | 25% × (146,035 − 25,000) | 30,259 |
| 3800 line 16 | 146,035 − 116,150 | 29,885 |
| 3800 line 1i (e), (g); line 17, 38 | seven rows (six CDEs and the K-1), all allowed | 25,530 |
| Schedule 3 line 6a; 1040 line 20 | Form 3800 line 38 | 25,530 |
| 8959 line 7; Schedule 2 line 11; 1040 line 23 | 0.9% × (520,000 − 200,000) | 2,880 |
| 1040 line 22, 24 | 146,035 − 25,530; plus 2,880 | 120,505; 123,385 |
| 1040 line 25c | 8959 line 24: 10,420 − 1.45% × 520,000 | 2,880 |
| 1040 line 33, 34 | 140,000 + 2,880; less 123,385 | 142,880; 19,495 |
