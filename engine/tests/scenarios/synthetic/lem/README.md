# lem — a partner with a fiscal-year biofuel producer credit (synthetic)

Lem Harrowgate is single and lives in Sioux Falls, South Dakota. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Lem works for a grain elevator company (a W-2). He is also a general partner in a cellulosic ethanol plant. The partnership's tax year ran from July 1, 2024 to June 30, 2025. That year ends in Lem's 2025 tax year, so his 2025 return reports it. The plant's fuel sold from July to December 2024 still earned the biofuel producer credit, which ended with fuel sold or used after 2024. The K-1 reports his share in box 15 code I. He takes the standard deduction. The return is federal only: South Dakota has no income tax.

The scenario fills Form 6478 for an individual:

- Lines 1 and 2 are blank. They hold the credit of the taxpayer's own production, and a 2025 tax year has none. Nothing is added to income.
- Line 3: the K-1 credit. Line 4 goes to Form 3800 Part III line 4c, a specified credit, and to Schedule 3 line 6a.
- Lines 5 and 6 are for cooperatives, estates and trusts: blank.
- The decision `decisions.scope.must_file_6478` is true. The K-1 instructions let a partner report code I on Form 6478 line 3 or straight on Form 3800. Without the decision, Form 6478 does not file and every other value stays the same.

Simplifications: the K-1 prints no box 14 and no section 199A statement, so the partnership income has no self-employment tax and no QBI.

Forms that file: Form 1040, Schedules 1, 3 and E, Forms 3800 and 6478.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Prairie Elevator Co | box 1 $88,000; box 2 $11,500 |
| K-1, Big Sioux Cellulose Fuels LLC (00-0006478), July 1, 2024 to June 30, 2025 | box 1 $12,600; box 15 I $2,474 |
| Holding | general partner, materially participates; all at risk; basis at the start $40,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. It prints the 2024 form year and the fiscal-year dates in the header: a partnership whose year begins in 2024 issues the 2024 form. The generator draws the 2025 layout, and box 15 code I is the biofuel producer credit on both. The W-2 is its boxes as stated; no PDF is made.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 6478 lines 1, 2 | no qualifying sale or use in a 2025 tax year | blank |
| 6478 line 3 | K-1 box 15 code I | 2,474 |
| 6478 line 4 | line 2 (blank) + line 3 | 2,474 |
| 6478 lines 5, 6 | cooperatives, estates and trusts only | blank |
| Schedule E line 28 (k), 32, 41 | K-1 box 1, nonpassive | 12,600 |
| 1040 line 9, 11a | 88,000 + 12,600 | 100,600 |
| 1040 line 15 | 100,600 − 15,750 | 84,850 |
| 1040 line 16 | tax table, row 84,850–84,900: 5,578.50 + 22% × (84,875 − 48,475) | 13,587 |
| 3800 Part III line 4c (e), (g); line 5, 6 | the K-1 credit, not passive | 2,474 |
| 3800 line 13 | 25% of (13,587 − 25,000), not below 0 | 0 |
| 3800 lines 27, 29 | 13,587 − 0 | 13,587 |
| 3800 lines 30, 36, 37, 38 | smaller of 2,474 and 13,587 | 2,474 |
| Schedule 3 line 6a, 8; 1040 line 20 | 3800 line 38 | 2,474 |
| 1040 line 22, 24 | 13,587 − 2,474 | 11,113 |
| 1040 line 33, 34, 35a | 11,500; 11,500 − 11,113 | 11,500; 387 |
