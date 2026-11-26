# Form 8828 — open questions

Form 8828 figures the tax that pays back a federal mortgage subsidy when a home bought with a
tax-exempt bond loan or a mortgage credit certificate is sold within 9 years. The text is
`irs-8828-inst-2025` (Rev. November 2024) and the form face `irs-8828-face-2025`. No IRS text
has a worked example with numbers. The only numeric examples are in two issuers' notices
(see the `melaine` README).

## Decided (see `docs/rule-decisions.md`)

- **A sale more than 9 years after the closing files no Form 8828.** Who-must-file has no time
  limit; the recapture section and the 9-line table do. `DECISION` comment in `lines.ts`
  (`withinRecapturePeriod`). Dollars: none in practice (the tax is 0 either way); only whether
  the form prints.

## Doubts with no conflicting text

1. **Line 7, full months.** "Number of years and full months between original closing date
   (line 5) and date of sale" (`irs-8828-face-2025::sec::face-part-i::b02`). The engine counts
   a month as full when the sale's day of the month is on or after the closing's day (the
   Form 4797 rule, `fullMonthsBetween`). Changes no dollars.
2. **The table's line at an exact anniversary.** "the line that corresponds to the number of
   full and partial years that you held your home" (`line-16::b01`, `b02`). A sale on the 5th
   anniversary is 5 years; one day later is 6. Changes dollars at the anniversary only (line 16
   and line 20 move one row). On the 9th anniversary it also decides whether the form files:
   the engine reads exactly 9 years as row 9 (inside "the first 9 years", `recapture-tax::b01`),
   so the form files. The blind fill made the same choice (blind case 11: a tax of $2,950, not
   $0).
3. **Worksheet line C for a repayment on the closing day.** "Enter the number of years between
   the dates on lines A and B. Round up to the nearest whole year"
   (`holding-period-percentage-worksheet::b01`). Zero years has no row on line D; the engine
   uses 1 year (20%). Changes dollars; the case is very rare.
4. **A repayment on the 4th anniversary uses the worksheet.** "If the repayment date on line B
   is more than 4 years after the closing date on line A, do not use this worksheet"
   (`holding-period-percentage-worksheet::b01`); line 20 says "within 4 years"
   (`line-20::b01`). Exactly 4 years is not more than 4 years: line C is 4 (80%). Changes
   dollars at that one date.
5. **Line 19 for a part interest.** "figure the actual recapture tax separately for each, based
   on the interest of each in the home" (`special-rules::b02`) and "You must report all required
   information for your interest in the home" (`part-ii-computation-of::b01`). Lines 9, 10 and
   12 say "your interest"; line 19 does not. The engine multiplies the notice's amount by the
   ownership share. Changes dollars for a co-owner outside the return.
6. **A joint return is one filer.** The two-owner rule names separate people (Dwaine and his
   daughter). Spouses on one joint return file one form for their joint interest. Changes no
   dollars.
7. **Line 15, tax-exempt interest.** "Add: Any tax-exempt interest that you received or accrued
   for the tax year" (`line-15::b01`). The engine adds Form 1040 line 2a. Same amount in the
   usual case.
8. **Line 15, the gain in income.** "Subtract: Any gain included in your gross income because
   of the disposition of your home" (`line-15::b01`). The sale fact states it
   (`gainIncludedInIncome`): the engine has no home-sale fact that figures the section 121
   exclusion. See the proposal below.
9. **Lines after a stop.** Line 13 "If a loss, stop here"; line 17 "If zero or less, stop here"
   (`face-part-ii::b01`). The engine leaves every later line blank, lines 19 and 20 too. A gain
   of exactly 0 is not a loss: line 14 is 0 and the tax is 0. Changes no dollars.
10. **Line 8 when the loan was not repaid.** The buyer may assume a QMB loan. The sale fact then
    has no repayment date and line 8 is blank; the worksheet does not apply. Changes no dollars.
11. **Line 3 in one box.** The widget is one text field under three captions (state, political
    subdivision, agency). The engine prints them joined by commas. Changes no dollars.
12. **Schedule 2 may file empty.** Schedule 2 files when the facts allow a tax above 0 (a gain,
    and lines 19 and 20 above 0). Line 17 needs AGI, which the resolvers do not have, so a
    return whose line 17 is zero or less still files Schedule 2 with line 17b blank. Changes no
    dollars.
13. **Exceptions the engine does not test.** A transfer to a spouse incident to divorce, a
    casualty with the home replaced on its site, and (in the issuers' notices, not in the IRS
    text) a disposition at death: no recapture. Cade records no sale fact for them. Changes the
    whole tax when a sale fact is recorded by mistake.
14. **Issuer notices that round line 18 another way.** The NJ notice: "1 percent for each $50".
    The form: "Round to the nearest whole percentage". The form's own instructions decide. At most
    1% of line 21.
15. **Line 18 at exactly half a percent.** "Round to the nearest whole percentage"
    (`irs-8828-face-2025::sec::face-part-ii::b01`); the instructions have no line 18 text and
    do not say which way a half goes. The engine rounds a half up (`roundToPlaces`), the same
    way the IRS rounds 50 cents to the next dollar. Blind case 15: line 17 of $25 is 0.5%, so
    line 18 is 1% and the tax is $118, not $0. The blind fill made the same choice.

## Second opinions

- **Blind fill (2026-11-25).** A preparer filled 15 cases by hand from the blank form and the
  instructions only. Every line matched the engine (`lines.ts`), blanks included: no dollar
  difference and no blank-against-0 difference. The blind doubts that change dollars are
  doubts 2, 4, 5 and 15 above, and the decided 9-year rule.
- **PolicyEngine-US 2.154.0 (commit 363e9fc5e4).** It does not model Form 8828: no variable or
  parameter for the mortgage subsidy recapture, the mortgage credit certificate or Form 8396
  under `gov/irs`. Nothing to compare.
- **Other implementations.** The repository names no other reference implementation for this
  form, so none was compared.

## Proposals for a discussion

- **A home-sale fact.** Line 15 subtracts the gain included in income from the sale. Today the
  taxpayer states it. A home-sale fact (price, expenses, basis, the section 121 exclusion from
  Pub. 523) would figure it once and feed both Form 8949 and Form 8828 lines 9 to 13. That is a
  new kind of input that other forms would read, so it waits for a discussion.
- **More than one sold home.** Each home files its own Form 8828; the engine prints one copy
  and marks every line and Schedule 2 line 17b unsupported with two. Printing copies is the
  pattern the forms that repeat need (issue #174).
- **A qualifying subordinate mortgage loan.** Line 13 then needs "QSML" on the dotted line and
  an attached worksheet. The engine marks lines 13 to 23 unsupported. It needs a way to print
  a note next to a line and an attached statement.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I, lines 1 to 6 and 8 (from the notice and the sale) | stated rule |
| Line 7, years and full months | own reading (doubt 1) |
| Lines 9 to 14 | stated rule |
| Line 15 | stated rule; the gain in income is an answer (doubt 8) |
| Lines 16 and 20, the notice's table | stated rule; own reading at the anniversary (doubt 2) |
| Line 20, the worksheet | stated rule; own reading at the edges (doubts 3, 4) |
| Line 17, line 18 | published example with numbers (issuers' notices) and stated rule |
| Line 19 | stated rule; own reading for a part interest (doubt 5) |
| Lines 21 to 23, Schedule 2 line 17b | stated rule |
| QSML, more than one home | unsupported |
