# isolde — a made-up couple adopting three children (synthetic)

Isolde and Tobiah Albescu are married, file jointly, and live in Houston, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

They have two W-2s and a 1099-INT. Isolde's employer has an adoption assistance program and paid $15,500 of benefits (W-2 box 12 code T). They take the standard deduction. The return is federal only: Texas has no income tax.

They adopt or try to adopt three children:

- **Juniper**, a U.S. child with special needs, adoption final in 2025. A 2024 Form 8839 was filed for her (Part III only).
- **Ines**, a foreign child (non-Hague), adoption final in 2025. Every year's expenses count.
- **Rowan**, a U.S. child whose adoption is not final at the end of 2025. Only the 2024 expenses count now. The 2023 expenses were claimed in 2024.

The children are not claimed as dependents. With a qualifying child under 17, Schedule 8812 sends the filer to its Credit Limit Worksheet B, which the engine does not model (Form 8839 line 17 is then unsupported).

The scenario fills almost every line of Form 8839: both phase-outs, the refundable credit (Form 1040 line 30), the nonrefundable credit (Schedule 3 line 6c) and the taxable benefits (Form 1040 line 1f). Published examples that check the rules are unit tests (`tests/unit/federal/8839/`).

Forms that file: Form 1040, Schedule B, Schedule 2, Schedule 3, Form 8839, Form 8960.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Larkspur Biomedical (Isolde) | box 1 $168,000, box 2 $31,000, box 5 $183,500, box 12 code T $15,500 |
| W-2, Gulf Arc Engineering (Tobiah) | box 1 $64,000, box 2 $7,200 |
| 1099-INT, Bayou Treasury Direct Savings | box 1 $34,000 |
| Juniper | special needs, final 2025; paid 2025 $1,800; prior form lines 3 + 6 = 0, lines 20 + 24 = $2,000; 2025 benefits $3,000 |
| Ines | foreign, final 2025; paid before 2024 $4,200, 2024 $3,850.40, 2025 $2,975.35; 2025 benefits $12,500 |
| Rowan | U.S., not final; paid 2024 $6,820, 2025 $3,100; prior form lines 3 + 6 = $2,400 |
| Credit carryforward from 2024 | $1,150 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8839 line 2 (each) | $17,280 | 17,280 |
| 8839 line 3 | Yes; Juniper 0, Ines 0, Rowan 2,400 | 0; 0; 2,400 |
| 8839 line 4 | line 2 − line 3 | 17,280; 17,280; 14,880 |
| 8839 line 5, Juniper | special needs, final 2025: 17,280 − 0 | 17,280 |
| 8839 line 5, Ines | foreign, final 2025: 4,200 + 3,850.40 + 2,975.35 = 11,025.75 | 11,026 |
| 8839 line 5, Rowan | not final: 2024 only | 6,820 |
| 8839 line 6 | smaller of 4 or 5 | 17,280; 11,026; 6,820 |
| 8839 line 7 | Form 1040 line 11b | 269,221 |
| 8839 line 8 | Yes: 269,221 − 259,190 | 10,031 |
| 8839 line 9 | 10,031 / 40,000 = 0.250775 | 0.251 |
| 8839 line 10 | 17,280 × 0.251 = 4,337.28; 11,026 × 0.251 = 2,767.53; 6,820 × 0.251 = 1,711.82 | 4,337; 2,768; 1,712 |
| 8839 line 11a | line 6 − line 10 | 12,943; 8,258; 5,108 |
| 8839 line 11b | smaller of 11a or 5,000 | 5,000; 5,000; 5,000 |
| 8839 line 11c, 13 | add 11b | 15,000 |
| 8839 line 12 | add 11a | 26,309 |
| 8839 line 14 | 26,309 − 15,000 | 11,309 |
| 8839 line 15, 16 | carryforward 1,150; 11,309 + 1,150 | 1,150; 12,459 |
| 8839 line 17 | smaller of 12,459 and 42,747 − 0 (worksheet) | 12,459 |
| 8839 line 18 | smaller of 16 or 17 | 12,459 |
| 8839 line 19 (each) | $17,280 | 17,280 |
| 8839 line 20 | Yes; Juniper 2,000 | 2,000; 0; 0 |
| 8839 line 21 | line 19 − line 20 | 15,280; 17,280; 17,280 |
| 8839 line 22, 23 | code T split by child | 3,000; 12,500; 0; total 15,500 |
| 8839 line 24 | Juniper: special needs, final 2025, program: line 21; else smaller of 21 or 22 | 15,280; 12,500; 0 |
| 8839 line 25 | worksheet: 232,000 + 15,500 + 34,000 − 0 | 281,500 |
| 8839 line 26 | Yes: 281,500 − 259,190 | 22,310 |
| 8839 line 27 | 22,310 / 40,000 = 0.55775 | 0.558 |
| 8839 line 28 | 15,280 × 0.558 = 8,526.24; 12,500 × 0.558 = 6,975 | 8,526; 6,975; 0 |
| 8839 line 29, 30 | line 24 − line 28; add | 6,754; 5,525; 0; total 12,279 |
| 8839 line 31 | No: 15,500 − 12,279 | 3,221 |
| 1040 line 1a | W-2 box 1, both | 232,000 |
| 1040 line 1f, 1z | 8839 line 31; 232,000 + 3,221 | 3,221; 235,221 |
| 1040 line 9, 11b | 235,221 + 34,000 interest | 269,221 |
| 1040 line 15 | 269,221 − 31,500 | 237,721 |
| 1040 line 16, 18 | 237,721 × 24% − 14,306 = 42,747.04 | 42,747 |
| Schedule 3 lines 6c, 7, 8; 1040 lines 20, 21 | 8839 line 18 | 12,459 |
| 1040 line 22 | 42,747 − 12,459 | 30,288 |
| Form 8960 line 17; 1040 line 23 | 3.8% of the smaller of 34,000 and 269,221 − 250,000 = 19,221: 730.40 | 730 |
| 1040 line 24 | 30,288 + 730 | 31,018 |
| 1040 line 30, 32 | 8839 line 13 | 15,000 |
| 1040 line 33 | 38,200 withheld + 15,000 | 53,200 |
| 1040 line 34, 35a | 53,200 − 31,018 | 22,182 |
