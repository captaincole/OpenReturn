# FTB 3804-CR: open points

No published example with numbers exists for this form. The corpus has no
example, and the FTB help pages could not be read. Every rule below is a
stated rule or the author's reading.

## 1. The credit and tentative minimum tax (decided, waiting for review)

- Sources: "the total amount you may claim for all credits is limited by
  tentative minimum tax (TMT)" (`ca-540-inst-2025::sec::special-credits-and-nonrefundable-credits::b01`);
  "This credit can reduce regular tax below tentative minimum tax (TMT)"
  (`ca-3804cr-inst-2025::sec::general-information::b03`).
- Default: no TMT floor. Line 4 is the tax left after the credits before it.
- Changes a dollar amount: yes. Row A1 in `docs/rule-decisions.md`.

## 2. The order of the credits with no Schedule P (540)

- Source: "The PTE elective tax credit should be applied against the net tax
  after the other state tax credit" (`ca-540-sched-p-inst-2025::sec::pass-through-entity-pte-elective-tax-credit::b01`).
- Default: with no Schedule P, line 4 is Form 540 line 35 less line 40, the
  credit for prior year AMT, line 46 and the other state tax credit. This is
  the Schedule P Part III order, where the credit is the last line (21).
- Changes a dollar amount: no, against the text.

## 3. Rounding of column (c) and line 2

- Source: the K-1 prints the credit; the form takes whole dollars.
- Default: each row rounds to the nearest dollar, and Part I line 2 adds the
  rounded rows (the form's arithmetic). Part II line 2 rounds the carryover.
- Changes a dollar amount: at most $1 per row, only for a credit with cents.

## 4. More than ten entities

- Source: "use additional forms FTB 3804-CR to report all PTE elective tax
  credit amount(s)" (`ca-3804cr-inst-2025::sec::line-1-column-c-pte-elective-tax-credit-s::b01`);
  Part II line 1 is "the total ... from all form(s) FTB 3804-CR, Part I, line 2"
  (`::line-1-total-credit-from-electing-qualified-ptes::b01`).
- Default: one form per ten entities. Each form has its own Part I line 2.
  Part II is filled on the first form only; the later forms leave it blank.
- Changes a dollar amount: no.

## 5. Spouses

- Source: "A taxpayer and spouse/RDP may claim only one credit. If separate
  returns are filed, the credit may be taken by either spouse/RDP or divided
  equally between them" (`ca-3804cr-inst-2025::sec::e-limitations::b01`).
- Default: a joint return lists every entity of both spouses on one form. On
  a separate return, the stated credit is the part this return claims; the
  engine does not split it.
- Changes a dollar amount: no, the split is the taxpayer's choice.

## 6. The carryover period

- Source: "carried over to reduce the tax for five years or until exhausted ...
  Apply the carryover to the earliest taxable year possible"
  (`ca-3804cr-inst-2025::sec::f-carryover::b01`).
- Default: line 2 is last year's line 5, with no expiry. The election began
  for taxable years starting in 2021, so the oldest credit can be used through
  2026; none expires in 2025.
- Changes a dollar amount: not in 2025. A 2026 return needs the credit by year.

## 7. The name on Form 540 lines 43 and 44

- Source: the Credit Table name is "Pass-Through Entity Elective Tax"
  (`ca-540-sched-p-inst-2025::sec::credit-table::b01`).
- Default: "PTE Elective Tax", the instructions' own abbreviation, because the
  name box is short. Code 242 names the credit.
- Changes a dollar amount: no.

## 8. Schedule P (540) and "more than two credits"

- Source: attach Schedule P when "You have more than two credits"
  (`ca-540-sched-p-inst-2025::sec::b-who-must-file::b01`).
- Default: the engine files Schedule P by its existing rules. Three other
  credits always include the prior year AMT credit, which files it. A child
  care credit (line 40) with two other credits does not file it.
- Changes a dollar amount: rarely. Without Schedule P, the line 40 credit is
  not held to the tentative minimum tax.

## Unsupported cases

| Field | Case | Why |
| --- | --- | --- |
| Part II line 4 (and line 5) | a credit through a disregarded single member LLC | The limit is the tax with and without that LLC's income (`::e-limitations::b01`); the engine does not figure it. |
| Part II line 4 (and line 5) | a Form 540NR return | Form 540NR and Schedule P (540NR) have no rules. |
| Part II line 4 (and line 5) | no Form 540 (a Form 541 fiduciary) | Form 541 is not in the engine. |

## Proposals for a discussion

- The California K-1 (100S, 565, 568, 541) as a fact kind with every column,
  so the credit, the income and the California adjustments come from one
  document. Today the credit is a stated answer of its own.

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
