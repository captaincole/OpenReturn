# FTB 5870A: open questions

FTB 5870A figures California's extra tax on trust income that a trust kept in earlier years and pays out this year. Part I is the federal throwback rule (IRC section 667) for a trust that paid California tax. Part II spreads a distribution to a contingent beneficiary over the earlier years (R&TC section 17745(b) and (d)). Part III adds the Behavioral Health Services Tax on the recomputed income. The instructions publish no example with numbers. Block ids are in `ca-5870a-inst-2025::sec::` unless the item names another document.

## Two texts conflict

### 1. Income kept before age 21 in Part I (decided)

- Text A: "Except as explained above, use the instructions for federal Form 4970 to compute the partial tax" (`california-does-not-follow-the-federal-rules-for::b01`). Form 4970 line 2 takes out the income kept before the beneficiary was born or reached 21 (`irs-4970-form-2025::sec::line-2::b01`). Schedule J (541) Part I says the same.
- Text B: line 1 is the total "from Schedule J (541), line 30, column (a)" (`ca-5870a-face-2025::sec::face-part-i::b01`).
- Decided: Text A. Row A33 of `docs/rule-decisions.md` and the `DECISION` comment in `partI.ts`.
- Dollars: $2,307 of partial tax for `cenn`; Text B gives $2,580.

## Doubts with no conflicting text

### 2. The earlier years' Tax Table (own reading, no dollars)

- Text: "Use the California tax tables included in the personal income tax booklets for prior years" (`part-i-tax-on-accumulation-distribution::b05`).
- Default: up to $100,000 the engine figures the table row: the rate schedule's tax on the row's whole-dollar midpoint, rounded to the nearest dollar. This matches every row of the printed 2020 to 2025 tables in all three columns (checked on 2026-11-25 against the FTB PDFs). Above $100,000 it uses the rate schedule, as the booklets do.

### 3. Part-year resident years in Part II (stated rule)

- Text: "Check 'Yes' in each column for the years that you were either a California resident or part-year resident" (`section-a::b02`); line 7 uses "the tax rates in effect for the earlier year" (`section-a::b03`).
- Default: a part-year year is "Yes" and is refigured like a resident year. Its taxable income and tax are the ones the taxpayer states from Form 540NR (lines 19 and 31, before the California proration). Dollars: yes, against any reading that prorates.

### 4. A "No" year's column in Part II (no dollars)

- Text: line 14 adds only the "Yes" years; "Do not include any amounts for any year that you checked 'No'" (`section-a::b04`).
- Default: a "No" column holds only its "No"; lines 4 to 13 stay blank.

### 5. Credit lines 18, 10 and 12 (no dollars)

- Text: "If the net change results in an increase in allowable credits, subtract line 18 from line 17. If ... a decrease ..., add line 18 and line 17" (`part-i-tax-on-accumulation-distribution::b05`).
- Default: the taxpayer states the change with its sign; the credit line prints its size and the next line subtracts or adds it.

### 6. Part III's columns (no dollars)

- Text: complete Part III when a recomputed income is over $1,000,000, with "the entries for all years you checked 'Yes'" (`section-a-2::b01`).
- Default: when one "Yes" year is over $1,000,000, every "Yes" year gets a column; a year at or under prints 0. Line 4, the tax already paid, is 0 when the year's taxable income was $1,000,000 or less; above that the engine asks for it.

### 7. Ties on line 12 (dollars only with different rates)

- Text: "eliminating the highest and lowest taxable income years" (the form).
- Default: as Form 4970: a tie drops the first of the tied years in line 11's order.

### 8. No throwback year left in Part I (no dollars)

- Default: when every throwback year is before age 21, lines 1 to 10 are 0, lines 11 to 21 stay blank, lines 22 to 26 are 0, and Form 540 line 34 stays blank.

### 9. Rounding (a few dollars)

- Default: lines 7, 8, 10 and 23 of Part I, and Part II lines 2 and 4, round to the nearest dollar (CLAUDE.md). Line 9 compares each year's column (a) amount with the rounded line 8; a year equal to line 8 stays ("is less than").

### 10. Header SSN on a joint return (no dollars)

- Default: the beneficiary's number, the spouse's when the spouse is the beneficiary, as Form 4970.

### 11. Form 540 line 34 with a tax of 0 (no dollars)

- Default: line 34 stays blank and its FTB 5870A box is not checked when the form's tax is 0 and Schedule G-1 does not file. Part II line 14 is not floored at 0; the form gives no floor.

### 12. Schedule CA line 8z (no dollars)

- Text: "Identify the type of income reported in the space provided" (`ca-540-sched-ca-inst-2025::sec::line-8-other-income::b05`).
- Default: the label is "Trust accumulation distribution".

### 13. Who files (stated rule)

- A trust fact files FTB 5870A on a Form 540 return when its California answers name Part I ("schedule_j") or Part II ("contingent"). A trust with a federal Schedule J (Form 1041) and no California answers still files, and the form asks for the trust fact again. A noncontingent beneficiary of a trust that did not file Form 541 or pay the tax files no FTB 5870A: the whole amount goes on Schedule CA line 8z column C (`purpose::b02`).
- A foreign trust follows the same answers: "Report the accumulation distributions from foreign trusts and from certain domestic trusts on form FTB 5870A" (`general-information::b02`).
- The multiple trust rule: the beneficiary states how many other trusts count in each year, as for Form 4970. The engine does not test the $1,000 rule itself.

## Unsupported

- More than one trust: each later trust's line 11 includes the amounts the earlier ones throw back (`part-i-tax-on-accumulation-distribution::b04`).
- A Part I computation year as a nonresident or part-year resident: lines 12 to 20 are skipped and line 21 comes from a Form 540NR refigured for that year (`part-i-tax-on-accumulation-distribution::b01`).
- A Part II capital gain distribution: each year's capital loss must be refigured (`section-a::b03`).
- A distribution that changes a year's net operating loss (`section-a::b02`).
- A throwback year in which the beneficiary turned 21, or a year before 21 under the multiple trust rule (the Form 4970 gaps).
- A Form 540NR filer: Form 540NR has no rules yet, so FTB 5870A files only with Form 540.

## Proposals for a discussion

- **The trustee's statement for Part II.** "If you did not receive a Schedule J (541), you must contact the trustee" for the years and the total (`part-ii-tax-on-distributions-of-previously-untaxed-trust-income::b01`). No official form holds it, so the made-up taxpayer `bode` states the two numbers from a letter and no document is generated. A person should decide what that letter looks like before the product reads one.
- **More than one trust.** Chain the copies: each copy's line 11 adds the line 10 amounts of the copies before it for the same years.
- **Form 540NR.** Bind line 41 and line 72 when Form 540NR has rules, and refigure a nonresident year's Part I column through it.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Part I lines 1 to 10 | stated rule (form arithmetic); own reading on age 21 (item 1) |
| Part I line 11 and line 12 | stated rule; own reading on ties (item 7) |
| Part I lines 15, Part II lines 7 and 9 | stated rule with the FTB rate schedules; the table rule is checked against every printed row (item 2) |
| Part I lines 16, 18, 20; Part II lines 8, 10, 12 (Section B 10, 12, 14) | stated amounts (item 5) |
| Part I lines 17, 19, 21 to 26 | stated rule (form arithmetic) |
| Part II lines 1 to 6, 11, 13, 14; Section B lines 1 to 8, 11, 13, 15, 16 | stated rule; own reading for part-year years (item 3) |
| Part III | stated rule; own reading on the columns (item 6) |
| More than one trust, a nonresident Part I year, a capital gain distribution, a changed NOL | unsupported |
