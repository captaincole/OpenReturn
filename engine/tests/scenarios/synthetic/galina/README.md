# galina — a farm loss carried back, and an old NOL carried forward (synthetic)

A made-up taxpayer. Every name and amount is invented. Synthetic and
**unverified**: no answer key stands behind the expected values. They are the
engine's output, checked by hand line by line (below), then locked.

## Who

Galina Venkirk is single and lives in Brookings, South Dakota (no state
return). She farms corn and soybeans on the cash method and works winters at a
grain elevator. A dry summer gave her farm an $80,000 loss. She also has bank
interest, fund dividends, three stock sales, and $5,000 left of a 2016 NOL.

## What it covers

- Form 172 Part I with lines 1–4, 6–9, 11, 14–16, 18–20 and 22–24 nonzero:
  nonbusiness capital losses above gains, nonbusiness deductions above
  nonbusiness income, a business capital loss (her cooperative equity), a
  Schedule D loss, and the 2016 NOL deduction added back. The NOL is $60,000.
- Part II with both columns: the farming loss carried back to 2023, then the
  rest to 2024. Both years itemized, with a capital loss and a QBI deduction,
  so lines 11–18 and 22–33 are filled. 2023 had a disaster casualty loss.
- Schedule 1 line 8a: the 2016 NOL, deducted in full (a loss before 2018 has
  no 80% limit).

Forms that file: Form 1040, Schedule 1, Schedule F, Schedule D, Form 8949,
Form 8995, Form 172.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Sioux River Grain Elevator | box 1 $20,000, box 2 $1,000 |
| Farm (Schedule F) | sales $60,000; costs $140,000 |
| 1099-INT, Brookings Farmers Bank | box 1 $1,200 |
| 1099-DIV, Big Sioux Index Funds | box 1a $800, 1b $300, 2a $500 |
| 1099-B, short term, box A | proceeds $11,000, basis $20,000 |
| 1099-B, long term, box D | proceeds $8,000, basis $6,000 |
| Cooperative equity, box F (a business asset) | proceeds $500, basis $2,000 |
| Form 461 answer: business capital net | −$1,500 |
| NOL carryover | 2016 loss, $5,000 to 2025 |
| Waive the farming carryback | no |
| 2023 return | TI $28,000; capital loss deduction $3,000; QBI $4,000; AGI $50,000; medical $6,000 / $2,250; NOL deducted $25,000; gifts $5,000 cash; casualty $9,000 / $4,000 |
| 2024 return | TI $15,000; capital loss deduction $1,500; QBI $2,000; AGI $40,000; medical $5,000 / $2,000; NOL deducted $10,000; gifts $3,000 cash |

The prior-year amounts are what she states from those returns. No input
document is new: the NOL answers are stated facts.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Schedule F line 34, Schedule 1 line 6 | 60,000 − 140,000 | −80,000 |
| Schedule D line 16, 21; 1040 line 7a | −9,000 + 2,000 − 1,500 + 500; limit 3,000 | −8,000; 3,000; −3,000 |
| Schedule 1 line 8a | 2016 loss, before 2018: in full | 5,000 |
| Schedule 1 line 9, 10 | −5,000; −80,000 − 5,000 | −5,000; −85,000 |
| 1040 line 9, 11a | 20,000 + 1,200 + 800 − 3,000 − 85,000 | −66,000 |
| 1040 line 12e, 15 | single standard deduction; TI | 15,750; 0 |
| 172 line 1 | −66,000 − 15,750 | −81,750 |
| 172 lines 2, 3, 4, 5 | 9,000 losses; 2,000 + 500 gains | 9,000; 2,500; 6,500; 0 |
| 172 lines 6, 7, 8, 9, 10 | standard deduction; 1,200 + 800 | 15,750; 2,000; 2,000; 13,750; 0 |
| 172 lines 11–15 | the co-op loss; no business gain | 1,500; 0; 0; 1,500; 8,000 |
| 172 lines 16–22 | loss 8,000; no 1202; 3,000 allowed | 8,000; 0; 8,000; 3,000; 5,000; 0; 3,000 |
| 172 line 23, 24 | Schedule 1 line 8a; −81,750 + 13,750 + 3,000 + 5,000 | 5,000; −60,000 |
| Farming loss | smaller of 80,000 and 60,000 | 60,000 |
| 2023 lines 1–6 | the loss; stated; line 6 refigures (line 3) | 60,000; 28,000; 3,000; blank; 4,000; 0 |
| 2023 lines 11–18 | 50,000; 7,000; 57,000; 2,250; 6,000; 4,275; 1,725 | line 18: 525 |
| 2023 lines 22–33 | 57,000; 25,000; 82,000; 5,000; 5,000 (60% is 49,200); 0; 4,000; 9,000; 5,700; 3,300; 700 | line 33: 1,225 |
| 2023 lines 7, 9, 10 | line 33; 28,000 + 7,000 + 1,225; 60,000 − 36,225 | 1,225; 36,225; 23,775 |
| 2024 lines 1–6 | 2023 line 10; stated | 23,775; 15,000; 1,500; blank; 2,000; 0 |
| 2024 lines 11–18 | 40,000; 3,500; 43,500; 2,000; 5,000; 3,262.50 → 3,263; 1,737 | line 18: 263 |
| 2024 lines 22–33 | 43,500; 10,000; 53,500; 3,000; 3,000; 0; 0; 0; 4,350; 0; 0 | line 33: 263 |
| 2024 lines 7, 9, 10 | 263; 15,000 + 3,500 + 263; 23,775 − 18,763 | 263; 18,763; 5,012 |
| 1040 line 25a, 34 | withheld, all refunded | 1,000 |

Lines 8 and 19–21 of Part II stay blank: line 8 is for estates and trusts, and
lines 19–21 take mortgage insurance premiums only for years before 2022.
