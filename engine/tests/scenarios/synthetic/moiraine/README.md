# moiraine — a made-up filer who splits her refund (synthetic)

Moiraine Thistlewood is single and lives in Reno, Nevada. Every name, number and amount here is made up. The routing and account numbers are invented too; the first routing number is the one on the sample check in the Form 8888 instructions. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2. Her employer withheld more than her tax, so she gets a refund. She wants it in three accounts: $1,500 to a credit union savings account, $1,000 to a brokerage account (her broker said to check Savings), and the rest to her checking account. She takes the standard deduction. The return is federal only: Nevada has no income tax.

The scenario renders a filled Form 8888 with all three accounts and line 5, and the checked box on Form 1040 line 35a. The second account number is stated with spaces, and the form leaves them out. The published examples that check the rules are unit tests (`tests/unit/federal/8888/`).

Forms that file: Form 1040, Form 8888.

## Inputs

| Input | Values |
| --- | --- |
| W-2, Truckee Meadows Survey Partners | box 1 $68,000, box 2 $9,800 |
| Refund account 1 (answer) | routing 250250025, account 4410-2286, savings, $1,500 |
| Refund account 2 (answer) | routing 091999996, account "RX 551 0293", savings, $1,000 |
| Refund account 3 (answer) | routing 321999990, account 778812345, checking, the rest |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 1a, 1z, 9, 11a | W-2 box 1 | 68,000 |
| 1040 line 12e, 14 | single standard deduction | 15,750 |
| 1040 line 15 | 68,000 − 15,750 | 52,250 |
| 1040 line 16, 18, 22, 24 | tax table, 52,250–52,300, single | 6,415 |
| 1040 line 25a, 25d, 33 | W-2 box 2 | 9,800 |
| 1040 line 34, 35a | 9,800 − 6,415, all refunded | 3,385 |
| 1040 line 35a box | Form 8888 attached | checked |
| 1040 lines 35b–35d | blank: the split is on Form 8888 | blank |
| 8888 header | calendar year 20**25**, name, SSN | 25 |
| 8888 line 1a, 1b, 1c, 1d | stated | 1,500; 250250025; Savings; 4410-2286 |
| 8888 line 2a, 2b, 2c, 2d | stated; spaces left out of the account number | 1,000; 091999996; Savings; RX5510293 |
| 8888 line 3a | the rest: 3,385 − 1,500 − 1,000 | 885 |
| 8888 line 3b, 3c, 3d | stated | 321999990; Checking; 778812345 |
| 8888 line 5 | 1,500 + 1,000 + 885 = 1040 line 35a | 3,385 |
