# takima — a made-up filer with a District of Columbia homebuyer credit left (synthetic)

Takima Brannock files as head of household with her son Oren, who is 9. She lives in Seattle, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She bought her first home in Washington, D.C., before 2012. Her 2024 Form 8859 carried $3,800 of the credit to 2025. She has one W-2 and takes the standard deduction. The return is federal only: Washington has no income tax.

The scenario fills every line of Form 8859 and its Tax Liability Limit Worksheet. With a child under 17, worksheet line 2 takes line 14 of Credit Limit Worksheet B (Schedule 8812 instructions), not Form 1040 line 19. The tax limits the credit, so line 4 carries $755 to 2026. Line 3 reaches Schedule 3 line 6h, and Schedule 8812 line 13 subtracts it. The form publishes no example with numbers; the limit tests are unit tests (`tests/unit/federal/8859/`).

Forms that file: Form 1040, Schedule 3, Schedule 8812, Form 8859.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Cascade Ferryworks Engineering | box 1 $56,000, box 2 $3,200 |
| Dependent | Oren, son, born 03/18/2016, lived with her all year |
| Her answer: 2024 Form 8859 line 4 | $3,800 |

No input is a PDF: the W-2 fact holds the boxes, and the carryforward is her answer.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 lines 1a, 9, 11a | W-2 box 1 | 56,000 |
| 1040 lines 12e, 15 | HOH standard deduction; 56,000 − 23,625 | 23,625; 32,375 |
| 1040 lines 16, 18 | tax table, 32,350–32,400, HOH: 1,700 + 12% × 15,375 | 3,545 |
| 8812 lines 5, 12 | one child × $2,200; no phase-out | 2,200 |
| Worksheet B lines 1, 2 | 8812 line 12; one child × $1,700 | 2,200; 1,700 |
| Worksheet B line 5 | (56,000 − 2,500) × 15% | 8,025 |
| Worksheet B lines 6, 11 | line 2 under $5,100: No | 0 |
| Worksheet B lines 12, 13, 14 | larger of 8,025 and 0; smaller of 1,700 and 8,025; 2,200 − 1,700 | 8,025; 1,700; 500 |
| 8859 worksheet line 1 | 1040 line 18 | 3,545 |
| 8859 worksheet line 2 | Worksheet B line 14 (no other listed credit) | 500 |
| 8859 worksheet line 3, line 2 | 3,545 − 500 | 3,045 |
| 8859 line 1 | her 2024 line 4 | 3,800 |
| 8859 line 3 | smaller of 3,800 and 3,045 | 3,045 |
| 8859 line 4 | 3,800 − 3,045 | 755 |
| Schedule 3 lines 6h, 7, 8 | 8859 line 3 | 3,045 |
| 8812 line 13 | Worksheet A: 3,545 − 0 − Worksheet B line 15 (6h 3,045) | 500 |
| 8812 line 14, 1040 line 19 | smaller of 2,200 and 500 | 500 |
| 1040 lines 20, 21, 22, 24 | 3,045; 500 + 3,045; 3,545 − 3,545 | 3,045; 3,545; 0; 0 |
| 8812 lines 16a, 17, 27; 1040 line 28 | 2,200 − 500; smaller of 1,700 and 1,700; smaller of 1,700 and 8,025 | 1,700 |
| 1040 lines 33, 34, 35a | 3,200 + 1,700 | 4,900 |

The credits use the whole tax. Her 2026 Form 8859 starts from $755.
