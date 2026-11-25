# FTB 3804-CR: open points

No published example with numbers exists for this form. The corpus has no
example, and the FTB help pages could not be read. Every rule below is a
stated rule or the author's reading.

## Two texts conflict

### 1. The credit and tentative minimum tax (decided, waiting for review)

- Sources: "the total amount you may claim for all credits is limited by
  tentative minimum tax (TMT)" (`ca-540-inst-2025::sec::special-credits-and-nonrefundable-credits::b01`);
  "This credit can reduce regular tax below tentative minimum tax (TMT)"
  (`ca-3804cr-inst-2025::sec::general-information::b03`, `::e-limitations::b01`).
- Decision: no TMT floor. Line 4 is the tax left after the credits before it.
  The DECISION comment is in `creditUsed.ts`; row A1 in `docs/rule-decisions.md`.
- Changes a dollar amount: yes, when the tax is near TMT. In `teslyn`, the
  credit takes $15,525 and leaves no tax; a TMT floor ($14,508) would allow
  only $1,017 and carry $14,508 more to 2026.

## Should we do this now

### 2. The order of the credits (done)

- Sources: "The prior year AMT credit must be applied before any credits that
  can reduce regular tax below the TMT" (`ca-540-sched-p-inst-2025::sec::section-a-instructions::b01`);
  "The PTE elective tax credit should be applied against the net tax after the
  other state tax credit" (`ca-540-sched-p-inst-2025::sec::pass-through-entity-pte-elective-tax-credit::b01`).
- Rule: with no Schedule P, line 4 is Form 540 line 35 less line 40, the
  credit for prior year AMT, line 46 and the other state tax credit. This is
  the Schedule P Part III order, where the credit is the last line (21).
  With Schedule P, line 4 is line 21 column (b).
- Which credit prints on Form 540 line 43 and which on line 44 is a choice
  with no text; it changes no dollar (`3510/QUESTIONS.md`).

### 3. Rounding of column (c) and line 2 (done)

- Each row rounds to the nearest dollar, and Part I line 2 adds the rounded
  rows (the form's arithmetic). Part II line 2 rounds the carryover. At most
  $1 per row, only for a credit with cents.

### 4. More than ten entities (done)

- Source: "use additional forms FTB 3804-CR to report all PTE elective tax
  credit amount(s)" (`ca-3804cr-inst-2025::sec::line-1-column-c-pte-elective-tax-credit-s::b01`);
  Part II line 1 is "the total ... from all form(s) FTB 3804-CR, Part I, line 2"
  (`::line-1-total-credit-from-electing-qualified-ptes::b01`).
- Rule: one form per ten entities (the copies mechanism). Each form has its
  own Part I line 2. Part II is on the first form only. No dollar changes.

### 5. Spouses (not now)

- Source: "A taxpayer and spouse/RDP may claim only one credit. If separate
  returns are filed, the credit may be taken by either spouse/RDP or divided
  equally between them" (`ca-3804cr-inst-2025::sec::e-limitations::b01`).
- Not now: the split is the taxpayer's choice, so the stated credit on a
  separate return is the part this return claims. A joint return lists every
  entity of both spouses on one form.

### 6. The carryover period (not now)

- Source: "carried over to reduce the tax for five years or until exhausted ...
  Apply the carryover to the earliest taxable year possible"
  (`ca-3804cr-inst-2025::sec::f-carryover::b01`).
- Not now: the election began for taxable years starting in 2021, so no credit
  expires in 2025 and line 2 is last year's line 5. A 2026 return needs the
  carryover by year.

### 7. The name on Form 540 lines 43 and 44 (done)

- The Credit Table name is "Pass-Through Entity Elective Tax"
  (`ca-540-sched-p-inst-2025::sec::credit-table::b01`). The engine prints "PTE
  Elective Tax", because the name box is short. Code 242 names the credit.

### 8. Schedule P (540) and "more than two credits" (not now)

- Source: attach Schedule P when "You have more than two credits" or "credits
  that are reported in Part III, Section A1, Section A2, or Section C"
  (`ca-540-sched-p-inst-2025::sec::b-who-must-file::b01`).
- Not now: this is Schedule P's own resolver, another form. Three other credits
  always include the prior year AMT credit, which files it. Only a child care
  credit (line 40, federal AGI $100,000 or less) next to this credit misses it,
  and then only the child care credit's TMT limit changes, not this credit.

### 9. Blank or 0 on Part II lines 1 and 2 (done)

- Line 2 prints the stated carryover, so a stated 0 prints 0. Line 1 prints 0
  when no entity has a credit (a carryover only), while Part I line 2 is blank.
  The blind fill left both blank. No dollar changes.

### 10. Schedule P (540) line 21 with a gap (done)

- A credit through a disregarded SMLLC makes line 4 unsupported. Schedule P
  line 21 columns (b) to (d) now share that gap, so the schedule never prints
  a credit used that line 4 cannot figure. Column (a) still prints line 3.

### 11. Form 540 Box C (not now)

- Source: Schedule P is completed when CA AGI is over $347,808 (single)
  (`ca-540-inst-2025::sec::box-c::b01`).
- Not now: this credit is in Section B4 and can reduce tax below TMT, so the
  credit is the same with or without Schedule P when no Section A credit
  applies. Box C is Schedule P's rule (`schedule-p/resolveInfo.ts`).

## Pattern change

- Form 540 line 45. Before: always unsupported. After: with three or more
  other credits it holds their Schedule P column (b) total, and lines 43 and 44
  stay blank; with fewer it is blank.
- Form 540 lines 47 and 48. Before: an other credit's gap left them summed
  without it. After: they carry the gap, so a credit is never dropped in
  silence. Only this credit has a gap on a Form 540 return today.

## Blind fill (2026-11-25)

A blind preparer filled 14 cases from the blank form and the instructions
only. Every dollar amount agrees with the engine, Schedule P (540) line 21
included. The only differences are blank against 0 (point 9). The blind
doubts that change a dollar amount are points 1 (TMT), 2 (order) and 8 (more
than two credits with no Schedule P).

## Unsupported cases

| Field | Case | Why |
| --- | --- | --- |
| Part II line 4 (and line 5); Schedule P line 21 (b) to (d) | a credit through a disregarded single member LLC | The limit is the tax with and without that LLC's income (`::e-limitations::b01`); the engine does not figure it. |
| Part II line 4 (and line 5) | a Form 540NR return | Form 540NR and Schedule P (540NR) have no rules. |
| Part II line 4 (and line 5) | no Form 540 (a Form 541 fiduciary) | Form 541 is not in the engine. |

## Proposals for a discussion

- The California K-1 (100S, 565, 568, 541) as a fact kind with every column,
  so the credit, the income and the California adjustments come from one
  document. Today the credit is a stated answer of its own.

## Second opinions

- PolicyEngine-US 2.153.8 (commit b3edc0446b), `variables/gov/states/ca/tax/income/credits/`
  and `parameters/gov/states/ca/tax/income/credits/`. Compared on 2026-11-25.
  It does not model the PTE elective tax credit. No lead.
- IRS Direct File: federal only, no California forms. Not compared.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, ID type, SSN) | stated rule |
| Part I rows, columns (a) to (c) | stated rule (stated K-1 amounts) |
| Part I line 2; Part II lines 1, 3, 5 | stated rule (the form's arithmetic) |
| Part II line 2 | stated rule |
| Part II line 4, no Schedule P | stated rule for the order; own reading for TMT (decision A1) |
| Part II line 4, with Schedule P | stated rule (line 21 column (b)) |
| More than ten entities | own reading (point 4) |
| Line 4 for SMLLC, 540NR, 541 | unsupported |
