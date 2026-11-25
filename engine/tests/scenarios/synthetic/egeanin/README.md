# egeanin — a California excess business loss (synthetic)

Egeanin Sarvane is single and lives in Long Beach, California, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

She manages a shipping line (a W-2) and owns and runs a shipyard, an S corporation. The shipyard's K-1 shows a $650,000 ordinary loss and a $5,000 long-term capital loss on stock the shipyard held in its trade. She also has a consulting business with a profit, a rental house and sea chart royalties that are investments, and a recovered bad debt of her closed chandlery on Schedule 1 line 8z.

Her business losses pass the $313,000 threshold, so federal Form 461 and California's FTB 3461 each figure an excess business loss. They differ by $3,000: Form 461 puts every capital loss on line 11, while FTB 3461 keeps a capital loss in the business loss when the business capital loss is $3,000 or more (ca-3461-inst-2025::sec::line-11::b01). Schedule CA line 8p takes the federal adjustment out (column B) and adds California's (column C), so California AGI is $3,000 above federal AGI. She has no carryover from 2024 (line 14b blank). The sister scenario `nisao` covers a carryover.

The documents have no PDFs: their facts are the boxes as they would print them. The answers the forms read: the rental is not a trade or business, the royalty is portfolio income, the $6,000 recovery is business income (line 8), the business capital loss is $5,000, and no FTB 3461 carryover from 2024.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Tarabon Coast Shipping, Inc. | box 1 $380,000; box 2 $80,000; box 6 $7,130; box 16 $380,000; box 17 $32,000 |
| Schedule C, Sarvane Marine Consulting | receipts $60,000; expenses $18,000 |
| 1099-DIV, Falme Bay Income Fund | box 1a $2,400; box 1b $2,000 |
| Schedule K-1 (Form 1120-S), Seanchan Dry Dock, Inc. | box 1 −$650,000; box 8a −$5,000; stock basis at the start $900,000 |
| Rental house, 12 Tanchico Street | rents $24,000; expenses $12,000; not a trade or business |
| Chart royalty | royalties $2,000; legal fees $3,500; portfolio |
| Schedule 1 line 8z | $6,000 bad debt recovery, business income (line 8) |
| Business capital gain answer | −$5,000 (the K-1 box 8a loss) |
| FTB 3461 carryover from 2024 | $0 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Sch D lines 12, 16, 21; 1040 line 7a | K-1 box 8a; loss limited to $3,000 | −5,000; −5,000; 3,000; −3,000 |
| Form 461 lines 2, 3, 5, 8, 9 | Schedule 1 line 3, 1040 line 7a, Schedule 1 line 5 (10,500 − 650,000), line 8 | 42,000; −3,000; −639,500; 6,000; −594,500 |
| Form 461 lines 10, 11 | rental income; royalty loss + the whole capital loss | 12,000; 4,500 |
| Form 461 lines 12–16 | 7,500; −7,500; −602,000; 313,000; −289,000 | Sch 1 line 8p 289,000 |
| 1040 lines 9, 11 | 380,000 + 2,400 − 3,000 − 302,500; less 563 | 76,900; 76,337 |
| FTB 3461 lines 2, 3, 5, 8 | Schedule CA lines 3, 7a, 5 (A − B + C, no column B or C); line 8 answer | 42,000; −3,000; −639,500; 6,000 |
| FTB 3461 line 9 | combine (::line-9::b01) | −594,500 |
| FTB 3461 line 10 | rental income (::line-10::b01) | 12,000 |
| FTB 3461 line 11 | royalty loss; the capital loss stays business, business loss $5,000 ≥ $3,000 (::line-11::b01) | 1,500 |
| FTB 3461 lines 12, 13 | 12,000 − 1,500; sign reversed | 10,500; −10,500 |
| FTB 3461 lines 14a, 14b, 14c | −594,500 − 10,500; no carryover; 14a + 14b | −605,000; blank; −605,000 |
| FTB 3461 lines 15, 16, 17 | single threshold; −605,000 + 313,000; no line 14b | 313,000; −292,000; blank |
| Sch CA line 8p A, B, C | Schedule 1 line 8p; column A; FTB 3461 line 16 positive (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04) | 289,000; 289,000; 292,000 |
| Sch CA line 9a B, C; line 27 B, C | the column totals | 289,000; 292,000 |
| 540 lines 13–17 | 76,337 − 289,000 + 292,000 | 76,337; 289,000; −212,663; 292,000; 79,337 |
| 540 lines 18, 19 | CA standard deduction; 79,337 − 5,706 | 5,706; 73,631 |

The other federal lines (Schedule SE, Form 8959, Form 8995-A, the tax) work as in `juilin`. FTB 3461 lines 4 and 6 are blank: there is no Form 4797 or Schedule F.
