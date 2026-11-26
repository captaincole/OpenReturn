# careane — a made-up wife who files separately in Texas (synthetic)

Careane Vellacott is married to Davram Vellacott. They live in El Paso, Texas, and file separate returns. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions and Pub. 555, then locked (`verification: "unverified"`).

Texas is a community property state. Careane reports half of all community income and all of her separate income, and Form 8958 shows how. Texas also treats income from separate property as community income, so the dividends, interest and royalties of her and Davram's separate property split in half. A gain on separate property stays separate. Her pension is half community: 10 of her 20 years in the plan were while married in Texas. Each spouse's self-employment tax is the tax of the spouse who carries on the business. They paid $6,000 of estimated tax jointly and agreed that she claims $2,000. The return is federal only: Texas has no income tax.

The couple's community items balance, so the return's amounts (which come from Careane's own documents) equal column B of Form 8958. The engine does not yet move column B to the return in general (`federal/8958/QUESTIONS.md`, "Proposals for a discussion").

Forms that file: Form 1040, Schedules 1, 2, B, C, D, E and SE, Form 8949, Form 8995, Form 8958. Line 4 of Form 8958 is blank: no state refund.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Rio Grande Pediatrics (Careane) | box 1 $72,000, box 2 $19,000 |
| 1099-INT, Franklin Mountain Credit Union (Careane, community) | box 1 $1,200 |
| 1099-DIV, Lone Star Energy (Careane, inherited) | box 1a and 1b $2,000 |
| 1099-B, Lone Star Energy shares (Careane, inherited) | proceeds $15,000, basis $10,000, long term |
| Schedule C, Vellacott Bookkeeping (Careane) | receipts $36,000, expenses $6,000 |
| 1099-R, Sun City Water pension (Careane) | box 1 and 2a $12,000, box 4 $1,200, code 7 |
| Mineral royalty (Careane, inherited land) | $3,000 |
| Estimated tax, her agreed part | 4 × $500 |
| Davram's items (stated) | wages $48,000 (withheld $19,000) and $24,000; interest $800 and $400 (separate notes); dividends $2,000 (separate fund); business $30,000; fund loss −$800 (separate); pension $6,000 (withheld $600); royalty $3,000 (separate land) |

## Hand check

| Line | Rule | Value (A; B; C) |
| --- | --- | --- |
| 8958 line 1, three rows | community wages, half each | 72,000; 36,000; 36,000 · 48,000; 24,000; 24,000 · 24,000; 12,000; 12,000 |
| 8958 line 2, three rows | community, half; Davram's separate notes, community income in Texas | 1,200; 600; 600 · 800; 400; 400 · 400; 200; 200 |
| 8958 line 3, two rows | separate shares, community income in Texas | 2,000; 1,000; 1,000 (each) |
| 8958 line 5, two rows | community businesses, half each | 30,000; 15,000; 15,000 (each) |
| 8958 line 6, two rows | gains on separate property stay separate | 5,000; 5,000; 0 · −800; 0; −800 |
| 8958 line 7, row 1 | 12,000 × 120/240 = 6,000 community; 6,000 + 3,000 hers | 12,000; 9,000; 3,000 |
| 8958 line 7, row 2 | community pension, half | 6,000; 3,000; 3,000 |
| 8958 line 8, two rows | separate land, royalty community in Texas | 3,000; 1,500; 1,500 (each) |
| 8958 line 10, two rows | the spouse who carries on the business; 27,705 × 15.3% | 4,238; 4,238; 0 · 4,238; 0; 4,238 |
| 8958 line 9, two rows | half of line 10, split as line 10 | 2,119; 2,119; 0 · 2,119; 0; 2,119 |
| 8958 line 11, four rows | withholding as its item: half; 1,200 × 0.75; half | 19,000; 9,500; 9,500 · 19,000; 9,500; 9,500 · 1,200; 900; 300 · 600; 300; 300 |
| 8958 line 12 | joint estimated tax, the agreed part | 6,000; 2,000; 4,000 |
| 1040 line 1a = line 1 column B | 36,000 + 24,000 + 12,000 | 72,000 |
| 1040 line 2b = line 2 column B | 600 + 400 + 200 | 1,200 |
| 1040 line 3b, 5b, 7a | lines 3, 7 and 6 column B | 2,000; 12,000; 5,000 |
| Schedule 1 lines 3 and 5 | lines 5 and 8 column B | 30,000; 3,000 |
| 1040 line 10, line 23 | lines 9 and 10 column B | 2,119; 4,238 |
| 1040 line 25d | line 11 column B: 9,500 + 9,500 + 900 + 300 | 20,200 |
| 1040 line 26 | line 12 column B | 2,000 |
| 1040 line 15 | 123,081 − 15,750 − 5,576 (QBI) | 101,755 |
| 1040 line 24 | 16,815 + 4,238 | 21,053 |
| 1040 line 34 | 22,200 − 21,053 | 1,147 |
