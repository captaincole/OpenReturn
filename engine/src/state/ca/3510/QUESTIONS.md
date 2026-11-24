# FTB 3510: doubts

The 2025 instructions (ca-3510-inst-2025) have no worked example with numbers.
Each doubt below names the source text, the default the engine applies, and
whether the choice changes a dollar amount.

## 1. Lines 5 and 6 come from the 2024 filing status

- Source: line 5 "Enter the amount from your 2024 Schedule P (540 or 540NR)
  Instructions for line 22 Exemption Worksheet, line 1"; line 6, "line 3" (the form).
- Default: the engine asks the 2024 filing status and prints the 2024 worksheet
  amounts for it: $90,048 / $337,678 (single, head of household), $120,065 /
  $450,238 (joint, surviving spouse), $60,029 / $225,115 (separate). Source: the
  2024 Schedule P (540) instructions, Exemption Worksheet (not in the corpus;
  read from ftb.ca.gov). The separate pair matches the form's 541 amounts.
- Changes dollars: no, if the 2024 filing status is right.

## 2. Line 1 subtracts 2024 Schedule P lines 17 and 18

- Source: "Combine the amounts from your 2024 Schedule P (540 or 540NR), Part I,
  line 15 through line 18" (the form). The 2024 Schedule P prints lines 17 and
  18 in parentheses.
- Default: line 15 + line 16 − line 17 − line 18. The taxpayer states 17 and 18
  as the positive amounts inside the parentheses.
- Changes dollars: yes, when line 17 or 18 has an amount.
- Related finding, outside this form: the engine's 2025 Schedule P (540) line 19
  adds line 18 (schedule-p/bindings.ts). The 2024 and 2025 forms print line 18 in
  parentheses, and the instructions say the AMT drops the regular-tax limit on
  itemized deductions, so line 18 should lower AMTI. This changes 2025
  Schedule P line 19 for an itemizer above the federal AGI threshold. Not
  changed here: it is another form, and it may change existing goldens.

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
  and the name shortened to "Prior Year AMT" to fit the box. Blank when line 38 is 0.
- Changes dollars: no.

## 12. A 2025 Form 540NR filer

- Default: lines 33 to 39 are unsupported: Schedule P (540NR) has no rules yet.
  Sections A and B still compute.

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
