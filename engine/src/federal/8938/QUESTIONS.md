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
- Default: the fact's `conversion.exchangeRate` is the Treasury rate on December 31; a statement rate the taxpayer chooses goes in the same field.
- Dollars: yes, on lines 23 and 32, and the threshold test. No tax amount changes.

## 14. An asset not in an account: the year-end value as the maximum

- Text: "you may use the value ... as of the last day of the tax year, unless you know or have reason to know ... the value does not reflect a reasonable estimate of the maximum value" (`valuing-other-specified::b01`, Example 15).
- Default: line 32 prints the fact's `maximumValue`. Cade records the known highest value; the year-end value only when no higher value is known.
- Dollars: yes, on lines 11 and 32. No tax amount changes.

## Second opinions

- **Blind fill (14 cases).** Every value agrees but one: case 8, line 23. The harness printed the would-be line 23 ($71,765) for a return under the threshold; the engine does not file the form there (`resolveInfo.ts` builds no lines when `mustFile` is false), so the line is blank, as in the blind fill. Both read €61,000 / 0.85 = $71,765 (`currency-determination-date::b01`).
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
