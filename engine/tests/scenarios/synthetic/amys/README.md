# amys — foreign accounts and holdings on Form 8938 (synthetic)

Amys and Corin Halloran are married and file jointly. They live in Austin, Texas, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

Amys earns wages. The couple holds six foreign assets:

- a joint savings account in Zurich (CHF): interest, an early withdrawal penalty and Swiss tax withheld;
- Amys's custody account at a London broker (GBP), opened in 2025: dividends and one short-term sale;
- Amys's current account in Cologne (EUR), closed in June: no income;
- Corin's shares of a Norwegian company (NOK), on the company's register: dividends and Norwegian tax withheld;
- Amys's U.S.-dollar note of a Dutch company, bought in March: interest;
- Amys's fund units that she reports on Form 8621 (Part IV), so they are not in Part VI.

The scenario fills Parts I to VI of Form 8938 with three copies of page 2, ties Part III to Schedules B, D, 1 and 3, and fills Schedule B line 7 from the account facts.

## Documents

`generate-docs.ts` makes six year-end statements in `docs/` with the generator `documents/foreignAssetStatement.ts` (first of its type). Each prints the balances in the account's currency and a U.S. tax annex in dollars. The exchange rates are not on the statements: they are the year-end rates the couple looked up.

## Why the form files

The year-end total is $383,808: 114,950 (Zurich) + 64,316 (London) + 0 (Cologne) + 108,642 (Norway) + 75,900 (note) + 20,000 (fund). The fund counts toward the threshold although Form 8621 reports it (`special-rules::b01`). A joint return in the United States files above $100,000 on the last day (`types-of-reporting-thresholds::b01`). Living abroad, they would not file: $383,808 is not above $400,000, and the sum of the maximums, $540,981, is not above $600,000.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Header | three page 2s: 2 additional statements | box checked, 2 |
| 3a | a Form 1040 filer | checked |
| 23 (Zurich) | CHF 98,000 ÷ 0.796 = 123,115.58 | 123,116 |
| 23 (London) | GBP 61,200 ÷ 0.7432 = 82,346.61 | 82,347 |
| 23 (Cologne) | EUR 14,300 ÷ 0.852 = 16,784.04 | 16,784 |
| 5, 6 | two deposit accounts: 123,116 + 16,784 | 2, 139,900 |
| 7, 8 | one custodial account | 1, 82,347 |
| 9 | Cologne closed | Yes |
| 32 (Norway) | NOK 2,240,000 ÷ 10.125 = 221,234.57; over $200,000 | 32e 221,235 |
| 32 (note) | USD 76,500 | box b |
| 10, 11 | two assets: 221,235 + 76,500 | 2, 297,735 |
| 12 | note bought in 2025 | Yes |
| 13a | Zurich interest 812.40 | 812, Form 1040 line 2b, Schedule B line 1 |
| 13b | London dividends 1,450.25 | 1,450, line 3b, Schedule B line 5 |
| 13e | 18,400 − 12,150 (Form 8949 box C) | 6,250, line 7, Schedule D line 3 |
| 13f | early withdrawal penalty 45 | 45, line 10, Schedule 1 line 18 |
| 13g | Swiss tax 284.34; the election credit is claimed | 284, line 20, Schedule 3 line 1 |
| 14a | note interest 1,912.50 | 1,913 |
| 14b, 14g | Norway dividends 1,240, tax 186 | 1,240; 186 |
| 18 | one Form 8621 | 1 |
| 22c, 22d | Zurich joint; Cologne has no tax item | checked on its page |
| Schedule B 2, 6 | 812.40 + 1,912.50; 1,450.25 + 1,240 | 2,725; 2,690 |
| Schedule B 7a | Form 8938 accounts; Zurich alone is over $10,000 | Yes, Yes |
| Schedule B 7b | the accounts' countries | Switzerland; United Kingdom, Germany |
| Schedule 3 line 1 | election: the smaller of 470.34 and the tax | 470 |
| 1040 line 20 | 284 + 186 in Part III | 470 |

The golden PDF holds page 1 and the first page 2 (Zurich, Norway). A plain render prints all three page 2s.
