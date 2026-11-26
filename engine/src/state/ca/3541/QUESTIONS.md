# FTB 3541: open points

The instructions (`ca-3541-inst-2025`) have no example with numbers. The
California Film Commission's "Program 4.0 Refundability Summary" (July 2023)
has two examples for Part IV; they are unit tests (`lines.test.ts`). Every
other rule is a stated rule or the author's reading.

## Two texts conflict (decided by the author)

### 1. The order of the Section B2 credits (A68)

- Sources: `ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01`
  (limited carryovers first, "However, you may apply credits with no
  limitation on carryover first"); `::how-to-compute-the-limitation::b01`
  (low-income housing "after any business credits");
  `ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b02`
  (line 21: tax less "any non-refundable credits (except program 4.0)").
- Default: film credits first (239, 245, 248), then the passive credits.
- Changes dollars: yes, when the tax is short. DECISION in `creditUsed.ts`.

### 2. Schedule P (540) column (d) of the program 4.0 credit (A69)

- Sources: `ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01`
  (column (d) subtracts only an FTB 3870 election);
  `ca-3541-inst-2025::sec::part-ii-carryover-computation::b03` (line 13 leaves
  out Part IV).
- Default: column (d) also subtracts Part IV line 22.
- Changes dollars: only the printed carryover. DECISION in `schedule-p/sectionB2.ts`.

## Doubts with no conflicting text

### 3. Line 11 adds lines 1 to 5a

- Source: "Subtract line 10 from any entry made on line 1, line 2, line 3,
  line 4a, or line 5a" (the form; `::part-i-available-credit::b01`).
- Default: line 11 is the total of lines 1, 2, 3, 4a and 5a, less line 10,
  not less than 0. A certificate has one of lines 1 to 4a, plus a carryover.
- Changes dollars: no, for one certificate a form.

### 4. Several certificates of one code

- Source: "enter the sum of this line for all forms FTB 3541 on your current
  year tax return using the appropriate credit code"
  (`::part-ii-carryover-computation::b01`); "Apply the credit carryover to the
  earliest taxable year" (`::d-carryover::b01`).
- Default: Schedule P (540) has one line per code. Line 12a of each form is
  its share of the code's credit taken, the oldest certificate first (year
  issued, then the order recorded).
- Changes dollars: no total; it moves the carryover between forms.

### 5. Line 22 at zero or less

- Source: "If zero or less, stop. You do not qualify to elect a refundable
  credit" (the form).
- Default: line 22 prints 0, lines 23 to 26 and 12d stay blank, and the
  election box is not checked.
- Changes dollars: no.

### 6. The election and the credits after it

- Source: line 21 subtracts every other nonrefundable credit (`::b02` above);
  CFC Example 2: "Liability after using all other credits".
- Default: with the election and a credit Schedule P (540) applies after
  program 4.0 (FTB 3801-CR, Schedule S, FTB 3804-CR on the return), Part IV
  and Form 540 line 74 are unsupported. With two program 4.0 certificates and
  an election, Part IV is unsupported: line 21 of each form would take the
  same tax.
- Changes dollars: not figured.

### 7. Who may elect

- Source: "Taxpayers who purchase a credit attributable to an independent film
  are not permitted to elect a refund"; the election is made "in the first
  taxable year the certificate is issued" (`::what-s-new::b01`); "Do not
  complete this part if you have purchased credits" (the form).
- Default: a bought credit, or a certificate issued before 2025, has no Part
  IV even when the fact says it elects.
- Changes dollars: yes, line 74, but the instructions settle it.

### 8. Line 25 and the $5,000,000 limit

- Source: line 25 "may be less than the amount on line 24 if your total
  business credit exceeds $5,000,000" (`::part-iv-program-4-0-refundable-credit-election::b02`).
- Default: line 25 is line 24. Above $5,000,000 of film credits, or of film
  credits taken plus line 24, the credit and line 25 are unsupported; line 12c
  (the FTB 3870 election) stays blank. Other business credits (FTB 3801-CR's
  research credit) are not counted toward the limit.
- Changes dollars: only above the limit.

### 9. Lines an individual leaves blank

- Lines 4a to 4c (an assignee "must be an affiliated corporation",
  `::b-assignment-of-credits::b03`), 5b ("only if you are an entity with
  affiliates", `::part-i-available-credit::b03`), 7 and Part III ("If you are
  not a corporation, skip Part III"), and 8 (the credit an entity passes
  through). Line 12b prints 0 ("If you are not a corporation, enter 0").
- Changes dollars: no.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, boxes, lines A to C | stated rule |
| Lines 1 to 3, 5a, 9, 10, 11 | stated rule (line 11: own reading, item 3) |
| Lines 4a to 4c, 5b, 7, 8, Part III (14 to 19), 12b, 12c | stated rule (blank or 0 for an individual) |
| Line 6 | unsupported when a credit is sold (FTB 3551 and the gain are not in the engine) |
| Line 12a, 13 | stated rule, with the order of A68 and item 4 |
| Lines 20 to 24 | published example with numbers (CFC Examples 1 and 2) |
| Lines 25, 26 | stated rule (unsupported above $5,000,000) |

## Proposals for a discussion

- **An input document for the credit.** The credit comes on a CFC Tax Credit
  Certificate (no official FTB form) or on a California Schedule K-1 (565,
  568, 100S, 541) line 15f statement. The engine reads neither; the taxpayer
  states the certificate's values, as for FTB 3801-CR and FTB 3804-CR. A
  person decides what the certificate document looks like, or whether the
  California K-1 becomes an input document family.
- **FTB 3551 and the income from a sale or purchase.** A seller reports the
  sale price as gain and a buyer reports the discount as income
  (`::important-information::b06`). Both need FTB 3551 and a California
  income line; today both cases are unsupported.
- **The business credit limitation and FTB 3870.** One module could total
  every business credit taken and apply the $5,000,000 limit for all credit
  forms (FTB 3801-CR has the same open point, `3801-cr/QUESTIONS.md` item 8).
