# amys — foreign accounts and holdings on Form 8938 (synthetic)

Amys and Corin Halloran are married and file jointly. They live in Austin, Texas, all year. Every name and amount here is made up. There is no outside source and no answer key: the expected values are worked out by hand from the instructions, then checked against the engine and locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

Amys earns wages. The couple holds six foreign assets:

- a joint time-deposit savings account in Bologna (EUR): interest, an early withdrawal penalty and Italian tax withheld;
- Amys's custody account at a London broker (GBP), opened in 2025: dividends and one short-term sale;
- Amys's current account in Basel (CHF), closed in June: no income;
- Corin's shares of a Norwegian company (NOK), on the company's register: dividends and Norwegian tax withheld;
- Amys's U.S.-dollar note of a Dutch company, bought in March: interest in dollars;
- Amys's units of a Luxembourg mutual fund that she reports on Form 8621 (Part IV), so they are not in Part VI.

The scenario fills Parts I to VI of Form 8938 with three copies of page 2, ties Part III to Schedules B, D, 1 and 3, and fills Schedule B line 7 from the asset facts. Each asset outside Part V carries the couple's answer whether it is a financial account for Schedule B and FinCEN Form 114 (`financialAccount`): the fund units are (a mutual fund, `irs-1040sb-inst-2025::sec::line-7a-question-1-check-the-yes-box-if-at-any-time::b01`); the shares on the register and the note are not.

## Documents

`generate-docs.ts` makes six year-end statements in `docs/` with the generator `documents/foreignAssetStatement.ts`. Each prints only the account's currency, as a foreign bank does: the balances, the month-end balances of an account (the highest is the Form 8938 maximum value, `valuing-financial-accounts::b01`), and on page 2 the income, the tax withheld and the sales. No statement prints a dollar amount or an exchange rate.

## Currencies and rates

The income facts hold the amounts as the statements print them, with the rates the couple used (`conversion` on each fact); the engine converts them, keeps the cents, and each form rounds its own lines. The rates are made up for the scenario, except the yearly averages, which are the IRS table's 2025 values as read on 2026-11-24 (irs.gov, "Yearly average currency exchange rates").

| What | Rate | Rule |
| --- | --- | --- |
| Balances (Form 8938) | Treasury rate on 12/31/2025: EUR 0.852, GBP 0.7432, CHF 0.796, NOK 10.125 | `irs-8938-inst-2025::sec::currency-determination-date::b01` |
| Interest, dividends, the penalty | yearly average 2025: EUR 0.886, GBP 0.759, NOK 10.392 | irs.gov pages; open, `federal/8938/QUESTIONS.md` question 15 |
| Tax withheld (credit for taxes paid) | the day withheld: EUR 0.852 (12/31/2025), NOK 10.31 (05/22/2025) | `irs-1116-inst-2025::sec::foreign-currency-conversion::b01` |
| The London sale | spot rate on each settlement date: GBP 0.7395 (sale, 09/24/2025), 0.7741 (purchase, 03/12/2025) | 26 CFR 1.988-2(a)(2)(iv) |

## Why the form files

The year-end total is $382,942.96: 114,084.51 (Bologna, EUR 97,200 ÷ 0.852) + 64,316.47 (London, GBP 47,800 ÷ 0.7432) + 0 (Basel) + 108,641.98 (Norway, NOK 1,100,000 ÷ 10.125) + 75,900 (note) + 20,000 (fund). The fund counts toward the threshold although Form 8621 reports it (`special-rules::b01`). A joint return in the United States files above $100,000 on the last day (`types-of-reporting-thresholds::b01`). Living abroad, they would not file: $382,943 is not above $400,000, and the sum of the maximums, $539,981, is not above $600,000.

## Hand check

The conversions, in the account's currency, the rate, and dollars kept to the cent:

| Item | Foreign amount | Rate | Dollars |
| --- | --- | --- | --- |
| Bologna interest | EUR 1,180.40 | 0.886 | 1,332.28 |
| Bologna early withdrawal penalty | EUR 40.00 | 0.886 | 45.15 |
| Bologna Italian tax withheld | EUR 118.04 | 0.852 | 138.54 |
| London dividends (all qualified) | GBP 1,100.70 | 0.759 | 1,450.20 |
| London sale proceeds | GBP 13,616.00 | 0.7395 | 18,412.44 |
| London sale cost | GBP 9,402.00 | 0.7741 | 12,145.72 |
| Fjordline dividends (all qualified) | NOK 12,880.00 | 10.392 | 1,239.41 |
| Fjordline Norwegian tax withheld | NOK 1,932.00 | 10.31 | 187.39 |
| Polder note interest | USD 1,912.50 | none | 1,912.50 |
| Bologna maximum value | EUR 104,000 | 0.852 | 122,065.73 |
| London maximum value | GBP 61,200 | 0.7432 | 82,346.61 |
| Basel maximum value | CHF 13,400 | 0.796 | 16,834.17 |
| Fjordline maximum value | NOK 2,240,000 | 10.125 | 221,234.57 |

The lines:

| Line | Rule | Value |
| --- | --- | --- |
| 8938 header | three page 2s: 2 additional statements | box checked, 2 |
| 8938 3a | a Form 1040 filer | checked |
| 8938 23 (Bologna, Basel, London) | the maximum values above, rounded | 122,066; 16,834; 82,347 |
| 8938 25 (Bologna) | currency and rate | Euro (EUR), 0.852 |
| 8938 5, 6 | two deposit accounts: 122,066 + 16,834 | 2, 138,900 |
| 8938 7, 8 | one custodial account | 1, 82,347 |
| 8938 9 | Basel closed | Yes |
| 8938 32 (Fjordline) | over $200,000 | 32e 221,235 |
| 8938 32 (note) | USD 76,500 | box b |
| 8938 10, 11 | two assets: 221,235 + 76,500 | 2, 297,735 |
| 8938 12 | note bought in 2025 | Yes |
| 8938 13a | Bologna interest 1,332.28 | 1,332, Form 1040 line 2b, Schedule B line 1 |
| 8938 13b | London dividends 1,450.20 | 1,450, line 3b, Schedule B line 5 |
| 8938 13e | 18,412 − 12,146 (Form 8949 box C row) | 6,266, line 7a, Schedule D line 3 |
| 8938 13f | penalty 45.15 | 45, line 10, Schedule 1 line 18 |
| 8938 13g | Italian tax 138.54; the election credit is claimed | 139, line 20, Schedule 3 line 1 |
| 8938 14a | note interest 1,912.50 | 1,913 |
| 8938 14b, 14g | Fjordline dividends 1,239.41, tax 187.39 | 1,239; 187 |
| 8938 18 | one Form 8621 | 1 |
| 8938 22c, 22d | Bologna joint; Basel has no tax item | checked on their pages |
| Schedule B 1, 2, 4 | 1,332.28 + 1,912.50 = 3,244.78 | rows 1,332 and 1,913; 3,245 |
| Schedule B 5, 6 | 1,450.20 + 1,239.41 = 2,689.61 | rows 1,450 and 1,239; 2,690 |
| Schedule B 7a | Form 8938 accounts and the fund units; Bologna alone is over $10,000 | Yes, Yes |
| Schedule B 7b | the accounts' countries, in the order recorded | Italy; United Kingdom, Switzerland, Luxembourg |
| Form 8949 row 1 (box C) | 18,412.44 and 12,145.72, each rounded | 18,412; 12,146; 6,266 |
| Schedule D 3, 7, 16 | from Form 8949 box C | 6,266 |
| Schedule 1 18, 26 | the penalty | 45 |
| Schedule 3 1, 8 | election: the smaller of 325.93 (138.54 + 187.39) and the tax | 326 |
| 1040 2b, 3a, 3b, 7a | Schedule B 4 and 6; qualified 2,689.61; Schedule D 16 | 3,245; 2,690; 2,690; 6,266 |
| 1040 9, 10, 11 | 172,400 + 3,245 + 2,690 + 6,266; 45 | 184,601; 45; 184,556 |
| 1040 15 | 184,556 − 31,500 standard deduction | 153,056 |
| 1040 16 | QDCG worksheet: 150,366 × 22% − 10,172 = 22,908.52 → 22,909; 2,690 × 15% = 403.50 → 404 | 23,313 |
| 1040 20, 22, 24 | Schedule 3 line 8; 23,313 − 326 | 326; 22,987; 22,987 |
| 1040 34, 35a | 27,850 withheld − 22,987 | 4,863 |

The golden PDF holds page 1 and the first page 2 (Bologna, Norway). A plain render prints all three page 2s.
