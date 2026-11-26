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
- Default: the beneficiary states, for each throwback year, how many other trusts count. With two or more, that year's taxes leave line 4. The engine does not test the current trust against the $1,000.
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

- Default: lines 9, 10, 12 and 25 round to the nearest dollar (CLAUDE.md). Line 11 compares each year's column (a) amount with the rounded line 10; a year equal to line 10 stays ("is less than", `line-11::b01`).
- Dollars: at most a dollar on lines 12 and 25, multiplied on line 26.

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
