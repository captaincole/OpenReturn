# Form 8938: open questions

Each item is a place where the form and its instructions do not settle a rule. Block ids are in `irs-8938-inst-2025` unless named.

## 1. The total "at any time during the tax year"

- Text: "more than $75,000 at any time during the tax year" (`types-of-reporting-thresholds::b01`).
- The facts hold each asset's highest value, not the total on each day.
- Default: the total at any one time is at least the largest single value and at most the sum of the highest values. Only between them the engine asks for `foreign_assets.highest_total_value`.
- Dollars: no. It decides who files.

## 2. Living abroad on a joint return

- Text: "If your tax home is in a foreign country, you meet one of the presence abroad tests" (`types-of-reporting-thresholds::b02`).
- The text does not say whether one spouse or both must meet the test on a joint return.
- Default: one answer for the return (`foreign_assets.lives_abroad`). Cade asks it for the couple.
- Dollars: no. It decides who files.

## 3. A separate return and a spouse who is not a specified individual

- Text: "If you and your spouse are specified individuals and you each file a separate annual return, include one-half" (`joint-interest-valuation::b01`); otherwise each owner counts "the entire value" (`::b02`).
- Default: the engine asks `foreign_assets.spouse_is_specified_individual` only when the answer changes who files.
- Dollars: no.

## 4. Part III: what counts as a credit

- Text: "Enter the following items ... Credits" (`part-iii::b01`).
- The text does not say whether the item is the foreign tax paid or the part of the credit allowed. The credit on Schedule 3 line 1 is limited for all sources together.
- Default: the foreign tax paid on the asset's income (1099-INT box 6, 1099-DIV box 7), printed only when Schedule 3 line 1 claims a credit above 0.
- Dollars: yes, on line 13g or 14g only. No tax amount changes.

## 5. Part III: where each item is reported

- Text: "the schedule, form, or return on which you reported the items" (`part-iii::b01`).
- Default: column (d) names the Form 1040 line (gains: line 7a, the 2025 capital gain line); column (e) names the schedule line when that schedule files. Gains name the Schedule D lines of the sales' Form 8949 boxes, and line 13 for capital gain distributions.
- Limit: the text is a fixed table for each kind of income (`partIIIBindings.ts`). It does not follow the amount. It names the wrong line when the amount takes another path: a foreign fund on Form 8621 (Schedule 1 line 8z and Form 1040 line 16), interest a business earned (Schedule C), a child's account on Form 8814, a gain on Form 4797. The work to name the true line is issue #246.
- Dollars: no.

## 6. Part III: interest

- Default: Schedule B line 1's amount for the payer, 1099-INT boxes 1 and 3. Tax-exempt interest (box 8) is not an item.
- Dollars: yes, on lines 13a and 14a only, for a foreign tax-exempt bond (rare).

## 7. Part III: royalties

- 1099-MISC box 2 royalties have no route to Schedule E in the engine (Schedule E reads royalties from a rental property fact).
- Default: lines 13c and 14c are unsupported when an asset's 1099-MISC prints box 2; blank otherwise.

## 8. Page 2 for a second issuer

- Text: "copy page 2 as many times as needed and complete a separate line 36 for each issuer or counterparty" (`lines-35d-and-35e::b01`); the form says "attach a separate statement with the same information".
- Default: each extra page repeats lines 29–34 of the asset with the next issuer. Lines 10–12 count the asset once.
- Dollars: no.

## 9. Part I when Part V has no account of one type

- Text: "Report the number of deposit accounts reported in all Parts V" (`line-5::b01`).
- Default: with any Part V account, lines 5–8 print 0 for the type with none. With no Part V account, Part I is blank. Part II is the same for Part VI.
- Dollars: no.

## 10. Partial years and dual-status filers

- Text: the reporting period is the part of the year the person is a specified individual (`exception-for-partial-tax-years::b01`, `specified-person::b03`).
- Default: the engine prepares full-year Form 1040 returns only, so the period is the tax year.

## 11. Schedule B line 7a question 2 (FinCEN Form 114)

- Text: "if the aggregate value of foreign financial accounts exceeds $10,000 at any time during 2025" (`irs-1040sb-inst-2025::sec::line-7a-question-2-see-fincen-form-114-and-its::b01`).
- Default: Yes, with the accounts' countries on line 7b, when one recorded account alone is over $10,000. Otherwise unsupported: signature authority and the aggregate at any time are not facts.
- Decided, line 7b: a financial account "also includes ... shares in a mutual fund or similar pooled fund" and a policy with a cash value (`line-7a-question-1-check-the-yes-box-if-at-any-time::b01`). Each Part VI asset carries the person's answer `financialAccount`. With `true` it is an account: its country (the institution's, else the entity's, else the first issuer's) joins line 7b, it makes question 1 Yes, and its value counts in the one-account test. With `false` it is left out. With no answer, Schedule B lists the asset fact in its missing inputs and files to ask it; question 2 (unless already Yes) and line 7b wait. Form 8938 owns the fact; Schedule B owns the question, because only its lines read it.
- Line 7b stays unsupported when an account has no country recorded.
- Open: whether a sub-account at a foreign broker, a foreign pension, or a direct holding in a fund that is not available to the public counts. The engine does not decide; the person's answer does.

## 12. Rounding of the Part I and Part II totals

- Text: none. The instructions give no rounding rule; the form's dollar lines have no cents column.
- Default: each line 23 and line 32 value rounds to the nearest dollar, and lines 6, 8 and 11 add the rounded values (the form's arithmetic on other lines).
- Another reading: add the values with cents and round only the total. The two can differ by $1.
- Dollars: yes, $1 at most on lines 6, 8 and 11. No tax amount changes.

## 13. The account statement's exchange rate

- Text: "Use the currency exchange rate on the last day of the tax year to figure the maximum value" (`currency-determination-date::b01`); "You may rely on the foreign currency conversion rate reflected in a financial account statement issued at least annually" (`exception-for-financial-account::b01`).
- Default: the asset fact holds only its currency (`foreignCurrency.code`). The engine takes the Treasury rate for December 31 from its table (`currency/rates.ts` yearEndRate, `data/exchange-rates/treasury-year-end-2025.json`) and prints it in column (b); column (c) stays blank.
- Open: the statement's own rate. The instructions allow it (`exception-for-financial-account::b01`), but the fact has no field for it, so the engine never uses it. To add it: a stated rate on the asset fact, printed with its source in column (c). No table can know a statement's rate, so that would be the one rate a person states.
- An asset in a currency outside the H.10 list: the form files and every line is unsupported, because who files depends on its value in dollars. Schedule B's one-account test counts it as $0.
- Dollars: yes, on lines 23 and 32, and the threshold test. No tax amount changes.

## 14. An asset not in an account: the year-end value as the maximum

- Text: "you may use the value ... as of the last day of the tax year, unless you know or have reason to know ... the value does not reflect a reasonable estimate of the maximum value" (`valuing-other-specified::b01`, Example 15).
- Default: line 32 prints the fact's `maximumValue`. Cade records the known highest value; the year-end value only when no higher value is known.
- Dollars: yes, on lines 11 and 32. No tax amount changes.

## 15. Income in a foreign currency: which rate

Decided by the product owner on 2026-11-24 (the decision comments in `currency/rates.ts` and `incomeInDollars.ts`):

- The source of daily rates is the Federal Reserve Board's H.10 release, "Foreign Exchange Rates". Its 23 currencies are the only foreign currencies the engine supports; a fact in any other currency is unsupported, with a reason that names the currency.
- The facts hold what the statement prints: the currency (`foreignCurrency.code`), each amount, and the dates the rule needs (`byDate` for dividends, tax and penalties, and credits under the daily method; the settlement dates of a sale). No fact holds a rate. The engine looks each rate up in its tables, divides (units per dollar), keeps the cents, before any form reads the amount (`incomeInDollars.ts`).
- Interest that accrues through the year takes the return's method, `decisions.foreign_income_rate_method`: `yearly_average` (the Board's G.5A average for the tax year) or `daily` (the H.10 rate of each day credited). The person chooses. Texts: "In general, use the exchange rate prevailing (i.e., the spot rate) when you receive, pay or accrue the item" and "Generally, it accepts any posted exchange rate that is used consistently" (irs.gov "Yearly average currency exchange rates"); the IRS practice unit "Definition of Appropriate Exchange Rate" treats an item over a period at an average and a dividend as a one-day event (not read by this branch; cited as the decision gives it).
- A single event takes the H.10 rate of its day: each dividend, the early withdrawal penalty, tax withheld. Foreign tax: the day withheld (`irs-1116-inst-2025::sec::foreign-currency-conversion::b01`; 26 CFR 1.986(a)-1); for taxes claimed on an accrual basis (`foreign_tax_credit.claim_accrued`), the yearly average for the tax year (the same block). The block's three exceptions to the average and the election to use the day paid are not modeled.
- A sale: the proceeds at the H.10 rate of the settlement date of the sale, the cost at that of the purchase (26 CFR 1.988-2(a)(2)(iv)(A), (B)).
- A day with no published rate (a weekend, a U.S. holiday, "ND"): the last earlier day that has one. This is the engine's convention; no IRS text states it. The longest gaps in the history are in the early 1990s (30 days, Taiwan, 1991); since 2000 the longest is 4 days.
- A missing method decision means the yearly average, not a pending input. The engine takes the default of the other elections it reads the same way (Form 1116 `claim_accrued`, the Form 8949 box), and a pending input would make Cade ask on every return with foreign interest, when the answer changes nothing for a return with one credit a year. Under the daily method a missing dated credit is pending. This default is not confirmed by a person.
- Dollars: yes, on every line that reads the income.

Open:

- A single large interest payment under the average method: a deposit that pays once a year at maturity is one event, but the average spreads it over the year. The method is the person's choice for the return, so the engine does not split by payment.
- The IRS's own yearly average table differs from the Board's G.5A averages by more than rounding (2025, the currencies amys uses; units per dollar): euro IRS 0.886, G.5A 0.88449 (1 / 1.1306); pound IRS 0.759, G.5A 0.75804 (1 / 1.3192); krone IRS 10.392, G.5A 10.3852; Swiss franc IRS 0.831, G.5A 0.8305 (within rounding). The IRS table is the one the IRS publishes for taxpayers. On amys's euro interest the IRS table gives $1,332.28, the Board's average $1,334.56.
- Refresh: the tables are built by `npm run form-engine -- ingest-exchange-rates` and committed. The H.10 table ends on 2026-11-20; a date after the table's last day is unsupported until someone runs the refresh. Who runs it, and how often (weekly for H.10, each January for G.5A, once a year for the Treasury rate of December 31), is not decided.
- No court case was found on the choice between a yearly average and the day's rate.
- Venezuela: the H.10 series changes unit at each redenomination (2018-08-20, 2021-10-04) and the history pages do not restate the older rates. The engine reads the series only from 2021-10-04, and G.5A averages only from 2022.
- The open branch `form-8621` converts a foreign fund's amounts with rates stated on its own fact. After both branches merge, it must use these tables and this fact shape.

## 16. Rounding a converted amount

- Text: none for the conversion. The whole-dollar rule rounds lines, not amounts (`irs-1040-inst-2025`, "Rounding Off to Whole Dollars").
- Default: each converted amount rounds to the cent, the half cent up (`money.ts` dollarsFromForeign); the form rounds its line as before.
- Another reading: keep the full quotient until the line rounds. The two differ by under a cent for each amount.
- Dollars: at most $1 on a line, and only when the cents fall within a cent of 50.

## 17. A fact that cannot be converted

- A date the rule needs is missing, or the dated amounts do not add up to the box: the fact keeps no amount and is a pending input (`pendingInputs().pendingFacts`). The lines that list the item wait: Schedule B lines 1 to 6, Form 1040 lines 2a to 3b, Form 8949 and Schedule D, the foreign tax credit (Schedule 3 line 1, Form 1116) and Form 8938 Part III.
- A currency outside the H.10 list, or a date the tables do not cover: the fact keeps no amount, is not pending, and the same lines are unsupported with the reason. Form 1040 lines 2b and 3b read Schedule B; without Schedule B they stay blank.
- Limit: a form that adds a box over all the 1099 facts (Form 8960, Form 6251, Form 8615, the EIC test, the California forms) reads the amount as absent while it is not converted. The return is not ready to file until it is.
- Limit: these stay in dollars: a 1099-MISC fact, the foreign income statement next to a 1099 (`.foreign_income`), a basis the taxpayer states (`.reported_basis`) and a Form 8949 adjustment.

## 18. The rate tables

- `engine/src/data/exchange-rates/`, built by the builder's `ingest-exchange-rates` command from the official pages and committed; the engine only reads them (`currency/rates.ts`). Each file names its source pages and the day of download.
- `h10-daily.json`: every daily H.10 rate of the 23 currencies, from each currency's first rate (1971 for most) to the day of download. About 2.1 MB; kept whole because a sale's cost needs the rate of its purchase date.
- `g5a-yearly-averages.json`: the G.5A annual averages, 2014 to 2025 (releases before 2018 print a text table the builder does not read).
- `treasury-year-end-2025.json`: the Treasury Reporting Rates of Exchange as of 2025-12-31, the rate in effect that day.
- Every rate reads one way in the engine: units of the currency for one dollar (`money.ts` `UnitsPerDollar`). H.10 and G.5A print the euro, the pound, the Australian and the New Zealand dollar the other way (dollars per unit); `currency/rates.ts` turns them around.

## Second opinions

- **Blind fill (14 cases, before question 15).** Every value agrees but one: case 8, line 23. The harness printed the would-be line 23 ($71,765) for a return under the threshold; the engine does not file the form there (`resolveInfo.ts` builds no lines when `mustFile` is false), so the line is blank, as in the blind fill. Both read €61,000 / 0.85 = $71,765 (`currency-determination-date::b01`).
- **PolicyEngine-US 2.153.8 (commit b3edc0446b).** It does not model Form 8938: no variable or parameter in `gov/irs` names Form 8938, FATCA or specified foreign financial assets. No constant or formula to compare.
- **IRS Direct File (commit e365f9f434).** It does not support Form 8938. `backend/src/main/resources/tax/income.xml` has only the Schedule B question (`/hasForeignAccounts`, `/isForeignTrustsGrantor`) as a yes/no fact, with no threshold or value rule.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Who files (thresholds, joint valuation) | published examples with numbers (Examples 2–11) |
| Header, line 3, line 4 | stated rule |
| Part I and Part II (counts, totals, Yes/No) | stated rule |
| Line 23 and line 32 values, ranges, currency lines 24–25 and 33–34 | stated rule |
| Lines 20–22, 26–31, 35, 36 (descriptions, boxes, addresses, GIIN) | stated rule |
| Part III amounts (interest, dividends, gains, deductions) | own reading (tie to the return's own lines) |
| Part III credits | own reading (question 4) |
| Part III royalties | unsupported when present (question 7) |
| Part IV | stated rule (counts are the taxpayer's answer) |
| Schedule B line 7a, 7b | stated rule; question 2 own reading (question 11) |
