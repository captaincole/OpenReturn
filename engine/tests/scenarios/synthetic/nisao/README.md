# nisao — a California excess business loss carryover (synthetic)

Nisao Merrow is single and lives in San Jose, California, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

He is a surgeon (a W-2), runs a consulting business with a profit, and owns and runs an instrument maker, an S corporation, whose K-1 shows a $350,000 loss. California did not follow the federal suspension of the limit for 2020, so an old loss of the instrument maker left a $200,000 California carryover that his federal return never had. FTB 3461 line 14b holds it. All $200,000 was added back as income in earlier years.

This year his business loss ($250,000) is under the $313,000 threshold. The room left, $63,000, takes part of the carryover on Schedule CA line 8z column B (ca-3461-inst-2025::sec::line-15::b01), and $137,000 carries to 2026 (line 16). Line 17 stays blank: line 16 ($137,000) is less than the $200,000 included as income earlier (::line-17::b01). The sister scenario `egeanin` covers line 8p.

Federal Form 461 files too (the K-1 loss alone passes the threshold), and its line 16 is $63,000: no federal excess business loss.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Fal Dara Medical Center | box 1 $420,000; box 2 $95,000; box 6 $7,710; box 16 $420,000; box 17 $36,000 |
| Schedule C, Merrow Surgical Advisors | receipts $130,000; expenses $30,000 |
| Schedule K-1 (Form 1120-S), Malkier Instruments, Inc. | box 1 −$350,000; stock basis at the start $500,000 |
| FTB 3461 carryover from 2024 (line 16 of the 2024 form) | $200,000 |
| Adjustments included as income in earlier years | $200,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Form 461 lines 2, 5, 9, 14, 15, 16 | no excess business loss | 100,000; −350,000; −250,000; −250,000; 313,000; 63,000 |
| 1040 lines 8, 9, 10, 11 | 100,000 − 350,000; 420,000 − 250,000; half of SE tax 2,678 | −250,000; 170,000; 1,339; 168,661 |
| FTB 3461 lines 2, 5 | Schedule CA lines 3 and 5 (no column B or C) | 100,000; −350,000 |
| FTB 3461 lines 9, 14a | combine; no Part II amounts | −250,000; −250,000 |
| FTB 3461 lines 14b, 14c | the carryover as a negative number (::line-14b::b01); 14a + 14b | −200,000; −450,000 |
| FTB 3461 lines 15, 16 | single threshold; −450,000 + 313,000 | 313,000; −137,000 |
| FTB 3461 line 17 | 137,000 is less than 200,000: no adjustment | blank |
| Sch CA line 8z B | 313,000 − 250,000, not more than 200,000 (::line-15::b01), with "excess business losses carryover from prior years" | 63,000 |
| Sch CA line 8p B, C | no federal or California adjustment | blank |
| Sch CA lines 9a, 10, 27 column B | the column totals | 63,000 |
| 540 lines 13, 14, 15, 17 | 168,661 − 63,000 | 168,661; 63,000; 105,661; 105,661 |
| 540 lines 18, 19 | CA standard deduction; 105,661 − 5,706 | 5,706; 99,955 |

The carryover used ($63,000) and the carryover to 2026 ($137,000) add up to line 14b.
