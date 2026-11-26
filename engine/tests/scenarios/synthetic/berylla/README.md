# berylla — a made-up resident of American Samoa (synthetic)

Berylla Saulevai is single and 67. She has lived in Pago Pago, American Samoa, since 2016, with her grandson Tavita (10). Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`).

She works for a port company in American Samoa, has a bank account, a dividend, a small craft business and taro farm, a land sale, a rental house and two small other incomes there. All of it qualifies, so Form 4563 excludes it. Her income from outside the territory goes on Form 1040: a pension from Hawaii, U.S. interest and dividends, and social security. She pays student loan interest. The return is federal only.

The scenario fills every line of Form 4563 Part II. Line 15 is added back to modified AGI on Schedule 1-A line 2d, Schedule 8812 line 2c, the Pub. 970 student loan worksheet and the Pub. 915 social security worksheet. The standard deduction is shared by gross income (Pub. 570). Lines 10 and 13 give $323 of net earnings, under $400, so no self-employment tax is owed.

Forms that file: Form 1040, Schedule 1, Schedule 1-A, Schedule 8812, Form 4563.

## Inputs

| Input | Amounts |
| --- | --- |
| Form 4563 answers (W-2AS, bank, sale and rent records) | wages $48,000 (box 5 $48,000), interest $300, dividends $400, business $250 (gross $1,600), land sale gain $4,000, rental $3,600 (gross rents $6,000), farm $100 (gross $1,800), prize $350, jury duty pay $150 |
| SSA-1099 | box 5 $18,000 |
| 1099-R, Kona Coast County Employees Retirement | box 1 $22,000, box 2a $22,000, box 4 $2,200, code 7 |
| 1099-INT, Leeward Federal Savings | box 1 $1,100 |
| 1099-DIV, Mauna Growth Fund | box 1a $900, box 1b $600 |
| 1098-E, Pacific Island Student Lending | box 1 $1,800 |
| Dependent | grandson Tavita, born 2015, lived with her all year in American Samoa |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 4563 line 6 (c) | full days between leaving and return: 14 − 1, 14 − 1, 10 − 1 | 13; 13; 9 |
| 4563 lines 7–13 | the stated amounts | 48,000; 300; 400; 250; 4,000; 3,600; 100 |
| 4563 line 14 | 350 + 150 | 500 |
| 4563 line 15 | lines 7 to 14 | 57,150 |
| 1040 line 6b | Pub. 915: 9,000 + 24,000 + 57,150 = 90,150; 85% cap | 15,300 |
| 1040 line 9 | 1,100 + 900 + 22,000 + 15,300 | 39,300 |
| Schedule 1 line 21 | Pub. 970: MAGI 39,300 + 57,150 = 96,450; 1,800 − 1,800 × 11,450 / 15,000 | 426 |
| 1040 line 11a, 11b | 39,300 − 426 | 38,874 |
| 1040 line 12e | (15,750 + 2,000) × 39,300 / (39,300 + 62,600 excluded gross) | 6,846 |
| Schedule 1-A line 2d, 2e | Form 4563 line 15 | 57,150 |
| Schedule 1-A line 3 | 38,874 + 57,150 | 96,024 |
| Schedule 1-A lines 34–38 | (96,024 − 75,000) × 6% = 1,261; 6,000 − 1,261 | 4,739 |
| 1040 line 15 | 38,874 − 6,846 − 4,739 | 27,289 |
| 1040 line 16 | QDCG worksheet: tax table on 26,689, 0% on 600 | 2,963 |
| Schedule 8812 line 2c, 2d | Form 4563 line 15 | 57,150 |
| Schedule 8812 line 3 | 38,874 + 57,150 | 96,024 |
| Schedule 8812 line 14, 1040 line 19 | one child, $2,200, under the tax | 2,200 |
| 1040 line 22, 24 | 2,963 − 2,200 | 763 |
| 1040 line 25b, 33 | 1099-R withholding | 2,200 |
| 1040 line 34, 35a | 2,200 − 763 | 1,437 |

The box "main home in the U.S. for more than half of 2025" is blank: American Samoa is not in the United States.
