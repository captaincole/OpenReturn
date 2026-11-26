# Form 8828 — open questions

Form 8828 figures the tax that pays back a federal mortgage subsidy when a home bought with a
tax-exempt bond loan or a mortgage credit certificate is sold within 9 years. The text is
`irs-8828-inst-2025` (Rev. November 2024) and the form face `irs-8828-face-2025`. No IRS text
has a worked example with numbers. The only numeric examples are in two issuers' notices
(see the `melaine` README).

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

- **A18. A sale more than 9 years after the closing files no Form 8828.** Who-must-file has no
  time limit; the recapture section and the 9-line table do. `DECISION` comment in `lines.ts`
  (`withinRecapturePeriod`). Dollars: none (the tax is 0 either way); only whether the form
  prints.
- **A19. Line 18 rounds to the nearest whole percent.** The form: "Round to the nearest whole
  percentage" (`irs-8828-face-2025::sec::face-part-ii::b01`). The NJ HMFA notice: "1 percent for
  each $50", which counts only whole $50 steps. The form's own instructions decide. `DECISION`
  comment in `lines.ts` (`incomePercentage`). Dollars: up to 1% of line 21 ($118 in `melaine`).

## Should we do this now

Each is a doubt with no conflicting text. The engine's reading is in the code now, unless the
item says why not.

1. **Line 7, full months.** "Number of years and full months between original closing date
   (line 5) and date of sale" (`irs-8828-face-2025::sec::face-part-i::b02`). Done: a month is
   full when the sale's day of the month is on or after the closing's day (the Form 4797 rule,
   `fullMonthsBetween`). Changes no dollars.
2. **The table's line at an exact anniversary.** "the line that corresponds to the number of
   full and partial years that you held your home" (`line-16::b01`, `b02`). Done: a sale on the
   5th anniversary is 5 years; one day later is 6. On the 9th anniversary the engine reads row 9
   (inside "the first 9 years", `recapture-tax::b01`), so the form files. The blind fill made the
   same choice (blind case 11: a tax of $2,950, not $0).
3. **Worksheet line C for a repayment on the closing day.** "Round up to the nearest whole year"
   (`holding-period-percentage-worksheet::b01`). Zero years has no row on line D. Done: the
   engine uses 1 year (20%). Very rare.
4. **A repayment on the 4th anniversary uses the worksheet.** "more than 4 years after the
   closing date ... do not use this worksheet" (`holding-period-percentage-worksheet::b01`);
   line 20: "within 4 years" (`line-20::b01`). The two agree: exactly 4 years is within 4 years.
   Done: line C is 4 (80%).
5. **Line 19 for a part interest.** "figure the actual recapture tax separately for each, based
   on the interest of each in the home" (`special-rules::b02`). Lines 9, 10 and 12 say "your
   interest"; line 19 does not. Done: the notice's amount times the ownership share.
6. **A joint return is one filer.** The two-owner rule names separate people (Dwaine and his
   daughter). Done: spouses on one joint return file one form for their joint interest. Changes
   no dollars.
7. **Line 15, tax-exempt interest.** "Add: Any tax-exempt interest that you received or accrued
   for the tax year" (`line-15::b01`). Done: Form 1040 line 2a.
8. **Line 15, the gain in income.** "Subtract: Any gain included in your gross income because
   of the disposition of your home" (`line-15::b01`). Done as an answer: the sale fact states it
   (`gainIncludedInIncome`). Figuring it needs a home-sale fact; see the proposal below.
9. **Line 15 with two homes.** Each copy subtracts only the gain of its own home ("your home").
   Not changed now: two subsidized homes sold in one year is very rare, and no text says to
   subtract both.
10. **Lines after a stop.** Line 13 "If a loss, stop here"; line 17 "If zero or less, stop here"
    (`face-part-ii::b01`). Done: every later line is blank, lines 19 and 20 too. A gain of
    exactly 0 is not a loss: line 14 is 0 and the tax is 0.
11. **Line 8 when the loan was not repaid.** The buyer may assume a QMB loan. Done: line 8 is
    blank and the worksheet does not apply.
12. **Line 3 in one box.** The widget is one text field under three captions (state, political
    subdivision, agency). Done: the three joined by commas.
13. **Schedule 2 may file empty.** Schedule 2 files when the facts allow a tax above 0. Line 17
    needs AGI, which the resolvers do not have, so a return whose line 17 is zero or less still
    files Schedule 2 with line 17b blank. Not changed now: no dollars change, and a fix needs
    AGI in the resolvers.
14. **Exceptions the engine does not test.** A transfer to a spouse incident to divorce, a
    casualty with the home replaced on its site, and (in the issuers' notices, not in the IRS
    text) a disposition at death: no recapture. Not changed now: Cade records no sale fact for
    them, so the engine never sees them.
15. **Line 18 at exactly half a percent.** "Round to the nearest whole percentage"
    (`face-part-ii::b01`) does not say which way a half goes. Done: a half rounds up
    (`roundToPlaces`), as the IRS rounds 50 cents up. Blind case 15: line 17 of $25 is 0.5%, so
    line 18 is 1% and the tax is $118, not $0.
16. **More than one sold home.** Done (2026-11-25): one Form 8828 for each sold home that files,
    with the copies mechanism; Schedule 2 line 17b adds every copy's line 23
    (`tests/unit/federal/8828/copies.test.ts`).
17. **Schedule 2 prints no name.** Schedule 2 leaves its name line blank on every return
    (its own `unsupported` list). Not changed now: it is Schedule 2's rule, not this form's, and
    a fix changes every Schedule 2 golden.

## Pattern change

None. The copies follow the pattern of Forms 6252 and 8824: before, a second home made every
line unsupported. After, each home prints its own copy and Schedule 2 adds them.

## Proposals for a discussion

- **A home-sale fact.** Line 15 subtracts the gain included in income from the sale. Today the
  taxpayer states it. A home-sale fact (price, expenses, basis, the section 121 exclusion from
  Pub. 523) would figure it once and feed both Form 8949 and Form 8828 lines 9 to 13. That is a
  new kind of input that other forms would read, so it waits for a discussion.
- **A qualifying subordinate mortgage loan.** Line 13 then needs "QSML" on the dotted line and
  an attached worksheet. The engine marks lines 13 to 23 unsupported. It needs a way to print
  a note next to a line and an attached statement.

## Second opinions

- **Blind fill (2026-11-25).** A preparer filled 15 cases by hand from the blank form and the
  instructions only. Every line matched the engine (`lines.ts`), blanks included: no dollar
  difference and no blank-against-0 difference. The blind doubts that change dollars are items
  2, 4, 5 and 15 above, and the decided 9-year rule.
- **PolicyEngine-US 2.154.0 (commit 363e9fc5e4).** It does not model Form 8828: no variable or
  parameter for the mortgage subsidy recapture, the mortgage credit certificate or Form 8396
  under `gov/irs`. Nothing to compare.
- **Other implementations.** The repository names no other reference implementation for this
  form, so none was compared.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I, lines 1 to 6 and 8 (from the notice and the sale) | stated rule |
| Line 7, years and full months | own reading (item 1) |
| Lines 9 to 14 | stated rule |
| Line 15 | stated rule; the gain in income is an answer (item 8) |
| Lines 16 and 20, the notice's table | stated rule; own reading at the anniversary (item 2) |
| Line 20, the worksheet | stated rule; own reading at the edges (items 3, 4) |
| Line 17, line 18 | published example with numbers (issuers' notices) and stated rule (A19) |
| Line 19 | stated rule; own reading for a part interest (item 5) |
| Lines 21 to 23, Schedule 2 line 17b | stated rule; one copy for each home (item 16) |
| QSML | unsupported |
