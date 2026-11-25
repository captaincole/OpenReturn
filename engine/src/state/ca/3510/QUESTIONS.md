# FTB 3510: doubts

The 2025 instructions (ca-3510-inst-2025) have no worked example with numbers.
Each doubt below names the source text, the default the engine applies, and
whether the choice changes a dollar amount.

## Sorted by kind

1. **Two official texts conflict; a person decides:** none found.
2. **Work that could be done; not now:** items 1, 4, 6 and 12 say why. Items
   2, 3, 5, 7, 8, 9, 10, 11 and 13 are defaults that need no work.
3. **Pattern change:** none. Form 540 line 43 was unsupported; it now holds
   this credit when FTB 3510 files, and stays unsupported otherwise. Item 14 is
   the recipe for when Schedule S also writes it.

FTB 3510 has no rows or columns that a person can run out of: each line holds
one amount, and Schedule P (540) line 10 holds the one credit.

## 1. Lines 5 and 6 come from the 2024 filing status

- Source: line 5 "Enter the amount from your 2024 Schedule P (540 or 540NR)
  Instructions for line 22 Exemption Worksheet, line 1"; line 6, "line 3" (the form).
- Default: the engine asks the 2024 filing status and prints the 2024 worksheet
  amounts for it: $90,048 / $337,678 (single, head of household), $120,065 /
  $450,238 (joint, surviving spouse), $60,029 / $225,115 (separate). Source: the
  2024 Schedule P (540) instructions, Exemption Worksheet (not in the corpus;
  read from ftb.ca.gov). The separate pair matches the form's 541 amounts.
- Changes dollars: no, if the 2024 filing status is right.
- Not now: the amounts come from the 2024 Schedule P (540) instructions, which
  are not in the corpus. Adding them is a corpus change (the `corpus` skill),
  separate from this form.

## 2. Line 1 subtracts 2024 Schedule P lines 17 and 18

- Source: "Combine the amounts from your 2024 Schedule P (540 or 540NR), Part I,
  line 15 through line 18" (the form). The 2024 Schedule P prints lines 17 and
  18 in parentheses.
- Default: line 15 + line 16 − line 17 − line 18. The taxpayer states 17 and 18
  as the positive amounts inside the parentheses.
- Changes dollars: yes, when line 17 or 18 has an amount.
- The 2025 Schedule P (540) line 19 now subtracts line 18 the same way (main,
  PR #248). setalle and hurin take the standard deduction in 2025, so their
  values did not change.

## 3. Line 2 takes line 6 away and keeps signs

- Source: "combine your 2024 Schedule P (540 and 540NR), Part I, line 1 through
  line 7, line 13b, and line 13i" (ca-3510-inst-2025::sec::specific-line-instructions::b01).
  Line 6 is printed in parentheses; line 7 can be negative.
- Default: lines 1–5, 7, 13b, 13i as printed, less line 6, plus the stated
  K-1 (541) line 12e column (d) items and other exclusions (::b02).
- Changes dollars: only with a line 6 refund or a negative line 7.

## 4. Line 3, the AMT credit NOL deduction, is a stated amount

- Source: "Determine your 2024 … AMTCNOLD … by following the provisions set
  forth under R&TC Section 17276.2, 17276, 17276.21, 17276.22, and 17276.24 with
  appropriate modifications" (::b02).
- Default: the taxpayer states it; absent means none. The instructions give no
  computation, so the engine does not figure it.
- Changes dollars: yes, when an NOL exists.
- Not now: figuring it needs the R&TC sections named above and the 2024 NOL
  history, and no scenario has an NOL.

## 5. Stops: which lines stay blank

- Source: line 4 "If zero or less, enter -0- here and on line 13"; line 10 "If
  zero or less, enter -0- here and on line 13"; ::b02 and ::b03 ("Enter -0- on
  line 13, then complete Part I, Section B, if applicable, and Part II").
- Default: line 4 at 0 leaves lines 5–12 blank; line 10 at 0 leaves lines 11 and
  12 blank. Line 13 is 0 (2024 Form 540) or blank (2024 Form 540NR).
- Changes dollars: no.

## 6. Section B with line 11 blank, or line 16 at 0 or less

- Source: line 24 "Divide line 11 by line 4"; line 21 "Divide line 20 by line 16".
- Default: line 11 blank (line 4 or line 10 at 0) gives line 24 = 0, so line 27
  = 0. Line 16 at 0 or less with itemized deductions: unsupported (the form
  gives no rule). Line 21 is also kept at 0 or more.
- Changes dollars: no in the first case; the second is unsupported.
- Not now: the form gives no rule for line 16 at 0 or less, so any rule would
  be our own.

## 7. Ratios round to four places, half up, and the rounded ratio multiplies

- Source: lines 21 and 24 print four places ("Do not enter more than 1.0000").
- Default: round half up to four places; lines 22 and 25 multiply by the
  printed ratio, then round to whole dollars.
- Changes dollars: by a few dollars at most.

## 8. Line 29 with no 2024 AMT

- Source: line 28 "Enter the AMT from your 2024 Schedule P"; line 29 "Enter
  the amount from line 13".
- Default: with a carryover and no 2024 AMT, Part I is blank (not asked), and
  lines 28 and 29 are 0.
- Changes dollars: no.

## 9. Line 32 at 0 or less, and who files

- Source: "If line 32 is zero or less, you do not have an AMT credit or an AMT
  credit to carry over. Do not complete the rest of this form" (::b04).
- Default: the form files when a 2024 AMT or carryover is above 0 and line 32
  (figured from the answers alone) is above 0, or while an answer waits. Line
  32 at 0 or less takes the form off the return.
- Changes dollars: no.

## 10. Line 34 leaves out the credit for prior year AMT itself

- Source: line 34, "other allowable credits that are listed on your 2025
  Schedule P (540 …), Section A1 and Section A2, column (b)" (::b05). The
  credit for prior year AMT is Section A2 line 10.
- Default: Form 540 line 32 plus column (b) of Schedule P lines 4 to 9. The
  Schedule P instruction "The prior year AMT credit must be applied before any
  credits that can reduce regular tax below the TMT"
  (ca-540-sched-p-inst-2025::sec::e-credit-for-prior-year-alternative-minimum-tax::b01)
  is not modeled as an order: only line 5 (FTB 3506) has rules there.
- Changes dollars: only with a Section A1 or A2 credit next to this one.

## 11. Schedule P line 10 and Form 540 line 43

- Source: FTB 3510 line 38 "here and in column (b) of your 2025 Schedule P
  (540), Part III, line 10"; Schedule P: one or two other credits go on Form
  540 lines 43 and 44 (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01).
- Default: column (a) is line 32; column (b) is line 38; column (c) is the last
  column (c) above, less column (b); column (d) is (a) − (b). Form 540 line 43
  takes the credit (the only other credit the engine figures), with code 188
  and the name shortened to "Prior Year AMT" to fit the box. Blank when line 38
  is 0. Unsupported, with main's reason, when FTB 3510 does not file.
- Changes dollars: no.

## 14. Form 540 line 43 when Schedule S is on `main` too

This branch alone puts the credit for prior year AMT on Form 540 line 43 (name
"Prior Year AMT", code 188). The `schedule-s` branch alone puts the other state
tax credit on line 43 too (name "Other State Tax", code 187). Each is right
alone; together they collide. The rules:

- "To claim only one or two credits, enter the credit name, code, and amount
  of the credit on line 43 and line 44. To claim more than two credits, use
  Schedule P (540), Part III" (`ca-540-inst-2025::sec::line-43-through-line-45-additional-special-credits::b01`).
- "If you claim one or two other credits, enter the name, code, and amount of
  the credit from column (b) on Form 540, line 43 and/or line 44. If you have
  more than two other credits, do not use line 43 or 44 on Form 540. Add the
  amounts from column (b) for the other credits and enter the total on Form
  540, line 45" (`ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01`).
- Neither text says which credit goes first. The recipe takes Schedule P
  Part III order (line 10 before line 20); that order is our choice.

Recipe for whoever merges the second branch:

1. In `engine/src/state/ca/540/credits.ts`, replace both branches' line 43
   functions with one ordered list of the credits claimed: this credit
   (Schedule P line 10 column (b), above 0) first, then the other state tax
   credit (Schedule S's `line43CreditAmount` amount, above 0). The first takes
   line 43 (name, code, amount), the second line 44.
2. Bind `line.44_credit_name`, `line.44_credit_code` and `line.44_credit_amount`
   in `540/bindings.ts` and take them off its `unsupported` list. Line 44 is
   blank with fewer than two credits.
3. With neither form filing, line 43 stays unsupported with main's reason (both
   branches do this). With a form filing and no credit used, line 43 is blank.
4. A third other credit does not exist today. When one comes, lines 43 and 44
   stay blank and line 45 holds the total of the column (b) amounts.
5. Schedule S line 2 subtracts the other credits (`OTHER_CREDIT_LINES` in
   `schedule-s/returnAmounts.ts`), today through `form-540.line.44_credit_amount`.
   After the merge, read this credit from `schedule-p.2.part3.10_prior_year_amt_credit_used_col_b`
   instead of lines 43 and 44, or Schedule S line 2 would depend on its own credit.
6. Line 47 waits for both credits: keep `priorYearAmtCreditWaits` here and
   Schedule S's check that line 43 is figured.
7. Schedule P line 11 already counts line 10 column (c) (main), so Schedule S's
   line 20 balance needs no change.
8. Add a test or scenario that claims both: line 43 is code 188, line 44 is
   code 187, and Schedule S line 2 is line 35 less this credit.

## 12. A 2025 Form 540NR filer

- Default: lines 33 to 39 are unsupported: Schedule P (540NR) has no rules yet.
  Sections A and B still compute.
- Not now: it waits for Form 540NR and Schedule P (540NR) rules.

## 13. Whole-dollar rounding of the computed lines

- Source: the form and the instructions give no rounding rule for lines 8, 11,
  22, 25 or the separate-return addition on line 4.
- Default: each line rounds to the nearest dollar when it is computed (50
  cents and up rounds up), the engine's rule for every form. The blind fill
  made the same choice (blind doubt 3).
- Changes dollars: by $1 at most, when a product ends in exactly 50 cents
  (line 8 at $8,080.50 prints $8,081).

## Blind check (2026-11-24)

A blind preparer filled 15 cases from the blank form and the instructions. No
line differs in dollars. Two lines differ only as blank against 0: line 31 with
no carryover (engine 0, blind blank) and line 15 when 2024 Schedule P (540NR)
line 35 is blank (engine 0, blind blank). Neither changes a later line. The
blind doubts that can change dollars are items 1, 3, 7 and 13 here.

## Second opinions

- PolicyEngine-US 2.153.8 (commit b3edc0446b), `parameters/gov/states/ca/tax/income/amt/`
  and `variables/gov/states/ca/tax/income/alternative_minimum_tax/`. Compared on 2026-11-24.
  It models the California AMT (Schedule P Part II), not the credit for prior
  year AMT: FTB 3510 Part II (lines 28 to 39) has no counterpart there.
  - Lines 5 and 6, 2024 values: $90,048 / $337,678 single and head of household,
    $120,065 / $450,238 joint and surviving spouse, $60,029 / $225,115 separate.
    Agrees with the engine. The blind preparer recalled $337,672 / $450,230 for
    line 6 (1.5 and 2 times the separate amount); those do not index at 3.0% to
    the 2025 worksheet amounts ($347,808 / $463,745,
    `ca-540-sched-p-inst-2025::sec::exemption-worksheet::b01`), and
    PolicyEngine has $337,678 / $450,238. Engine kept.
  - Line 4 separate-return threshold $465,231 (the form): PolicyEngine's 2024
    separate upper threshold is the same. Agrees.
  - Line 8 phase-out rate 25%, line 11 rate 7%, line 9 child amount $9,450
    (`ca-3510-inst-2025::sec::specific-line-instructions::b03`): same values,
    and the same smaller-of rule on line 9. Agrees. It gates the child rule
    on "qualifying child dependent"; the engine asks the FTB conditions. Scope
    difference only.
- IRS Direct File: federal only, no California forms. Not compared. The repo
  names no other reference implementation for this form.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 1, 2 (2024 Schedule P amounts) | own reading (signs, doubts 2 and 3) |
| Line 3 | stated amount (doubt 4) |
| Line 4 and the separate-return rule | stated rule |
| Lines 5, 6 | stated rule, 2024 amounts from the 2024 instructions |
| Lines 7 to 13 | stated rule |
| Section B, lines 14 to 27 | stated rule; ratio rounding is own reading (doubt 7) |
| Lines 28 to 32 | stated rule |
| Lines 33 to 39 (2025 Form 540) | stated rule; line 34 is own reading (doubt 10) |
| Lines 33 to 39 (2025 Form 540NR) | unsupported |
| Schedule P line 10, Form 540 line 43 | stated rule |
