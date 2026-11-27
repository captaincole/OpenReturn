# Form 8864: open questions

Form 8864 (Rev. December 2025) for an individual. A 2025 return claims only the small agri-biodiesel producer credit for its own fuel (lines 7 and 8). The other biodiesel, renewable diesel and sustainable aviation fuel (SAF) credits ended for fuel sold or used after 2024 (`irs-8864-inst-2025::sec::what-s-new::b02`). They reach a 2025 return only through line 10, from an entity whose tax year began in 2024 (`general-instructions::b01`).

The two decisions where texts conflict are in `docs/rule-decisions.md` (A110, A111) and in the `DECISION` comments of `receivers.ts` and `resolveInfo.ts`.

## Doubts

1. **Which gallons count when production passes 15 million.** "Qualified agri-biodiesel production means up to 15 million gallons" (`qualified-agri-biodiesel-production::b01`). The text does not say which gallons count when a producer makes more: the first ones, or the ones at the $.20 rate. Default: a named gap on lines 7 to 11, Schedule C line 6, Form 6251 line 3 and Form 3800 line 1l. The person states the qualified gallons of each period. While the gap stands, Schedule C lines 7 to 31 leave line 9 out, as the Form 4136 gap on line 6 does; the return stays unsupported through Form 3800 line 1l. Changes dollars: yes, up to $.10 a gallon.
2. **More than one source together over a limit.** The limits "are applied at both the entity level and at the partner or similar level" (`qualified-agri-biodiesel-production::b02`; `line-10::b01`). The text does not say how a partner adds its own production or capacity to an entity's. Default: when the sums of all sources stay within 15 million gallons and 60 million gallons of capacity, every reading agrees and the engine figures the lines; above that, a named gap. Changes dollars: only above the limits.
3. **Two businesses of one owner.** The capacity test is per person, with the aggregation rule (`qualified-agri-biodiesel-production::b02`). Default: two production facts on one return are two sources, and the sum test of doubt 2 applies. A single fact over 60 million gallons of capacity claims nothing. No dollars change below the limits.
4. **Each business's part of line 9.** With two businesses, line 9 is split in proportion to each one's unrounded credit, so the parts add to line 9. No instruction covers it. Changes dollars: at most $1 between businesses.
5. **Line 10 rounding.** Each K-1 rounds before the add, the rule of Form 8846 line 5 (row A of Form 8846 in `docs/rule-decisions.md`), so line 11 equals Form 3800 Part V. Changes dollars: under $1 for each K-1.
6. **Form 6251 line.** Form 8864 says the line 9 amount "must be subtracted when figuring your alternative minimum taxable income ... on the appropriate line of: • Form 6251" (`line-9::b01`). The Form 6251 instructions name no line for it. Default: line 3, other adjustments (`irs-6251-inst-2025::sec::line-3-other-adjustments::b01`). For an itemizer, line 3 keeps its old gap, and Form 6251 line 4 adds a gap line as 0, so the subtraction is lost there. No change for a filer who takes the standard deduction.
7. **Transfer election and income.** A section 6418 transfer applies only to fuel sold or used after June 30, 2025 (`what-s-new::b01`). Default: a transfer above line 8 column (c) of its business is a gap on Form 3800 line 1l. Line 9 stays whole income: the instructions say to include it "even if you can't use all of the credit" (`line-9::b01`), and they say nothing about a transfer. Changes dollars: no, under this reading.
8. **Form 4136 and the same gallons.** "You can't claim any amounts on Form 4136 that you claimed on ... Form 8864" (`irs-4136-inst-2025::sec::general-instructions::b01`). The 2025 Form 4136 has no line for a biodiesel mixture or for agri-biodiesel production (lines 9, 10 and 12 are reserved). Its other lines refund excise tax on fuel used in a nontaxable way, which is a different amount. Default: no Form 4136 line can claim an amount of Form 8864, so the engine does not cross-check them. No dollars change.
9. **A farm that makes agri-biodiesel.** Schedule F line 8 names Form 8864 (`irs-1040sf-inst-2025::sec::line-8::b01`). The production fact names a Schedule C business only. A fact that names a farm is a named gap ("not a Schedule C business on this return"). Changes dollars: none are figured.
10. **Decision false with a production fact.** Schedule C line 6 takes line 9 from the fact alone. With `decisions.scope.must_file_8864` false, Form 3800 line 1l is a gap until the two agree, as for Form 8846. No dollars change.
11. **K-1 from an estate, a trust or a cooperative.** A K-1 (Form 1041) box 13 code O has no route in the engine (`passThrough/trustBoxes.ts`), and Form 1099-PATR is not read. Default: such a credit is a stated Form 3800 line 1l or 1ff credit with the entity's EIN, and line 10 adds it. A stated line 1l credit with no EIN next to a production fact is a gap, so the taxpayer's own credit is not counted twice.
12. **California.** California has no instruction on this federal credit income. The engine adds nothing to Schedule CA; California starts from federal AGI, so the income stays in. Not checked against California law.
13. **Statute not read.** The law library is not installed in this worktree, so no statute was read for doubts 1, 2 or the decisions.
14. **Line 9 adds the rounded lines 7 and 8.** Form 1040: "include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). The form: "9 Add lines 7 and 8" (`irs-8864-face-2025::sec::face-page-1::b01`), and lines 7(c) and 8(c) are whole-dollar lines of their own. Default: line 9 adds the two lines as entered, the repository rule for a line that is arithmetic on other lines (CLAUDE.md, rounding). The blind fill chose the same. Changes dollars: at most $1 (5 and 3 gallons give $1 + $1 = $2, against $1.10 → $1 with cents).
15. **Line 10 with no statement.** The entity "must tell you the number of gallons for which it claimed the credit and its productive capacity" (`line-10::b01`), but the K-1 says "If no statement is attached, report this amount on Form 8864, line 10" (`irs-1065k1-inst-2025::sec::box-15-credits::b09`). Default: a K-1 with no statement is the whole code AC amount on line 10, and one source alone never fails the partner-level limits (doubt 2). Changes dollars: only when the partner has other agri-biodiesel and the sources together pass a limit, which is a named gap when the K-1 states its gallons.

## Proposals for a discussion

- **Routing K-1 (Form 1041) credits.** A trust K-1 box 13 credit, code O among them, has no route and makes Schedule E line 41 unsupported. A route for trust credits to Form 3800 would let line 10 read them as it reads partnership K-1s.
- **Schedule C Part III.** Schedule C does not model cost of goods sold. A producer that sells its agri-biodiesel keeps inventory, so lines 5 to 31 of its Schedule C stay blank, and the return stops there. The `nela` scenario uses fuel burned in the producer's own trucks for that reason.

## Second opinions

- Blind fill (2026-11-27): a preparer filled 14 cases from the blank form and the December 2025 instructions only. All 126 values match the engine, with no blank-against-0 differences either. The preparer's doubts that change dollars are doubts 2, 5, 14 and 15.
- PolicyEngine-US 2.154.1 (commit 0fbed6ddb1): does not model Form 8864. Its only trace is the bare input `general_business_credit` (Form 3800), with no formula; it has no biodiesel, renewable diesel or SAF rate, no 15-million or 60-million gallon limit, and no rule for the credit in income. Nothing to compare.
- IRS Direct File (commit e365f9f): its fact dictionary (backend/src/main/resources/tax) has no Form 8864, no Form 3800 and no Schedule C. Nothing to compare.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Line A (registration number) | stated rule |
| Lines 7 and 8, columns (a) and (c) | stated rule (no published example with numbers) |
| Line 9 | stated rule |
| Line 10 (K-1 code AC, stated pass-through credits) | stated rule; the rounding is own reading |
| Line 11 | stated rule |
| Lines 12 and 13 (blank for an individual) | stated rule |
| Limits (15 million, 60 million, registration) | stated rule; more than one source is own reading |
| Schedule C line 6, Form 6251 line 3 | own reading (decision A110, doubt 6) |
| Form 3800 lines 1l and 1ff | stated rule |
