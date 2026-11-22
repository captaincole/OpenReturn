# aviendha — a made-up fee-basis official who is deaf (synthetic)

Aviendha Thornwell is single. She lives in Ellensburg, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is a county constable paid in part by the fees of her office: a fee-basis state or local government official. She is deaf and pays a sign language interpreter for work meetings: an impairment-related work expense, inside line 4. Her county paid a per diem for a training trip at the federal rate (W-2 box 12 code L), as one payment with no split for meals. She drives two cars for work on actual expenses: one she bought in March 2025 (section 179 and the special allowance), one she has leased since June 2024 (an inclusion amount). She itemizes. The return is federal only: Washington has no income tax.

Form 2106 line 10 splits two ways: the interpreter's share goes on Schedule A line 16, the rest on Schedule 1 line 12. The published examples that check the rules are unit tests (`tests/unit/federal/2106/`).

Forms that file: Form 1040, Schedule 1, Schedule A, Form 2106.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Coldwater Basin County | box 1 $64,000, box 2 $6,800, box 12 L $1,200 |
| Form 1098, Basalt Range Savings | box 1 $11,200 |
| Real estate tax | $3,900 |
| Line 2, 3, 4, 5 | $386.40; $2,940.75; $5,610 (interpreter $4,800); meals $1,150 |
| Code L payment | $1,200 for a trip that cost $4,090.75, meals $1,150 |
| Car 1 (owned) | placed in service 3/14/2025, $34,000, 18,000 miles, 13,500 business, 12-mile commute × 220 days, $4,850 operating; 200 DB; section 179 on $8,000; special allowance (acquired 3/14/2025) |
| Car 2 (leased) | since 6/1/2024, 9,000 miles, 4,500 business, 1,200 commuting; $2,100 operating, $5,400 lease, $15 inclusion |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 14 (a), (b) | 13,500 ÷ 18,000; 4,500 ÷ 9,000 | 75.00; 50.00 |
| 16 (a), 17 (a) | 220 × 12; 18,000 − 13,500 − 2,640 | 2,640; 1,860 |
| 17 (b) | 9,000 − 4,500 − 1,200 | 3,300 |
| 31 (a) | section 179: min(8,000, 20,200) × 75% = 6,000; worksheet: min(25,500 − 6,000, 15,150 − 6,000) = 9,150; + 6,000 | 15,150 |
| 32 (a) | 34,000 × 75% − 15,150 | 10,350 |
| 33, 34 (a) | Jan.–Sept. 2025, 200 DB 20%; 10,350 × 20% | 200 DB 20%; 2,070 |
| 35, 36, 37 (a) | 15,150 + 2,070; 2025 limit with the allowance; 20,200 × 75% | 17,220; 20,200; 15,150 |
| 38, 28 (a) | smaller of 17,220 and 15,150 | 15,150 |
| 26, 27, 29 (a) | 4,850; × 75% = 3,637.50; + 15,150 | 4,850; 3,638; 18,788 |
| 24c, 26, 27, 29 (b) | 5,400 − 15; + 2,100; × 50% = 3,742.50 | 5,385; 7,485; 3,743; 3,743 |
| 1 | 18,788 + 3,743 | 22,531 |
| 2, 3, 4, 5 | rounded | 386; 2,941; 5,610; 1,150 |
| 6 A, B | 22,531 + 386 + 2,941 + 5,610; line 5 | 31,468; 1,150 |
| 7 A, B | worksheet: 1,150 ÷ 4,090.75 = 0.281; 1,200 × 0.281 = 337; 1,200 − 337 | 863; 337 |
| 8, 9 A | 31,468 − 863 | 30,605 |
| 8 B, 9 B | 1,150 − 337; × 50% = 406.50 | 813; 407 |
| 10 | 30,605 + 407 | 31,012 |
| Schedule A line 16 | interpreter's share: 30,605 × 4,800 ÷ 31,468 | 4,668 |
| Schedule 1 line 12, 26 | 31,012 − 4,668 | 26,344 |
| Schedule A line 17 | 3,900 + 11,200 + 4,668 | 19,768 |
| 1040 line 1a, 9 | W-2 box 1 | 64,000 |
| 1040 line 10, 11a | Schedule 1 line 26; 64,000 − 26,344 | 26,344; 37,656 |
| 1040 line 12e, 15 | Schedule A (over the $15,750 standard deduction); 37,656 − 19,768 | 19,768; 17,888 |
| 1040 line 16 | tax table, 17,850–17,900, single | 1,907 |
| 1040 line 25a, 34 | withheld; 6,800 − 1,907 | 6,800; 4,893 |
