# Form 4970: open questions

Form 4970 figures the extra tax on trust income that a trust kept in earlier years and pays out this year. The instructions publish no example with numbers. Each rule below rests on the stated text. Block ids are in `irs-4970-form-2025::sec::` unless the item names another document.

## Two texts conflict

### 1. The years before age 21 on lines 4, 6, 8 and 11 (decided)

- Text A, the lines' own labels: line 4 "Taxes imposed on the trust on amounts from line 3", line 8 "earlier tax years in which amounts on line 7 are considered distributed" (`face-part-i::b01`).
- Text B, the sources the same lines name: Schedule J (Form 1041) line 37, columns (b) and (c), and "the 'throwback years' for which there are entries on lines 32 through 36" (`line-8::b01`).
- Decided: Text A, because line 9 averages line 3 over line 8. Row A18 of `docs/rule-decisions.md` and the `DECISION` comment in `lines.ts`.
- Dollars: $1,512 of partial tax for `seaine`; Text B gives $0.

## Should we do this now

### 2. Who files (done)

- Text: "Beneficiaries who received an accumulation distribution from certain domestic trusts that were created before March 1, 1984, must file Form 4970. For details, see section 665(c)." (`who-must-file::b01`)
- Done: a domestic trust created before March 1, 1984, whose Schedule J Part IV shows a throwback year, files the form. "Certain" is not tested: the trustee issues Part IV only when the throwback rules apply to the trust.
- A domestic trust that used to be foreign: the text sends the reader to Rev. Rul. 91-6. Not now: the library does not hold the ruling, so the form is a gap.

### 3. No year left on line 8 (done)

- Text: line 2 takes the UNI "accumulated before you were born or reached age 21" (`line-2::b01`). The form does not say what happens when every throwback year is before 21.
- Done: line 8 is 0, lines 9 to 27 stay blank, and line 28 is 0. The blind fill printed 0 on lines 11 and 27 for the same case: blank against 0 only, no dollars.

### 4. Ties on line 14 (done)

- Text: "Enter the amounts from line 13, eliminating the highest and lowest taxable income years" (`face-part-ii::b01`).
- Done: when two years tie, the engine drops the first of them in line 13's order (the most recent year). No text says which; dollars change only when the tied years have different rates, filing status or line 18 tax.

### 5. The age 21 test (done, with a gap)

- Text: line 2 is the UNI "accumulated before you were born or reached age 21" (`line-2::b01`).
- Done: a throwback year counts in full when the beneficiary reached 21 after December 31 of that year. A person reaches an age the day before the birthday (`birthDate.ts`). A throwback year in which the beneficiary reached 21 is a gap: the text does not say how to split it.

### 6. Header B on a joint return (done)

- Text: "B Social security number" (the form face); item F is the "Beneficiary's date of birth".
- Done: B is the beneficiary's number, the spouse's when the spouse is the beneficiary. No dollars.

### 7. Line 17: rate schedules, not tax tables (done)

- Text: "Use the Tax Rate Schedules, etc., as applicable" (`line-17::b01`). The earlier years' Form 1040 instructions use the Tax Table below $100,000, but they speak to that year's return, not to this refiguring.
- Done: the form's own instruction decides (`docs/rule-decisions.md`, first principle). Line 18, the tax as filed, may come from a tax table. A few dollars on line 19 for a year under $100,000.

### 8. Line 17 with capital gain income (done, with gaps)

- Text: "etc., as applicable" (`line-17::b01`); the distribution "loses its character" except tax-exempt interest (`who-must-file::b02`).
- Done: the year's qualified dividends and net capital gain keep the capital gain rates; the distribution is ordinary income stacked below them, through that year's Qualified Dividends and Capital Gain Tax Worksheet. Not now: a year taxed by the Schedule D Tax Worksheet, Form 8615, Form 2555 or Schedule J (Form 1040) is a gap, because each needs that year's full worksheet.

### 9. The multiple trust rule (done, with a gap)

- Text: "only count as trusts those trusts for which the sum of this accumulation distribution and any earlier accumulation distributions from the trust ... is $1,000 or more" (`line-4::b01`).
- Done: the beneficiary states, for each throwback year, how many other trusts count. With two or more, that year's taxes leave line 4, and so lines 5, 7 and 27. The year still counts on line 8. The engine does not test the current trust against the $1,000.
- Not now: line 2 says "if the multiple trust rule applies, see the instructions for line 4" (`line-2::b01`), and the line 4 text says nothing about line 2. A year before 21 under the rule is a gap.

### 10. Lines 20 and 22 are stated amounts (done)

- Text: line 20, "enter the increase" in credits, refigured on "the proper form" (`line-20::b01`); line 22, "use and attach that year's Form ... 6251" (`line-22::b01`).
- Done: the beneficiary states each amount; absent, the line is blank and counts as 0. Not now: refiguring earlier years' credits and AMT would need each year's whole return.

### 11. Line 1 for a nonresident alien (not now)

- Text: "For a nonresident alien ... include only the part ... attributable to U.S. sources" (`line-1::b01`).
- The engine reads Part IV as the amount for line 1. It does not prepare a nonresident return, so no dollars on a resident's return.

### 12. Rounding (done)

- Done: lines 9, 10, 12 and 25 round to the nearest dollar (CLAUDE.md). Line 11 compares each year's column (a) amount with the rounded line 10, "the amount on line 10 of Form 4970" (`line-11::b01`); a year equal to line 10 stays ("is less than"). Line 26 multiplies the rounded line 25.
- The blind fill compared with line 10 before rounding. The two readings differ only when line 10 ends in 25 cents and a year's distribution equals the dollars below it ($2,500.25 against $2,500). The printed amount is what the text names, so the engine keeps its reading.

### 13. California's FTB 5870A (done: a visible gap)

- Text: "If you received accumulation distributions from foreign trusts or from certain domestic trusts, get form FTB 5870A" (`ca-540-inst-2025::sec::line-34-tax-from-schedule-g-1-and-form-ftb-5870a::b01`); FTB 5870A covers "a foreign trust and certain domestic trusts" (`ca-5870a-inst-2025::sec::purpose::b01`).
- Done: a trust fact with a throwback year on a Form 540 return files FTB 5870A, foreign or domestic, and Form 540 line 34 is unsupported until FTB 5870A has rules. California's "certain domestic trusts" (R&TC 17745) is not the federal test, so the engine does not apply the March 1, 1984 limit there; the line is a gap, so a broad test drops nothing.
- Later done: FTB 5870A has rules (`state/ca/5870a/QUESTIONS.md`). A trust fact with a federal throwback year and no California answers files FTB 5870A and asks for them; Form 540 line 34 and its FTB 5870A box take the form's tax. Form 540NR line 41 waits for Form 540NR's rules.

### 14. More than one trust, estate taxes, foreign trusts (not now)

- See "Proposals for a discussion". Each case is a gap on the form and on Schedule 2 line 17l, so the tax is never silently left off.

## Pattern change

### 15. A fact for an earlier year's return

- Before: no fact held what an earlier year's return showed; every form read only this year's facts.
- After: `earlier_year_return.<year>` holds the taxable income, tax before credits and filing status the taxpayer states from a filed return (Form 4970 lines 13 and 18); the product does not read last year's return yet (#79).

### 16. Rate schedules for earlier years

- Before: the engine held tax rates for 2025 only.
- After: `engine/src/data/earlierYearRates.ts` holds the 2020 to 2024 rate schedules and capital gain ceilings for line 17, checked against PolicyEngine.

## Proposals for a discussion

- **More than one trust in a year.** Each trust files its own form, and line 13 of each later trust includes the amounts the earlier trusts' forms throw back (`line-13::b01`). The engine evaluates each copy alone, so it makes the forms and line 17l a gap. A fix would chain the copies: each copy's line 13 adds the line 15 amounts of the copies before it for the same years.
- **Estate and generation-skipping taxes.** Line 28 is "reduce[d] ... proportionately" by section 667(b)(6) (`line-28::b01`). The instructions do not give the formula, and the library does not hold the Code. Line 28 and line 17l are a gap until section 667(b)(6) is in the corpus.
- **Foreign trusts.** The tax goes on Form 3520 (`who-must-file::b01`), with Form 4970 as its worksheet. The engine has no Form 3520, so line 17l is a gap for a foreign trust.

## Second opinions

- **Blind fill (2026-11-25).** A preparer filled 14 cases by hand from the blank form and the instructions only. Every dollar amount matched the engine. The only differences were blank against 0 on lines 11 and 27 in the case with no year on line 8 (item 3). The preparer's doubts that change dollars are items 1, 4, 7, 8, 9 and 12 here.
- **PolicyEngine-US 2.154.0** (commit 363e9fc5, 2026-11-25). It does not model Form 4970 or the throwback rules. It does hold the constants line 17 uses: all 207 of `data/earlierYearRates.ts` match its `income/bracket.yaml` and `capital_gains/thresholds.yaml`, with the surviving spouse on the joint table. Its capital gain formula (`capital_gains_tax`) has the same steps as `earlierYearTax.ts`. It also taxes 25% and 28% rate gain; the engine makes such a year a gap (item 8).
- **IRS Direct File.** It does not cover trust distributions or Form 4970. Not compared.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header A to G | stated rule |
| Lines 1, 3, 5, 7 | stated rule (form arithmetic) |
| Line 2 | stated rule; own reading of the age test (item 5) |
| Lines 4, 6, 8, 11 | own reading (decision A20) |
| Lines 9, 10, 12 | stated rule |
| Line 13 | stated rule |
| Lines 14 to 16 | stated rule; own reading on ties (item 4) |
| Line 17 | stated rule with the Rev. Proc. rate tables; own reading for capital gain years (item 8) |
| Lines 18, 20, 22 | stated amounts (item 10) |
| Lines 19, 21, 23 to 28 | stated rule (form arithmetic) |
| Line 28 with estate or GST tax | unsupported |
| More than one trust; a foreign trust | unsupported |
