# Form 965-A: open questions

Form 965-A is the yearly report of the section 965 transition tax of 2017 to 2020. For 2025 the taxpayer states last year's form; the engine adds the 2025 installment.

## Two texts conflict

Both are decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

1. **A71: Part I column (j) holds every transfer and adjustment to date.** The Part I text says "current-year" amounts (`irs-965a-inst-2025::sec::lines-1-through-8::b01`); Part II column (j) adds column (j) to the liability (`line-1::b05`), which works only with all of them. The engine follows the arithmetic (`liabilityLines.ts`).
2. **A72: Schedule 2 line 20 is Part II Totals, column (k).** The Form 965-A instructions name only the 2020 line (`line-1::b05`); the 2025 Schedule 2 line 20 names the form. The engine takes the Totals (`receivers.ts`).

## Should we do this now

Each doubt below has no conflicting text. Each is done, or says why not.

1. **The 2025 payment is the scheduled installment.** Done. "If, for any reason, the actual payment differs from the schedule, report the actual payment made" (`irs-965a-inst-2025::sec::line-1::b01`). The return is prepared before the payment, so the engine enters the installment due. A different payment is the fact's `paidThisYear`.
2. **Installments are whole dollars.** Done. The audit example prints cents: "$22.50 (15% of the adjusted $150 liability) ... $37.50" (`lines-1-through-8::b10`). The engine rounds each year's cumulative share to the nearest dollar and subtracts what was paid, so the eight payments still add up to the liability. Less than $1 a year.
3. **A prorated adjustment is paid as "share due to date less paid".** Done. "For the part of the adjustment prorated to installments whose payment date has already arrived, adjust the payment for the reporting year" (`line-1::b04`, `b05`). The engine pays cumulative percent × (column (f) + column (j)) − earlier payments, which gives the example's $28, $22.50, $30, $37.50. It assumes the earlier years were paid on schedule.
4. **A transfer in pays the remaining amount's share of the installments left.** Done. The transferee pays "in the same manner as if the taxpayer were the transferor" (`lines-1-through-8::b02`), but the line does not show the original liability. The engine pays remaining × this year's percent ÷ the percents still to come: the example's $15, $20, $25 (`b03`).
5. **Who files: any section 965 fact.** Done. "Any individual taxpayer ... who has a net 965 tax liability for any tax year or has any net 965 tax liability remaining unpaid at any time during a tax year must file this form" (`who-must-file::b01`). The engine does not test payment dates. No dollars change.
6. **Part III column (d) is Part I column (c), in whole dollars.** Done. "This should equal the taxpayer's net tax liability without section 965 amounts for the corresponding tax year reported in Part I, column (c)" (`lines-1-through-4::b02`). The engine prints Part I column (c)'s rounded amount, and waits for that line's fact when it is missing (fixed 2026-11-26: a stated amount with cents printed its cents). No dollars change.
7. **Column (d) and Part III column (e) are never below 0.** Done. Both are "the excess" of the "with" over the "without" calculation (`lines-1-through-8::b07`, `lines-1-through-4::b02`).
8. **A transfer in has no column (g) box.** Done. "Skip columns (b) through (i)" (`lines-1-through-8::b02`); the assumed liability is an installment liability by definition.
9. **The amended box is blank.** Done. The box is for "an amended return that is filed to change any reporting related to section 965" (`specific-instructions::b01`); the engine prepares the original return.
10. **Part II column (j) prints 0 for a line paid in full.** Done. The line asks for the amount "remaining unpaid after the payment for the reporting year" (`line-1::b05`).
11. **More lines than one form holds** (5 or more other liabilities, 5 or more S corporations in one inclusion year, 11 or more Part IV lines). Not now: the instructions say "an additional Form 965-A should be used" (`lines-1-through-8::b06`, `lines-1-through-4::b01`) but not which copy carries the Part II and Part IV totals that Schedule 2 line 20 reads, so every field is unsupported rather than split by the copies mechanism.
12. **A balance still unpaid after year 8, or an unpaid balance with no installment election after year 1.** Not now: the instructions give no column or schedule for it, so that line's Part II is unsupported.
13. **Last year's payments that already name 2025 or a later installment year.** Not now: the engine cannot tell this year's payment from them, so that line's Part II is unsupported.
14. **A triggering event in 2025.** Not now: it changes Form 1040 line 16 and Schedule 3 line 13d (see the pattern change below). A Part I line triggered in 2025 makes its Part II line, the Part II totals and Schedule 2 line 20 unsupported; a Part IV amount triggered in 2025 makes Part IV columns (f) and (i) and the total unsupported.

## Pattern change

### Proposals for a discussion

- **A triggering event in 2025.** Before: the engine makes the triggered line and Schedule 2 line 20 unsupported, and Form 1040 does not change. After: Form 1040 line 16 would add each Part I line triggered in 2025 (box 3 with "965INC" and the amount, `irs-1040-inst-2025::sec::single-1::b02`), and Schedule 3 line 13d would take column (i) less the year 1 installment (`line-13d::b01`); this is a Form 1040 change, so it waits for a person.

## Second opinions

- **Blind fill (2026-11-26).** A preparer filled 14 cases by hand from the blank form and `irs-965a-inst-2025`. One dollar difference: a triggered $8,000 liability of 2021 with $640 paid in years 1 to 4. The blind fill wrote Part II column (j) $4,160; the engine writes $4,800. 2025 is year 5 (year 1 is "the year of the ... triggering event", `line-1::b01`), so five payments of $640 are made, and $8,000 − $3,200 = $4,800 (`line-1::b05`). The engine is right. Five lines differ only as blank against 0 in Part II column (k): "report only the payment made (if any)" (`line-1::b05`), so the engine leaves it blank.
- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1).** It does not model section 965. Nothing to compare.
- **Other projects.** The repository names no other reference implementation that models Form 965-A.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN, year) | stated rule |
| Part I columns (b) to (f), (h), (i), (k) | stated rule |
| Part I column (j) | own reading (decision A71) |
| Part II columns (b) to (i), 2025 installment | published example with numbers (`line-1::b02`, `lines-1-through-8::b03`, `b10`) |
| Part II column (j) | stated rule |
| Part II column (k), totals, Schedule 2 line 20 | stated rule, with decision A72 |
| Part III | stated rule |
| Part IV columns (a) to (e), (g) to (i) | stated rule |
| Part IV column (f), a 2025 triggering event | unsupported |
| Amended box | own reading |
