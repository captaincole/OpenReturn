# Form 8697 — doubts and defaults

The form is Rev. December 2025 (`irs-8697-face-2025`); its instructions are `irs-8697-inst-2025`. The only example with numbers is the accrual-period example (`line-11::b03`); it is a unit test (`tests/unit/federal/8697/lines.test.ts`). The law library is not installed in this checkout, so no statute text was read.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

- **The interest rate for two quarters (row A68).** Table 1 says 5% for 1/1/19–6/30/19 and has no row for 4/1/22–6/30/22 (`line-11::b02`). The rule it summarizes is the section 6621(a)(1) rate from the quarterly rulings (`applicable-interest-rates::b01`): 6% and 4%. The engine uses the rulings (`rates.ts`).
- **Line 2, column (c) (row A69).** The heading adds columns (a) and (b); the line 2 instruction says the sum of all line 2 amounts, zero, shows in 2(c) (`line-2::b01`). The engine adds (a) and (b) (`plan.ts`).

## Should we do this now

Each item is a default with no conflicting text. "Done" means the engine applies it today; "Not now" gives the reason in one sentence.

1. **The due date of each return.** Source: "from the due date (not including extensions) of the return for the prior year" (`lines-7-and-8::b01`). The engine uses April 15 after each calendar year, as Form 8621 and Form 8611 do (`federal/8621/interest.ts`). It does not move the date for a weekend (April 18, 2022) or the COVID-19 postponements (July 15, 2020; May 17, 2021). The instructions' own example uses April 15 for every year (`line-11::b03`). Changes dollars: yes, a few days of interest for a weekend; for a 2019 or 2020 prior year, a postponed date would also start the accrual period in another quarter. Not now: the date comes from the due-date function that Forms 8621 and 8611 share, and no text says whether a section 7508A postponement moves the look-back due date.
2. **Daily compounding.** Source: "compounded on a daily basis" (`lines-7-and-8::b01`). Each day grows by the period's rate over 365, or 366 in a leap year, as Form 8621 does. Table 1 names the Rev. Proc. 95-17 factor tables, which are not in the corpus. Table 1 is not consistent on leap years (`line-11::b02`): its 2016 and 2020 rows name 366-day tables (59, 61, 63), but "1/1/24 12/31/24 8% 21 575" names a 365-day table, where Table 2 names "Table 67" for 2024. The engine uses 366 days for 2024. Changes dollars: at most $1 (the blind fill's case 2 is $971 with 365 days, $970 with 366). Done.
3. **The end date.** Source: "until the earlier of: the due date ... of the return for the filing year, or the date the return for the filing year is filed and any income tax due for that year has been fully paid" (`lines-7-and-8::b01`). The fact may state the filed-and-paid date (`filedAndPaidOn`); without it, April 15, 2026. Changes dollars: yes, less interest for an early return. Done (the elza scenario).
4. **Calendar years only.** The engine prepares calendar-year returns: each column's "Year ended" is month 12, and the filing-year line prints 01/01/2025 and 12/31/2025. Changes dollars: no. Not now: the engine has no fiscal-year fact on any form.
5. **The filing-year column, line 1.** Source: "Enter the filing year listed at the top of this form" (`part-i-regular-method::b01`), and line 1 asks for taxable income "shown on tax return". The engine uses Form 1040 line 15, which never shows a loss; the taxpayer states lines 2 and 4. Changes dollars: no (no line reads the filing-year column). Done.
6. **Later forms.** Source: "On the additional Forms 8697, enter your name, identifying number, and tax year. Complete lines 1 through 8 (as applicable), but do not enter totals in column (c)" (`part-i-regular-method::b01`; Part II, `part-ii-simplified-marginal-impact::b02`). A later copy prints the next columns, the name, the SSN and the filing-year line. It leaves the filing-year column, item B, item C, the address, the totals and the net lines blank. Changes dollars: no. Done (the copies mechanism, `tests/unit/federal/8697/copies.test.ts`).
7. **Equal totals.** Line 9a and line 10 each take "the excess" (the form face). When line 7(c) equals line 8(c), both are blank, and Schedule 2 line 17n is blank. Changes dollars: no. Done.
8. **A column with no change.** When line 6 (Part II line 7) is 0, lines 7 and 8 of that column are blank. Changes dollars: no. Done.
9. **Part II line 5 with a zero.** Source: the both-negative and mixed-sign rules (`line-5::b01`) do not name 0. The engine takes the plain larger amount, so 0 and −500 give 0, and line 6 stays blank. Changes dollars: no (no interest on 0). Done.
10. **Part II line 7 when line 6 is 0.** The smaller of the two, as a negative number, is 0. Changes dollars: no. Done.
11. **The address.** Source: "Enter your address only if you are filing this form separately" (`filing-year::b01`). The form files separately only with interest to be refunded (`if-interest-is-to-be-refunded-to-you::b01`), so the address prints only with an amount on line 9a (10a). Changes dollars: no. Done.
12. **The signature section.** Source: "A signature is not required if you are filing the form with your tax return" (`specific-instructions::b01`). The paid-preparer fields are blank: the engine prepares the taxpayer's own return, as on Form 8379. Changes dollars: no. Done.
13. **Rounding.** Each stated amount rounds to the nearest dollar. Each column's interest keeps its cents until it prints; the totals keep the cents and round once (the computed-rows rule in `CLAUDE.md`). Part II lines 2 and 4 round each product. Changes dollars: $1 at most. Done.
14. **The rate before 1999.** The engine's table has the underpayment rate only; before 1999 an individual's overpayment rate was lower. An accrual period that starts before 1999 makes the interest unsupported. Changes dollars: no (the engine stops). Not now: it needs the overpayment column of Rev. Rul. 2024-18 for a contract more than 25 years old.
15. **The noncorporate rate is the underpayment table.** From 1999 an individual's overpayment rate and underpayment rate are both the short-term rate plus 3 points (Rev. Rul. 2024-18, noncorporate table). Every Table 1 row agrees with the engine's table except the two of row A68 (unit test). Changes dollars: no. Done.
16. **Carrybacks and carryovers.** Source: the exceptions of `lines-7-and-8::b01` and `b02`, and `line-3::b01` (a negative line 3 is a look-back loss). When line 1 or line 3 of a prior year is below 0, or the fact marks a carryover, the interest lines, the totals, the net lines and Schedule 2 line 17n are unsupported. Lines 1 to 6 still print. Part II's instructions (`lines-8-and-9::b01`) name no exception, so Part II has none. Changes dollars: the engine stops. Not now: the other interest periods need the carryback year's return and the regulation's rules (Regulations section 1.460-6(c)(4)), which are not in the corpus.
17. **Item C with more than one entity.** Source: "Attach a schedule if there is more than one such entity" (the form face). Item C is unsupported; the lines still compute. Changes dollars: no. Not now: the engine writes no attached statements (see "Pattern change").
18. **The look-back exceptions.** The fact means the method applies: the home construction and small contract exceptions, the de minimis election and the delayed reapplication election (`exception-for-certain-construction-contracts::b01`, `small-contract-exception::b01`, `de-minimis-exception::b01`, `delayed-reapplication-method::b02`) are Cade's question before he records it. Changes dollars: no. Done.
19. **Discounting post-completion adjustments.** Source: `post-completion-adjustments::b01`. The taxpayer states line 2 (Part II line 1) after any discount. Changes dollars: no. Done.
20. **Interest on the refund later.** Source: "Report the amount on line 9a ... as interest income on your income tax return for the tax year in which it is received" (`line-9a::b01`). That is a 2026 return; nothing on the 2025 return. Changes dollars: no. Done.
21. **The task's "underpayment rates".** The instructions name the overpayment rate (`applicable-interest-rates::b01`); for an individual the two are the same from 1999, so the engine reads the underpayment table. Changes dollars: no. Done.

## Pattern change

These are the proposals for a discussion: each changes how the repository does something, so a person decides.

- **The K-1 look-back statement as an input document.** Before: the taxpayer states the amounts a pass-through entity sends with Schedule K-1 box 20 code J (1120-S box 17 code I). After: the statement is a document Cade reads, with a generator for fake ones; it has no official form, so its shape is a person's decision.
- **Statements the engine writes.** Before: item C with more than one entity, and the line 2 schedule of each contract, are left to the preparer. After: the engine prints an attached statement.
- **Corporate rates.** Before: Tables 2 and 3 (corporate taxpayers) are not modeled, because only an individual return uses the engine. After: a corporate or closely held entity return would read them, which needs an entity return the engine does not prepare.

## Second opinions

- **A blind fill (2026-11-26).** A preparer filled 14 cases (9 Part I, 5 Part II) by hand from the blank form and the instructions. All 163 lines agree with the engine. The preparer read rows A68 and A69 before settling the 2019 rate, so that agreement is not independent; with Table 1's printed 5%, case 6 line 7a would be $4,769 (engine $4,918). The page number in that row ("15 571") also points at the 6% table ("10/1/22 12/31/22 6% 17 571"), which supports A68.
- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1).** It does not model Form 8697, look-back interest or the section 6621 rates. Nothing to compare.
- **IRS Direct File.** A code search of IRS-Public/direct-file finds no Form 8697 and no look-back interest. Nothing to compare.
- **A page check (2026-11-26).** Every printed value of the dagdara and elza scenarios, on Form 8697, Schedule 2 and Form 1040, was worked again by hand from the instructions and the facts. All agree.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header: filing year, name, SSN, item B | Stated rule |
| Header: address, item C | Stated rule |
| Part I lines 1–6, filing-year column | Stated rule (stated amounts; line 1 of the filing year is own reading, item 5) |
| Part I lines 7–8 and Part II lines 8–9 (interest) | Published example with numbers for the periods and rates (`line-11::b03`); daily compounding is a stated rule |
| Part I line 2(c), 7(c), 8(c); Part II 8(d), 9(d) | Stated rule; 2(c) decided (A69) |
| Part I 9a, 10; Part II 10a, 11 | Stated rule |
| Lines 9b–9d, 10b–10d | Stated rule |
| Part II lines 1–7 | Stated rule (rate tables from `line-2-2::b01`, `line-4::b01`) |
| Paid preparer | Own reading (blank, item 12) |
| Interest with a carryback or carryover | Unsupported |
| Item C with more than one entity | Unsupported |
