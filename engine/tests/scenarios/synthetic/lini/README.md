# lini — a made-up parent who claims three credits again (synthetic)

Lini Thornbury is a head of household in Ocala, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She works at a veterinary clinic (one W-2, $50,000). She has three children: Mira, 8; Owen, born March 12, 2025; and Dara, 19, a full-time first-year college student. The IRS disallowed her 2023 EIC and child tax credit after an audit of a child's residency, and her 2022 AOTC. No ban. She now claims all three credits again, so the return attaches Form 8862 with Parts I to IV. The return is federal only: Florida has no income tax.

The scenario renders a filled Form 8862 with Section A (filers with a qualifying child). The sister scenario `ghealdan` fills Section B. The rules behind each line are unit tests (`tests/unit/federal/8862/`).

Forms that file: Form 1040, Schedules 3, EIC and 8812, Form 8863, Form 8862.

## Inputs

| Input | Values |
| --- | --- |
| W-2, Silver Springs Veterinary Clinic | box 1 $50,000, box 2 $2,400 |
| Form 1098-T, Marion State College (Dara) | box 1 $4,300, box 8 checked (no PDF: the boxes as printed) |
| Dependents | Mira (12 months), Owen (born 03/12/2025, 10 months), Dara (11 months, 304 days, full-time student) |
| Dara's 8863 answers | lines 23–26 No, Yes, No, No; spring $2,100, fall $2,200 + $250 books |
| EIC answers | not a nonresident, not anyone's qualifying child, denied in an earlier year, no ban |
| Form 8862 answers | line 3 No; CTC and AOTC denied in an earlier year, no ban |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8862 line 1 | the year of this return | 2025 |
| 8862 line 2 | each denied credit that the return claims | EIC, CTC/ACTC/ODC, AOTC checked |
| 8862 line 3 | the denial was about residency | No |
| 8862 line 4 | not anyone's qualifying child | No |
| 8862 lines 5a–5c | Schedule EIC children, in its order | Mira, Owen, Dara |
| 8862 line 6 | Section A | Yes |
| 8862 line 7 | Mira 12 months: 365; Owen born in 2025: 365; Dara: stated 304 | 365, 365, 304 |
| 8862 line 8 | Owen's birth | 03 / 12 |
| 8862 lines 9–11 | Section B, skipped | blank |
| 8862 lines 12a, 12b | Schedule 8812 children under 17 | Mira, Owen |
| 8862 line 13a | the other dependent | Dara |
| 8862 lines 14–17 | each child: lived with her, qualifies, dependent, citizen | Yes |
| 8862 lines 16–17, other dependent 1 | dependent, citizen | Yes |
| 8862 line 18a | the Form 8863 student | Dara |
| 8862 lines 19a, 19b | eligible; no AOTC in 4 earlier years | Yes; No |
| 1040 line 1a, 9, 11b | W-2 box 1 | 50,000 |
| 1040 line 12e, 14 | head of household standard deduction | 23,625 |
| 1040 line 15 | 50,000 − 23,625 | 26,375 |
| 1040 line 16, 18 | tax table, head of household: 1,700 + 12% × 9,375 | 2,825 |
| 8863 lines 27–30, 1, 7 | 4,000 + 250 capped: 2,000 + 25% × 2,000 | 2,500 |
| 8863 line 8, 1040 line 29 | 40% × 2,500 | 1,000 |
| 8863 lines 9, 19, Schedule 3 lines 3, 8, 1040 line 20 | 2,500 − 1,000, within the 2,825 tax | 1,500 |
| 8812 lines 4–8, 12 | 2 × 2,200 + 1 × 500 | 4,900 |
| 8812 lines 13, 14, 1040 line 19 | 2,825 − 1,500 | 1,325 |
| 8812 lines 16a, 16b, 17 | 4,900 − 1,325 = 3,575; 2 × 1,700 = 3,400 | 3,400 |
| 8812 lines 19, 20 | (50,000 − 2,500) × 15% | 7,125 |
| 8812 line 27, 1040 line 28 | smaller of 3,400 and 7,125 | 3,400 |
| 1040 lines 21, 22, 24 | 1,325 + 1,500 = 2,825; 2,825 − 2,825 | 2,825; 0; 0 |
| 1040 line 27a | EIC table, 50,000–50,050, three children | 2,428 |
| 1040 line 32 | 2,428 + 3,400 + 1,000 | 6,828 |
| 1040 lines 33–35a | 2,400 + 6,828 | 9,228 |
