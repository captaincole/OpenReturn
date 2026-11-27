# Form 6478 — doubts and defaults

The engine fills Form 6478 (Rev. January 2020) for an individual's 2025 return. The credit is for fuel sold or used before 2025, so a 2025 return can hold only the credit a pass-through entity allocates from a tax year that began in 2024 (line 3). The instructions (Rev. October 2023) publish no example with numbers, and no filled example was found on the web (2026-11-27). The tests are the stated rules, limit tests, and the synthetic taxpayer `lem`. Section 40(b)(6)(J), 40(e)(2) and 87 were read in the law library on 2026-11-27.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | Stated rule |
| Line 1 (a), (c); line 2 (registration number, amount) | Stated rule: blank on a 2025 return (what's new, section 40(b)(6)(J), the IRS page "Completing Form 6478 for tax years beginning after 2024") |
| Line 3 (K-1 and stated pass-through credits) | Stated rule; rounding is row A96 |
| Line 4 | Stated rule (the form's arithmetic) |
| Lines 5 and 6 (cooperatives, estates, trusts) | Stated rule: blank on an individual's return |
| Income inclusion (line 2 to other income) | Stated rule: no amount in 2025 |
| Form 3800 Part III line 4c | Stated rule; a stated credit with no entity is a gap (item 4) |
| Who files | Own reading of two texts (item 1, a DECISION) |

## Two texts conflict

### 1. Does an individual whose only source is a pass-through entity file the form?

- Text A: "All other taxpayers aren't required to complete or file this form if their only source for this credit is a partnership, S corporation, cooperative, estate, or trust. Instead, they can report this credit directly on the appropriate line of Form 3800" (`irs-6478-inst-2025::sec::general-instructions::b01`). The K-1 code I: "Report this amount on Form 6478, Biofuel Producer Credit, line 3; or Form 3800, Part III, line 4c" (`irs-1065k1-inst-2025::sec::box-15-credits::b05`).
- Text B: "All other taxpayers: Report the above credits directly on the appropriate line of Form 3800; and Don't file Form 6478" (`irs-6478-inst-2025::sec::line-3::b01`).
- Decided (DECISION comment above `resolve6478Info`; `docs/rule-decisions.md` row A110): the form does not file unless `decisions.scope.must_file_6478` is true. With the decision, line 3 holds the credits.
- Dollars: none. Form 3800 line 4c takes the same credit either way.

### 9. Line 3 rounding with several K-1 amounts in cents

- Text A: line 3 says "Enter the total biofuel producer credits from" the K-1s (`line-3::b01`), and the Form 1040 rule: "include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`).
- Text B: Form 3800 Part V lists each pass-through amount "by the EIN of the pass-through entity" (`irs-3800-inst-2025::sec::part-v-3::b01`), one whole-dollar amount for each K-1.
- Decided (DECISION comment above `line3Of` in `lines.ts`; `docs/rule-decisions.md` row A96, the same rule as Forms 8846 and 8586): each K-1 rounds, then they add. Line 4 then equals Form 3800 line 4c.
- Blind fill (2026-11-27): the preparer rounded only the total. $600.40 + $1,200.40 gives $1,801 there and $1,800 in the engine; $600.50 + $1,200.50 gives $1,801 there and $1,802 in the engine. At most $1 for each K-1 with cents.

## Should we do this now

### 2. The K-1 fact does not hold the entity's tax year

- Source: "You claim the credit for the tax year in which the sale or use occurs" (`general-instructions::b01`); section 40(b)(6)(J)(i), "before January 1, 2025" (`usc-26-2025::sec::s40::b-6-J`).
- Default: the engine takes a K-1 code I amount as printed. Only a K-1 for a tax year that began in 2024 can hold one. A K-1 for a calendar year 2025 that prints code I is the entity's error, and the engine cannot see it.
- Not now: the K-1 fact has no tax-year field. Adding one changes the K-1 document fact that every pass-through form reads (Pattern change, item 2).

### 3. A trust K-1 box 13 code H

- Source: line 3 lists "Schedule K-1 (Form 1041) ... box 13 (code H)" (`line-3::b01`); "you can report the amount on Form 3800, Part III, line 4c" (`irs-1041k1-inst-2025::sec::note-form-1041-t-allocation-of-estimated-tax-payments-to::b02`).
- Default: line 3 is a named gap. The pass-through tables keep a trust's box 13 credits as `credit` items with no route, so Form 3800 does not take them (Schedule E line 41 is unsupported then).
- Not now: routing trust credits to Form 3800 is a change to the pass-through layer for every trust credit, not to this form (Pattern change, item 3).
- Blind fill (2026-11-27): the preparer entered the trust's $300 on line 3 and line 4. That is what the text asks; the engine keeps the gap so that Form 6478 line 4 never shows a credit that Form 3800 line 4c drops. The fix is the pass-through change above.

### 4. A stated Form 3800 line 4c credit with no pass-through entity

- Source: what's new (`what-s-new::b01`) and the IRS page: "lines 1 and 2 of Form 6478 cannot be used for 2025 and subsequent tax years".
- Done: such a credit can only be the taxpayer's own production, so Form 3800 line 4c and Form 6478 line 3 show a named gap (`form3800.ts`, two lines in `3800/sources.ts`). A stated credit with the entity's EIN (a cooperative's notice) counts on both.

### 5. Form 1099-PATR box 12

- Source: line 3 lists "Form 1099-PATR ... box 12, or other notice of credit allocation" (`line-3::b01`).
- Default: the engine reads no Form 1099-PATR. A cooperative's allocation is a stated Form 3800 line 4c credit with the cooperative's EIN.
- Not now: a Form 1099-PATR fact is a new input document for every cooperative item, and the stated credit already reaches both forms.

### 6. The Schedule F instruction names "line 3 of Form 6478"

- Source: Schedule F line 8 other income includes "Any amount included in income from line 3 of Form 6478, Biofuel Producer Credit" (`irs-1040sf-inst-2025::sec::line-8::b01`). The Form 6478 instructions include only line 1 column (c) in income (`line-2::b01`); line 3 is the pass-through credit, which the entity has already counted.
- Default: nothing is added. The reference is to an older revision's line, and line 2 is blank on a 2025 return, so no dollars change.
- Not now: no dollars change on a 2025 return.

### 7. Carryforwards of the credit

- Source: section 40(b)(6)(J)(ii) applies "rules similar to the rules of subsection (e)(2)": no amount from a sale or use before 2025 may be carried "to any taxable year beginning after the 3-taxable-year period beginning with the taxable year in which such first day occurs" (`usc-26-2025::sec::s40::e`).
- Default: not this form. A carryforward is a Form 3800 Part IV fact. The limit first bites for a tax year that begins after 2027.

### 8. The election not to claim the credit

- Source: "You may claim or elect not to claim the biofuel producer credit at any time within 3 years" (`general-instructions::b01`); section 40(f).
- Default: a decision not to file Form 6478 is not the election. Form 3800 still takes a K-1 credit, and no deduction or income changes, because an individual's 2025 return has no line 2 amount. The engine has no fact for the election; a credit the K-1 prints is claimed.
- Not now: the election only drops the credit, which a person does by leaving the K-1 code I amount out; no other line changes.

### 10. When a cooperative's notice of credit allocation counts

- Source: line 3 lists "Form 1099-PATR ... box 12, or other notice of credit allocation" (`line-3::b01`) and says nothing about the patron's year. "You claim the credit for the tax year in which the sale or use occurs" (`general-instructions::b01`).
- Default: a stated Form 3800 line 4c credit with the cooperative's EIN counts on the 2025 return, as stated. The engine does not see the cooperative's tax year; a notice for a cooperative year that ended in 2024 belongs on the 2024 return, and the person who states the credit decides that.
- Blind fill (2026-11-27): the same choice ($505.50 counted).
- Not now: no text conflicts, and the stated credit already carries the person's choice.

## Pattern change (proposals for a discussion)

### 2. A tax year on the K-1 fact

- Before: the K-1 fact holds the boxes and no tax year, so the engine cannot tell a fiscal-year K-1 (whose code I credit is allowed) from a calendar-2025 K-1 (whose code I credit is the entity's error).
- After: the K-1 fact holds the entity's tax year beginning and ending, as the K-1 header prints them; Form 6478 line 3 then makes a code I amount from a tax year that begins after 2024 a named gap, and other forms that depend on the entity's year can read it.

### 3. Trust and estate credits to Form 3800

- Before: a Schedule K-1 (Form 1041) box 13 credit is a `credit` item with no route, so Form 3800 does not take it and Schedule E line 41 is unsupported; Form 6478 line 3 is a gap for code H.
- After: the pass-through routing sends each box 13 credit code to its Form 3800 Part III line, as `3800/k1Credits.ts` does for partnership and S corporation codes; Form 6478 line 3 then adds the trust's code H amount.

## Second opinions

- PolicyEngine-US 2.154.1 (commit 0fbed6ddb1, 2026-11-26): it does not model Form 6478. `general_business_credit` is a bare input ("General business credit from Form 3800") with no formula and no biofuel parameter, so it has no constant or formula to compare.
- IRS Direct File: the repo has no checkout of its tax logic (issue #140 is open), so it was not compared.
