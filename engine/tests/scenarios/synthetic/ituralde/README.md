# ituralde — a made-up filer with two activities not fully at risk (synthetic)

Ituralde Varga is single and lives in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Ituralde has a W-2. He also has two activities with a loss and with amounts that are not at risk, so each files its own Form 6198:

- A partnership K-1 from a cattle ranch LLC he works in. His share of the LLC's nonrecourse debt is in his basis but not at risk. The at-risk limit held back $6,000 of his 2024 loss. His 2024 Form 6198 had Part III, so this year's Part III starts from last year's line 19b (boxes 15b, 16b, 18b).
- His own documentary film business (Schedule C). A distributor that shares in the film's profits lent part of the money, so he checks box 32b. Form 6198 has Part II (his adjusted basis) and Part III (the activity began after its effective date). Part III gives the larger amount at risk.

The K-1's allowed loss is split between this year's loss and the carried one in proportion. The carried part goes on its own "PYA" row, and line 27 is Yes. Column (f) of the K-1's row is checked. The business's allowed loss goes on Schedule C line 31. The rest of each loss carries to 2026. The return is federal only: Washington has no income tax. The published examples that check the rules are unit tests (`tests/unit/federal/6198/`).

Forms that file: Form 1040, Schedule 1, Schedule C, Schedule E, Form 6198 (two copies), Form 8995.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Arafel Freight Lines | box 1 $150,000, box 2 $26,000 |
| Schedule C, Varga Film Works | receipts $18,000; expenses $45,000; box 32b |
| Form 6198 answers, film business | line 6 $12,000, line 7 $5,000, line 9 $9,000; Part III began after the effective date, line 16 $21,000, line 18 $11,000 |
| K-1 (Form 1065), Kandor Ridge Cattle LLC | box 1 −$40,000, box 5 $420, box 19 code A $2,000; nonrecourse debt share $60,000 |
| Holding answers | materially participates; not all at risk; basis at start $90,000; contributed $30,000; at-risk loss carried from 2024 $6,000, all of it a box 1 ordinary loss |
| Form 6198 answers, ranch | 2024 line 19b $0; line 16 $30,000; line 18 $2,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 6198 (ranch) line 1 | box 1 −40,000 + carried −6,000 | −46,000 |
| 6198 (ranch) line 5 | lines 1–4 | −46,000 |
| 6198 (ranch) line 15, box b | 2024 line 19b | 0 |
| 6198 (ranch) line 16, box b; 17 | contribution; 0 + 30,000 | 30,000; 30,000 |
| 6198 (ranch) line 18, box b; 19a; 19b | distribution; 30,000 − 2,000 | 2,000; 28,000; 28,000 |
| 6198 (ranch) line 20; 21 | line 19b; smaller of 46,000 and 28,000 | 28,000; (28,000) |
| Allowed, carried part | 28,000 × 6,000 ÷ 46,000 | 3,652 |
| Allowed, this year's part | 28,000 − 3,652 | 24,348 |
| 6198 (film) line 1; 5 | 18,000 − 45,000 | −27,000 |
| 6198 (film) lines 6–10b | 12,000 + 5,000 = 17,000; − 9,000 | 8,000 |
| 6198 (film) line 15, box a | began after the effective date | 0 |
| 6198 (film) lines 16–19b, box a | 21,000 − 11,000 | 10,000 |
| 6198 (film) line 20; 21 | larger of 8,000 and 10,000; smaller of 27,000 and 10,000 | 10,000; (10,000) |
| Schedule C line 29; 31; 32b | 18,000 − 45,000; Form 6198 line 21 | −27,000; −10,000; checked |
| Schedule E line 27 | a loss not allowed in a prior year because of the at-risk rules | Yes |
| Schedule E row A (f); (i) | amounts not at risk; this year's allowed loss | checked; 24,348 |
| Schedule E row B "PYA" (i) | carried loss allowed now | 3,652 |
| Schedule E lines 29b (i), 31, 32, 41 | 24,348 + 3,652 | 28,000; 28,000; −28,000; −28,000 |
| Schedule 1 lines 3; 5; 10 | Schedule C; Schedule E | −10,000; −28,000; −38,000 |
| 1040 line 1a; 2b | W-2; K-1 box 5 | 150,000; 420 |
| 1040 line 8; 9; 11 | 150,000 + 420 − 38,000 | −38,000; 112,420; 112,420 |
| 1040 line 12e; 15 | single standard deduction; 112,420 − 15,750 | 15,750; 96,670 |
| 1040 line 16 | tax table, 96,650–96,700, single | 16,183 |
| 1040 line 24; 25a; 34 | 26,000 − 16,183 | 16,183; 26,000; 9,817 |
| 8995 lines 1i (c), 2, 16 | the allowed Schedule C loss is the QBI | −10,000; −10,000; (10,000) |
