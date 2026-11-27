# FTB 3541: open points

The instructions (`ca-3541-inst-2025`) have no example with numbers. The
California Film Commission's "Program 4.0 Refundability Summary" (July 2023)
has two examples for Part IV; they are unit tests (`lines.test.ts`). Every
other rule is a stated rule or the author's reading.

## Two texts conflict

Decided by the author; each has a DECISION comment and a row in
`docs/rule-decisions.md`.

### 1. The order of the Section B2 credits (A75)

- Sources: `ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01`
  (limited carryovers first, "However, you may apply credits with no
  limitation on carryover first"); `::how-to-compute-the-limitation::b01`
  (low-income housing "after any business credits");
  `ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b02`
  (line 21: tax less "any non-refundable credits (except program 4.0)").
- Default: film credits first (239, 245, 248), then the passive credits.
- Changes dollars: yes, when the tax is short. DECISION in `creditUsed.ts`.

### 2. Schedule P (540) column (d) of the program 4.0 credit (A76)

- Sources: `ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01`
  (column (d) subtracts only an FTB 3870 election);
  `ca-3541-inst-2025::sec::part-ii-carryover-computation::b03` (line 13 leaves
  out Part IV).
- Default: column (d) also subtracts Part IV line 22.
- Changes dollars: only the printed carryover. DECISION in `schedule-p/sectionB2.ts`.

## Should we do this now

Doubts with no conflicting text. Each says whether it is done, or why not now.

### 3. Line 11 adds lines 1 to 5a

- Source: "Subtract line 10 from any entry made on line 1, line 2, line 3,
  line 4a, or line 5a" (the form; `::part-i-available-credit::b01`).
- Default: line 11 is the total of lines 1, 2, 3, 4a and 5a, less line 10,
  not less than 0.
- Done. It changes no dollars: a certificate passes through once, so one
  form has either a current-year amount (lines 1 to 4a) or a carryover.

### 4. Several certificates of one code

- Source: "enter the sum of this line for all forms FTB 3541 on your current
  year tax return using the appropriate credit code"
  (`::part-ii-carryover-computation::b01`); "Apply the credit carryover to the
  earliest taxable year" (`::d-carryover::b01`).
- Default: Schedule P (540) has one line per code. Line 12a of each form is
  its share of the code's credit taken, the oldest certificate first (year
  issued, then the order recorded).
- Done; `moria` has two certificates of code 239. It moves the carryover
  between forms and changes no total.

### 5. Line 22 at zero or less

- Source: "If zero or less, stop. You do not qualify to elect a refundable
  credit" (the form).
- Default: line 22 prints 0, lines 23 to 26 and 12d stay blank, and the
  election box is not checked.
- Done. Changes no dollars.

### 6. The election and the credits after it

- Source: line 21 subtracts every other nonrefundable credit (`::b02` above);
  CFC Example 2: "Liability after using all other credits".
- Default: with the election and a credit Schedule P (540) applies after
  program 4.0 (FTB 3801-CR, Schedule S, FTB 3804-CR on the return), Part IV
  and Form 540 line 74 are unsupported. With two program 4.0 certificates and
  an election, Part IV is unsupported: line 21 of each form would take the
  same tax.
- Not now: it needs Schedule P (540) to apply the later credits before
  program 4.0 only for line 21, a change to Schedule P's order for a rare
  return.

### 7. Who may elect

- Source: "Taxpayers who purchase a credit attributable to an independent film
  are not permitted to elect a refund"; the election is made "in the first
  taxable year the certificate is issued" (`::what-s-new::b01`); "Do not
  complete this part if you have purchased credits" (the form).
- Default: a bought credit, or a certificate issued before 2025, has no Part
  IV even when the fact says it elects.
- Done. It changes line 74, but the instructions settle it.

### 8. Line 25 and the $5,000,000 limit

- Source: line 25 "may be less than the amount on line 24 if your total
  business credit exceeds $5,000,000" (`::part-iv-program-4-0-refundable-credit-election::b02`).
- Default: line 25 is line 24. Above $5,000,000 of film credits, or of film
  credits taken plus line 24, the credit and line 25 are unsupported; line 12c
  (the FTB 3870 election) stays blank. Other business credits (FTB 3801-CR's
  research credit) are not counted toward the limit.
- Not now: the limit covers every business credit form, so it belongs in one
  shared module (Pattern change below).

### 9. Lines an individual leaves blank

- Lines 4a to 4c (an assignee "must be an affiliated corporation",
  `::b-assignment-of-credits::b03`), 5b ("only if you are an entity with
  affiliates", `::part-i-available-credit::b03`), 7 and Part III ("If you are
  not a corporation, skip Part III"), and 8 (the credit an entity passes
  through). Line 12b prints 0 ("If you are not a corporation, enter 0").
- Done. Changes no dollars.

### 10. A stated carryover past its carryover period

- Source: "the unused credit may be carried over for six years for the
  original credit, and nine years for the new, program 3.0, soundstage
  filming, and program 4.0 credit" (`::d-carryover::b01`); "The carryover
  period for disallowed credit is extended by the number of taxable years the
  credit was not allowed" (`::important-information::b03`).
- Default (2026-11-26, after the tax review): the period counts from the year
  the certificate was issued. A carryover stated after it is unsupported on
  line 5a and from line 10 on, not 0, because an earlier year of the
  $5,000,000 limit may have extended it and the engine does not track those
  years. In 2025 only an original credit (code 223) issued before 2019
  reaches it; the nine-year credits began in 2016 or later. `lyrelle`'s
  original certificate is now issued in 2020.
- Done, with two limits left. The instructions do not say whether the period
  counts from the year issued or the year first claimed; for a 2025 return
  both give the same answer. A carryover stated on a certificate issued in
  2025 cannot exist and is not refused: not now, because it is an input
  error that no text makes a rule of.

### 11. The 10% of line 22 that Part IV does not refund

- Source: line 12a "Do not include any refundable program 4.0 credit"
  (`::part-ii-carryover-computation::b01`); line 13 "Do not include ... amounts
  included in Part IV" (`::b03`); "Total refundable amount is 90% of the credit
  amount that exceeds the "tax"" (`::part-iv-program-4-0-refundable-credit-election::b01`).
- Default: line 13 is line 11 less lines 12a, 12b and 12d, and line 12a is
  the smaller of the tax left and line 11 less line 12d. The 10% of line 22
  that line 23 keeps out is neither refunded nor carried over.
- Done as the form's arithmetic says. Blind case 7 (line 22 27,000) would
  carry 2,700 more if the 10% were carried.

### 12. Line 20 when part of the credit went against sales and use tax

- Source: line 20 "Enter the amount from Part I, line 1, 2, or 4a" (the form);
  line 21 adds "any amounts entered in Part I, line 10" (`::b02` above).
- Default: line 20 is the gross amount on line 1 or 2, before line 10 comes
  off, and line 21 adds line 10 back, as the form says.
- Done as the form says. Blind case 14 (line 2 20,000, line 9 4,000, tax
  10,000): line 22 is 6,000; with line 20 net of line 10 (16,000) and line 21
  still adding line 10, line 22 would be 2,000.

## Pattern change

### Proposals for a discussion

- **An input document for the credit.** Before: the credit comes on a CFC
  Tax Credit Certificate (no official FTB form) or on a California Schedule
  K-1 (565, 568, 100S, 541) line 15f statement, and the taxpayer states its
  values as a fact, as for FTB 3801-CR and FTB 3804-CR. After: a person
  decides what the certificate document looks like, or the California K-1
  becomes an input document family that Cade reads.
- **FTB 3551 and the income from a sale or purchase.** Before: a credit sold,
  or bought below its amount, is unsupported, because the seller reports the
  sale price as gain and the buyer reports the discount as income
  (`::important-information::b06`). After: FTB 3551 and a California income
  line carry those amounts, and lines 3 and 6 compute.
- **The business credit limitation and FTB 3870.** Before: each credit form
  checks the $5,000,000 limit on its own credits only (FTB 3801-CR has the
  same open point, `3801-cr/QUESTIONS.md` item 8). After: one module totals
  every business credit taken, applies the limit for all credit forms, and
  fills FTB 3541 lines 12c and 25.

## Second opinions

- Blind fill (2026-11-26, 14 cases from the blank form, the instructions and
  Schedule P (540)): every dollar amount matched. The one difference is a
  blank against 0: case 9 (line 22 zero or less) prints line 12d blank, and
  the blind fill wrote 0 (item 5; the engine default is kept). The blind
  doubts that change dollars are items 10 to 12.
- PolicyEngine-US 2.154.1 (commit 0fbed6ddb1): it does not model FTB 3541.
  Its California nonrefundable credits are the exemption credits, the
  dependent care credit and the renter's credit only, and it has no
  business credit or the $5,000,000 limit. Not compared.
- IRS Direct File: federal only, no California forms. Not compared. The repo
  names no other reference implementation for this form.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, boxes, lines A to C | stated rule |
| Lines 1 to 3, 5a, 9, 10, 11 | stated rule (line 11: own reading, item 3; line 5a: the period test, item 10) |
| Lines 4a to 4c, 5b, 7, 8, Part III (14 to 19), 12b, 12c | stated rule (blank or 0 for an individual) |
| Line 6 | unsupported when a credit is sold (FTB 3551 and the gain are not in the engine) |
| Line 12a, 13 | stated rule, with the order of A75 and item 4 |
| Lines 20 to 24 | published example with numbers (CFC Examples 1 and 2) |
| Lines 25, 26 | stated rule (unsupported above $5,000,000) |

## Rows past the form's limit

- One form per certificate: the engine files a copy for each certificate fact
  (`lyrelle` has five).
- Part III has five assignee rows, for corporations only; an individual skips
  Part III.
- Schedule P (540) Section A2: the two film codes (223, 237) go on lines 6
  and 7, so they always fit.
- Schedule P (540) Section B2: the engine fills lines 16 to 18 for the film
  and passive credits. A fourth credit is unsupported with its reason
  (`TOO_MANY_B2_CREDITS`; `form.test.ts`, "a fourth Section B2 credit is a
  gap"). Line 19 is not filled: not now, because the Section B2 rows are
  shared with FTB 3801-CR (`3801-cr/creditUsed.ts`) and four such credits on
  one return are rare.
