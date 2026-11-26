# Form 4970: open questions

Form 4970 figures the extra tax on trust income that a trust kept in earlier years and pays out this year. The instructions publish no example with numbers. Each rule below rests on the stated text. Block ids are in `irs-4970-form-2025::sec::`.

The decision on lines 4, 6, 8 and 11 (the years before age 21) is row A18 of `docs/rule-decisions.md` and the `DECISION` comment in `lines.ts`.

## 1. Who files

- Text: "Beneficiaries who received an accumulation distribution from certain domestic trusts that were created before March 1, 1984, must file Form 4970. For details, see section 665(c)." (`who-must-file::b01`)
- Default: a domestic trust created before March 1, 1984, whose Schedule J Part IV shows a throwback year, files the form. "Certain" is not tested: the trustee issues Part IV only when the throwback rules apply to the trust.
- A domestic trust that used to be foreign: the text sends the reader to Rev. Rul. 91-6. The engine makes the form a gap.
- Dollars: none for a trust whose trustee issued Part IV correctly.

## 2. No year left on line 8

- Text: line 2 takes the UNI "accumulated before you were born or reached age 21" (`line-2::b01`). The form does not say what happens when every throwback year is before 21.
- Default: line 8 is 0, lines 9 to 27 stay blank, and line 28 is 0.
- The blind fill (2026-11-25) printed 0 on line 11 and on line 27 (a copy of line 4, which is 0) for the same case. That is blank against 0 only.
- Dollars: none. The whole distribution is out of the tax.

## 3. Ties on line 14

- Text: "Enter the amounts from line 13, eliminating the highest and lowest taxable income years" (`face-part-ii::b01`).
- Default: when two years tie, the engine drops the first of them in line 13's order (the most recent year).
- Dollars: yes, when the tied years have different rates, filing status or line 18 tax.

## 4. The age 21 test

- Text: line 2 is the UNI "accumulated before you were born or reached age 21" (`line-2::b01`).
- Default: a throwback year counts in full when the beneficiary reached 21 after December 31 of that year. A person reaches an age the day before the birthday, as on the other forms (`birthDate.ts`). A throwback year in which the beneficiary reached 21 is a gap: the text does not split it. The engine reads each throwback year as a calendar year.
- Dollars: yes, only for the year of the 21st birthday (a gap, so nothing is wrong silently).

## 5. Header B on a joint return

- Text: "B Social security number" (the form face). Item F is the "Beneficiary's date of birth".
- Default: B is the beneficiary's number: the spouse's when the spouse is the beneficiary.
- Dollars: none.

## 6. Line 17: rate schedules, not tax tables

- Text: "Use the Tax Rate Schedules, etc., as applicable" (`line-17::b01`). The earlier years' Form 1040 instructions use the Tax Table below $100,000.
- Default: the form's own instruction decides (docs/rule-decisions.md, first principle). The engine uses the rate schedules of each year for every amount. Line 18, the tax as filed, may come from a tax table.
- Dollars: a few dollars on line 19 for a year under $100,000.

## 7. Line 17 with capital gain income

- Text: "etc., as applicable" (`line-17::b01`); the distribution "loses its character" except tax-exempt interest (`who-must-file::b02`).
- Default: the year's qualified dividends and net capital gain keep the capital gain rates; the distribution is ordinary income stacked below them. The engine runs the year's Qualified Dividends and Capital Gain Tax Worksheet with that year's ceilings. A year taxed by the Schedule D Tax Worksheet, Form 8615, Form 2555 or Schedule J (Form 1040) is a gap.
- Dollars: yes, for a computation year with capital gain income.

## 8. The multiple trust rule

- Text: "only count as trusts those trusts for which the sum of this accumulation distribution and any earlier accumulation distributions from the trust ... is $1,000 or more" (`line-4::b01`).
- Default: the beneficiary states, for each throwback year, how many other trusts count. With two or more, that year's taxes leave line 4, and so lines 5, 7 and 27. The year still counts on line 8: the rule removes the taxes, not the year. The engine does not test the current trust against the $1,000.
- Line 2 says "if the multiple trust rule applies, see the instructions for line 4" (`line-2::b01`), and the line 4 text says nothing about line 2. A year before 21 under the rule is a gap.
- Dollars: yes, the year's trust taxes.

## 9. Lines 20 and 22 are stated amounts

- Text: line 20, "enter the increase" in credits, refigured on "the proper form" (`line-20::b01`); line 22, "use and attach that year's Form ... 6251" (`line-22::b01`).
- Default: the beneficiary states each amount. Absent, the line is blank and counts as 0. The engine does not refigure earlier years' credits or AMT.
- Dollars: as stated.

## 10. Line 1 for a nonresident alien

- Text: "For a nonresident alien ... include only the part ... attributable to U.S. sources" (`line-1::b01`).
- Default: the engine reads Part IV as the amount for line 1. It does not prepare a nonresident return.
- Dollars: none on a resident's return.

## 11. Rounding

- Default: lines 9, 10, 12 and 25 round to the nearest dollar (CLAUDE.md). Line 11 compares each year's column (a) amount with the rounded line 10, "the amount on line 10 of Form 4970" (`line-11::b01`); a year equal to line 10 stays ("is less than"). Line 26 multiplies the rounded line 25.
- Other reading (the blind fill): compare with line 10 before it rounds. Line 10 is a quarter of a whole-dollar line 9, so the two readings differ only when line 10 ends in 25 cents and a year's distribution equals the dollars below it (line 10 = $2,500.25, a year of $2,500): the blind reading takes the year off line 11, the engine keeps it. The printed amount is what the text names, so the engine keeps its reading.
- Dollars: at most a dollar on lines 12 and 25, multiplied on line 26. In the 25-cent case above, one year on line 11, which changes line 12 and line 26.

## Second opinions

- **Blind fill (2026-11-25).** A preparer filled 14 cases by hand from the blank form and the instructions only. Every dollar amount matched the engine. The only differences were blank against 0 on lines 11 and 27 in the case with no year on line 8 (question 2). The preparer's doubts that change dollars are questions 2, 3, 6, 7, 8 and 11 here and decision A18. One more (line 2 blank with nothing before 21, line 6 at 0) changes no dollars, and the engine prints the same.
- **PolicyEngine-US 2.154.0** (commit 363e9fc5, 2026-11-25). It does not model Form 4970 or the throwback rules. It does hold the constants line 17 uses: all 207 of `data/earlierYearRates.ts` (the seven rates, six bracket tops for each of five filing statuses in 2020 to 2024, and the 0% and 15% capital gain ceilings) match its `income/bracket.yaml` and `capital_gains/thresholds.yaml`, with the surviving spouse on the joint table. Its capital gain formula (`capital_gains_tax`) has the same steps as `earlierYearTax.ts`: the 0%, 15% and 20% bands stacked on the ordinary part, then the smaller of that and the tax at ordinary rates on all of it. It also taxes 25% and 28% rate gain; the engine makes such a year a gap (question 7).
- **IRS Direct File.** It does not cover trust distributions or Form 4970, and no checkout is in reach. Not compared.

## Proposals for a discussion

- **More than one trust in a year.** Each trust files its own form, and line 13 of each later trust includes the amounts the earlier trusts' forms throw back (`line-13::b01`). The forms then depend on one another in the order the beneficiary picks. The engine today evaluates each copy alone, so it makes the forms and line 17l a gap. A fix would chain the copies: each copy's line 13 adds the line 15 amounts of the copies before it for the same years.
- **Estate and generation-skipping taxes.** Line 28 is "reduce[d] ... proportionately" by section 667(b)(6) (`line-28::b01`). The instructions do not give the formula, and the library does not hold the Code. Line 28 and line 17l are a gap until section 667(b)(6) is in the corpus.
- **Foreign trusts.** The tax goes on Form 3520 (`who-must-file::b01`), with Form 4970 as its worksheet. The engine has no Form 3520, so line 17l is a gap for a foreign trust.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header A to G | stated rule |
| Lines 1, 3, 5, 7 | stated rule (form arithmetic) |
| Line 2 | stated rule; own reading of the age test (question 4) |
| Lines 4, 6, 8, 11 | own reading (decision A18) |
| Lines 9, 10, 12 | stated rule |
| Line 13 | stated rule |
| Lines 14 to 16 | stated rule; own reading on ties (question 3) |
| Line 17 | stated rule with the Rev. Proc. rate tables; own reading for capital gain years (question 7) |
| Lines 18, 20, 22 | stated amounts (questions 9) |
| Lines 19, 21, 23 to 28 | stated rule (form arithmetic) |
| Line 28 with estate or GST tax | unsupported |
| More than one trust; a foreign trust | unsupported |
