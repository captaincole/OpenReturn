# androl — Form 461 files with no excess business loss (synthetic)

Androl and Pevara Tarnwick are married, file jointly and live in Galveston, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Androl is a limited partner in a ferry partnership and works in it more than 500 hours a year, so he materially participates (test 1) and its loss is nonpassive. A limited partner has no self-employment earnings, so box 14 is blank. The K-1 has no section 199A statement, so no QBI form files. The couple also carries a long-term capital loss from 2024.

This is the second side of Form 461 next to `juilin`. The $400,000 loss on line 5 is more than $156,500, so the form must file (irs-461-inst-2025::sec::who-must-file::b01, test (ii)). The net business loss is under the $626,000 joint threshold, so line 16 is positive: there is no excess business loss, and Schedule 1 line 8p stays blank. A single filer with the same amounts would have an excess of $87,000. The return is federal only: Texas has no income tax.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Gulf Ward Shipwrights, Inc. (Androl) | box 1 and 5 $380,000; box 2 $70,000; box 6 $7,130 |
| W-2, Tower Point Harbor Authority (Pevara) | box 1 and 5 $190,000; box 2 $30,000; box 6 $2,755 |
| Schedule K-1 (Form 1065), Black Tower Ferry Partners LP | limited partner; box 1 −$400,000; no statement |
| Holding answers | Androl's K-1; material participation; all at risk; basis at the start $700,000 |
| Capital loss carryover from 2024 | long-term $20,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Partner's basis worksheet | 700,000 less the 400,000 loss; the loss is within basis and at risk | 300,000 left |
| Sch E line 28 A (i); lines 29b (i), 31, 32, 41 | nonpassive loss (irs-1065k1-inst-2025::sec::income-loss::b01) | 400,000; −400,000 |
| Sch D lines 14, 15, 16, 21 | the carryover; the loss is limited to $3,000 (irs-1040sd-inst-2025, line 21) | 20,000; −20,000; −20,000; 3,000 |
| 1040 line 7a; Sch 1 lines 5, 10 | | −3,000; −400,000; −400,000 |
| 461 lines 3, 5 | Form 1040 line 7a and Schedule 1 line 5 (irs-461-inst-2025::sec::line-3::b01, ::line-5::b01) | −3,000; −400,000 |
| 461 line 9 | lines 1 to 8 combined (::line-9::b01) | −403,000 |
| 461 line 10 | no income on lines 1 to 8 is from outside a trade or business | blank |
| 461 line 11 | the capital loss on line 3 is added back (::line-3::b01, ::line-11::b01) | 3,000 |
| 461 lines 12, 13 | 0 − 3,000; sign reversed | −3,000; 3,000 |
| 461 lines 14, 15, 16 | −403,000 + 3,000; joint threshold (::who-must-file::b02); −400,000 + 626,000 | −400,000; 626,000; 226,000 |
| Sch 1 line 8p | line 16 is not less than zero (irs-461-inst-2025::sec::line-16::b01) | blank |
| 1040 lines 1z, 9, 11a | 380,000 + 190,000; 570,000 − 3,000 − 400,000 | 570,000; 167,000; 167,000 |
| 1040 lines 12e, 15 | joint standard deduction | 31,500; 135,500 |
| 1040 line 16 | rate schedule: 2,385 + 8,772 + 22% of (135,500 − 96,950) | 19,638 |
| 8959 lines 6, 7 | 570,000 − 250,000; 0.9% | 320,000; 2,880 |
| 8959 lines 19, 21, 22 | 7,130 + 2,755; 1.45% of 570,000; the difference | 9,885; 8,265; 1,620 |
| 8960 lines 4a, 4b, 5a, 8, 13 | Schedule 1 line 5, taken out as a nonpassive business loss; line 7a; MAGI under $250,000 | −400,000; 400,000; −3,000; −3,000; 167,000; no tax |
| 1040 lines 23, 24 | Sch 2 line 21 | 2,880; 22,518 |
| 1040 lines 25a, 25c, 33, 34 | 70,000 + 30,000; 8959 line 24; refund | 100,000; 1,620; 101,620; 79,102 |

Form 8960 files from its upper bound and shows no tax, as it does for `juilin`. The capital loss carried to 2026 is $17,000 (not on a form).
