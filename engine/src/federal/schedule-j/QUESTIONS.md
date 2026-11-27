# Schedule J (Form 1040): doubts and defaults

Each item says where the form and its instructions do not settle a rule, the
default the engine applies, and whether the default can change a dollar amount.

1. **The election amount is stated.** Source: "Your elected farm income is the
   amount of your taxable income from farming or fishing that you elect to
   include on line 2a" (irs-1040sj-inst-2025::sec::specific-instructions::b04).
   Default: the fact holds the amount; the engine caps it at line 1 and at 0.
   It does not check it against the farm's taxable income, which needs items
   from many forms (Schedule 1 line 15's farm part, S corporation wages, the
   CCF reduction; specific-instructions::b03). Changes dollars: no (the engine
   never raises or lowers a stated election below line 1).

2. **Line 4 and the capital gain of line 2b.** Source: line 4 says only to use
   the 2025 Tax Table, Tax Computation Worksheet, QDCG worksheet or Schedule D
   Tax Worksheet (line-4::b01). Default: the 2025 worksheet takes line 2b off
   the net capital gain (and line 2c off Schedule D line 19). A DECISION in
   `form.ts` records it (docs/rule-decisions.md). Changes dollars: yes, much
   (adine: $3,821 against $983).

3. **Base years with part of line 2b.** Source: "If your elected farm income
   includes net capital gain, you must use the 2022 Schedule D Tax Worksheet"
   (line-8::b01; line-12::b01, line-16::b01). Default: with no 25% or 28% rate
   gain, that worksheet gives the QDCG worksheet's tax, so the engine uses the
   year's QDCG worksheet with a third of line 2b added. With a third of line 2c,
   or a year that used the Schedule D Tax Worksheet, the line is unsupported:
   the corpus has no 2022 to 2024 Schedule D instructions. Changes dollars: no.

4. **The Taxable Income Worksheet's floors.** Source: line 2 "Subtract from
   that sum the amount of the loss on your ... Schedule D, line 16"; line 5
   "Subtract line 4 from line 1. Enter the result as a negative amount"
   (2022-taxable-income-worksheet-line-5::b01–b02). Default: lines 2 and 5 are
   at least 0. A line 4 above line 1 means the year's loss gives a benefit in
   another year, so the base is 0 (cfr-26-2025::sec::s1.1301-1::d-2-i). Changes
   dollars: only for inconsistent answers.

5. **Line 6 and the shares of lines 2b and 2c are rounded.** Source: "Divide
   the amount on line 2a by 3.0" (the face). Default: nearest dollar, as every
   calculated line. Changes dollars: at most $1 a year.

6. **Line 23 has no floor.** Source: "Subtract line 22 from line 18" (the
   face). Default: as the form says. A negative line 23 needs base-year taxes
   above the refigured ones, which consistent answers do not give. Changes
   dollars: no.

7. **No Schedule J box on Form 1040 line 16.** Source: line 16's boxes are
   Form 8814, Form 4972 and box 3 with its listed taxes
   (irs-1040-inst-2025::sec::line-16::b01–b02); Schedule J line 23 says only
   "Also include this amount on Form 1040 ... line 16". Default: no box is
   checked for Schedule J. (Form 1040-X writes "Sch J" on its line 6,
   irs-1040x-inst-2025::sec::tax-liability::b01; the 2025 Form 1040 has no such
   entry.) Changes dollars: no.

8. **The election when it raises the tax.** Source: "Caution: Your tax may be
   less if you figure it using the 2025 Tax Table ... Attach Schedule J only if
   you are using it to figure your tax" (the face). Default: the engine follows
   the election fact and does not compare. Cade should not record an election
   that raises the tax. Changes dollars: yes, if one is recorded.

9. **Lines 19 to 21: only section 1 tax.** Source: "Only include tax reported
   on this line that is imposed by section 1" (the face, line 21) and the
   examples in lines-19-20-and-21::b01 (Form 8814 or 4972 tax, an education
   credit recapture). Default: the fact `sectionOneTax` holds that amount for
   each of the three lines. Changes dollars: no.

10. **Form 8615 on the same return.** Source: a child's Form 8615 uses Schedule
    J as a worksheet (irs-8615-inst-2025::sec::worksheet-2-for-line-11-of-the-schedule-d::b02).
    Default: line 4 is unsupported when Form 8615 files. Changes dollars: no (a gap).

11. **A base year with no return.** Source: "use the amount you would have
    reported as your taxable income had you been required to file a tax return"
    (line-5::b01). Default: the fact holds that amount; no separate answer.
    Changes dollars: no.

12. **The "total net capital gain" that caps line 2b.** Source: "The amount
    you enter on line 2b can't exceed the smaller of your total net capital
    gain or the net capital gain attributable to your farming or fishing
    business" (irs-1040sj-inst-2025::sec::line-2b::b01). The instructions do
    not name a line. Default: the smaller of Schedule D lines 15 and 16 (a loss
    counts as 0), as the QDCG worksheet's line 3 reads it; with no Schedule D,
    Form 1040 line 7a. The rest of a stated farm gain stays in line 2a as
    ordinary income. Changes dollars: yes, when line 16 is below line 15 (a
    short-term loss elsewhere). The blind fill read it the same way.

13. **Rounding inside a base year's QDCG worksheet.** Source: the 2022 to 2024
    worksheets in the Schedule J instructions give no rounding rule. Default:
    each tax line of the worksheet (the 15% part, the 20% part, the rate-schedule
    tax) is rounded to the nearest dollar and the rounded lines are added, as
    for every calculated line. Keeping the cents and rounding once can differ by
    $1 a year. The blind fill kept the cents; the blind cases gave the same
    dollars both ways. Changes dollars: at most $1 or $2 a year.

## Blind fill (2026-11-26)

A preparer filled 14 cases by hand from the blank form and the instructions,
without the engine. Every amount matched the engine. The one difference: line
2c when line 2b holds a net capital gain but the farm has no unrecaptured
section 1250 gain (cases 2 and 4). The blind fill entered 0; the engine leaves
the line blank, because the instructions say "if any" (line-2c::b01). No
dollars change.

## Second opinions

- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1).** It does not model Schedule
  J or income averaging (no variable for section 1301, elected farm income or
  base years). It does hold the earlier years' rates. The engine's 2020 to 2024
  bracket tops (`data/earlierYearRates.ts`) and the 0% and 15% capital gain
  ceilings matched PolicyEngine's `gov.irs.income.bracket.thresholds` and
  `gov.irs.capital_gains.thresholds` for every filing status, the surviving
  spouse included (25 year and status pairs, no difference). Its
  `capital_gains_tax` formula stacks the 0%, 15% and 20% bands the same way as
  the base-year worksheet (`federal/4970/earlierYearTax.ts`), with the same
  limit to the tax at the regular rates (QDCG worksheet line 25).
- **IRS Direct File (IRS-Public/direct-file, commit e365f9f).** Its fact
  dictionary (`backend/src/main/resources/tax`) has no farm or fishing income
  and no Schedule J. Nothing to compare.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Line 1 | stated rule |
| Line 2a cap; line 2b cap | stated rule; regulation examples with numbers (logic only) |
| Line 2c | stated rule |
| Lines 3, 6, 10, 14, 17, 18, 22, 23 | stated rule (the face's arithmetic) |
| Line 4 without line 2b | stated rule (the 2025 methods of Form 1040 line 16) |
| Line 4 with line 2b or 2c | own reading (question 2, a DECISION) |
| Lines 5, 9, 13 from a return; the Taxable Income Worksheets | published examples with numbers |
| Lines 5, 9, 13 and 19 to 21 from an earlier Schedule J | stated rule; regulation example (logic only) |
| Lines 7, 11, 15 | stated rule; one published example contradicts the arithmetic (DECISION) |
| Lines 8, 12, 16: rate schedules, QDCG, Form 2555 worksheet | stated rule |
| Lines 8, 12, 16 with part of line 2b | own reading (question 3) |
| Lines 8, 12, 16 with part of line 2c, or a base year's Schedule D Tax Worksheet | unsupported |
| Form 6251 line 10 with Schedule J | stated rule (irs-6251-inst-2025::sec::line-10::b02) |
