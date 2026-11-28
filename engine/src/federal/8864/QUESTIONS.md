# Form 8864: open questions

Form 8864 (Rev. December 2025) for an individual. A 2025 return claims only the small agri-biodiesel producer credit for its own fuel (lines 7 and 8). The other biodiesel, renewable diesel and sustainable aviation fuel (SAF) credits ended for fuel sold or used after 2024 (`irs-8864-inst-2025::sec::what-s-new::b02`). They reach a 2025 return only through line 10, from an entity whose tax year began in 2024 (`general-instructions::b01`).

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

1. **Which amount is income, and where (A117).** Form 8864 says to include line 9 in income, "under 'other income'" (`irs-8864-face-2025::sec::face-page-1::b01`; `irs-8864-inst-2025::sec::line-9::b01`). Schedule C line 6 names "line 11 of Form 8864" (`irs-1040sc-inst-2025::sec::line-6::b01`), and Schedule F line 8 names line 10 (`irs-1040sf-inst-2025::sec::line-8::b01`). The engine includes line 9, on Schedule C line 6 of the business that made the fuel. `DECISION` in `receivers.ts`.
2. **Who files with a K-1 credit only (A118).** Form 8864: a taxpayer whose only source is a pass-through entity is not required to file it (`general-instructions::b01`). The partner's K-1 instructions list Form 8864 as an exception that must be filed (`irs-1065k1-inst-2025::sec::box-15-credits::b01`). The engine follows Form 8864's own instructions: the credit goes to Form 3800 line 1l or 1ff directly. `DECISION` in `resolveInfo.ts`.

## Should we do this now

Each is a doubt with no conflicting text: a default, done now, or one sentence on why not.

1. **Which gallons count when production passes 15 million.** "Qualified agri-biodiesel production means up to 15 million gallons" (`qualified-agri-biodiesel-production::b01`); the statute says only that it "shall not exceed 15,000,000 gallons" (`usc-26-2025::sec::s40a::b-4-C`). Neither says which gallons count when the rates differ. Not now: the text does not settle it, so lines 7 to 11, Schedule C line 6, Form 6251 line 3 and Form 3800 line 1l are a named gap, and the person states the qualified gallons of each period. Changes dollars: up to $.10 a gallon.
2. **More than one source together over a limit.** The limits "are applied at both the entity level and at the partner or similar level" (`qualified-agri-biodiesel-production::b02`; `line-10::b01`; the statute says the same, `usc-26-2025::sec::s40a::e-3`). Neither says how a partner adds its own production to an entity's. Done: within 15 million gallons and 60 million gallons of capacity in all, every reading agrees and the engine figures the lines; above that, a named gap.
3. **Two businesses of one owner.** Done: two production facts are two sources, and the sum test of item 2 applies (the aggregation rule, `qualified-agri-biodiesel-production::b02`). A single fact over 60 million gallons of capacity claims nothing.
4. **Each business's part of line 9.** Done: with two businesses, line 9 is split in proportion to each one's unrounded credit, so the parts add to line 9. No instruction covers it; at most $1 moves between businesses.
5. **Line 10 rounding.** Done: each K-1 rounds before the add, the rule of Form 8846 line 5 (row A of Form 8846 in `docs/rule-decisions.md`), so line 11 equals Form 3800 Part V. Under $1 for each K-1.
6. **Form 6251 line.** Form 8864 says to subtract line 9 "on the appropriate line of: • Form 6251" (`line-9::b01`); the Form 6251 instructions name no line. Done: line 3, other adjustments (`irs-6251-inst-2025::sec::line-3-other-adjustments::b01`). Not now for an itemizer: line 3 keeps its old gap (mortgage interest on a qualified dwelling), and line 4 counts the gap as 0, so the subtraction is lost there too. That gap belongs to Form 6251, not to this form.
7. **Transfer election and income.** A section 6418 transfer applies only to fuel sold or used after June 30, 2025 (`what-s-new::b01`). Done: a transfer above line 8 column (c) of its business is a gap on Form 3800 line 1l. Line 9 stays whole income: the instructions say to include it "even if you can't use all of the credit" (`line-9::b01`), and section 87(2) includes "the biodiesel fuels credit determined with respect to the taxpayer" (`usc-26-2025::sec::s87::2`), which a transfer does not change.
8. **Form 4136 and the same gallons.** "You can't claim any amounts on Form 4136 that you claimed on ... Form 8864" (`irs-4136-inst-2025::sec::general-instructions::b01`). Done: the 2025 Form 4136 has no line for a biodiesel mixture or for agri-biodiesel production (lines 9, 10 and 12 are reserved, `irs-4136-face-2025::sec::face-part-ii-3::b02`, `::face-part-ii-4::b01`). Its other lines refund excise tax on fuel used in a nontaxable way, a different amount, so no gallon can be claimed twice and the engine does not cross-check them.
9. **A farm that makes agri-biodiesel.** Schedule F line 8 names Form 8864 (`irs-1040sf-inst-2025::sec::line-8::b01`). Not now: the production fact names a Schedule C business, and a farm needs Schedule F line 8 to take the income, a change to another form. A fact that names a farm is a named gap ("not a Schedule C business on this return").
10. **Decision false with a production fact.** Done: Schedule C line 6 takes line 9 from the fact alone. With `decisions.scope.must_file_8864` false, Form 3800 line 1l is a gap until the two agree, as for Form 8846.
11. **K-1 from an estate, a trust or a cooperative.** A K-1 (Form 1041) box 13 code O is typed as a credit with no route (`passThrough/trustBoxes.ts`, `passThrough/routing.ts`), and Form 1099-PATR is not read. Not now: the route is a change to the pass-through layers (see "Pattern change"). Such a credit is a stated Form 3800 line 1l or 1ff credit with the entity's EIN, and line 10 adds it. A stated line 1l credit with no EIN next to a production fact is a gap, so the taxpayer's own credit is not counted twice.
12. **California.** Not now: California has no instruction on this federal credit income. The engine adds nothing to Schedule CA; California starts from federal AGI, so the income stays in. Not checked against California law.
13. **Statute read (2026-11-27).** Sections 87 and 40A(b)(4), (e)(1) to (e)(4) were read in the law library. They agree with the instructions on the limits and the income. One apparent difference, for `docs/law-findings.md`: the library's section 40A(b)(4)(A) reads "20 cents for each gallon of qualified agri-biodiesel production" (`usc-26-2025::sec::s40a::b-4-A`), while the instructions give "$.10 per gallon from January 1, 2025, through June 30, 2025" (`irs-8864-inst-2025::sec::line-7::b01`). The library holds the code as amended and no effective-date notes; the instructions decide, and line 7 stays at $.10.
14. **Line 9 adds the rounded lines 7 and 8.** Form 1040: "include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). The form: "9 Add lines 7 and 8" (`irs-8864-face-2025::sec::face-page-1::b01`), and lines 7(c) and 8(c) are whole-dollar lines of their own. Done: line 9 adds the two lines as entered, the repository rule for a line that is arithmetic on other lines (CLAUDE.md, rounding). The blind fill chose the same. At most $1.
15. **Line 10 with no statement.** The entity "must tell you the number of gallons for which it claimed the credit and its productive capacity" (`line-10::b01`), and the K-1 says "If this credit includes the small agri-biodiesel producer credit, the partnership will provide additional information on an attached statement. If no statement is attached, report this amount on Form 8864, line 10" (`irs-1065k1-inst-2025::sec::box-15-credits::b09`). Done: a K-1 with no statement has no producer credit in it, so the whole code AC amount is line 10, and one source alone never fails the partner-level limits (item 2).
16. **A line 7 gallon and the clean fuel credit.** A Form 7218 facility takes the section 45Z credit for fuel produced after 2024. "For fuel sold or used after June 30, 2025, the section 40A credit is determined in addition to any credit determined under section 45Z" (`irs-7218-inst-2025::sec::emissions-factor::b05`), so a line 8 gallon earns both. No text says whether a line 7 gallon (`line-7::b01`, January 1 to June 30) earns both (Form 7218 `QUESTIONS.md` item 8). Not now, a gap: with line 7 gallons and a Form 7218 facility that sold biodiesel and was in service before July 1, 2025, lines 7 to 11, Schedule C line 6 and Form 3800 line 1l are a named gap (`TWO_CREDITS_GAP`, `figures.ts`). A person decides. Changes dollars: up to $.10 a gallon of line 7.

## Pattern change

### Proposals for a discussion

- **Routing K-1 (Form 1041) credits.** Before: a trust K-1 box 13 credit, code O among them, has no route and makes Schedule E line 41 unsupported. After: a route for trust credits to Form 3800 would let line 10 read them as it reads partnership K-1s.
- **Schedule C Part III.** Before: Schedule C does not model cost of goods sold, so a producer that sells its agri-biodiesel and keeps inventory leaves lines 5 to 31 blank, and the return stops there. After: with Part III, a producer that sells its fuel would file, and the `nela` scenario could sell fuel instead of burning it in its own trucks.

## Second opinions

- Blind fill (2026-11-27): a preparer filled 14 cases from the blank form and the December 2025 instructions only. All 126 values match the engine, with no blank-against-0 differences either. The preparer's doubts that change dollars are items 2, 5, 14 and 15 of "Should we do this now".
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
| Schedule C line 6, Form 6251 line 3 | own reading (decision A117, item 6) |
| Form 3800 lines 1l and 1ff | stated rule |
