# Schedule G-1 (California): open questions

The rules come from ca-540-sched-g1-inst-2025. No answer key exists. These are
the places where the form and its instructions do not settle a rule. Each one
names the default the engine applies.

## 1. Schedule CA line 5b, column B (changes dollars)

- Source: "The separate tax is added to the regular tax figured on your other
  income." (ca-540-sched-g1-inst-2025::sec::a-purpose::b01). Federal Form 4972:
  "If you don't use Form 4972 … Report the entire amount from box 1 … on line
  5a, and the taxable amount on line 5b" (irs-4972-form-2025::sec::how-to-report-the-distribution::b01).
- Gap: the Schedule CA instructions for line 5b say nothing about a lump sum
  (ca-540-sched-ca-inst-2025::sec::line-5a-and-line-5b-pensions-and-annuities::b01).
- Default: when federal Form 4972 does not file, federal AGI holds box 2a. The
  part that Schedule G-1 taxes is subtracted on Schedule CA line 5b, column B:
  box 3 under Part II, the rest of box 2a under Part III. Without it, California
  would tax the same amount twice.
- When Form 4972 also files, the line is unsupported: Form 4972 has no rules,
  so the part federal AGI leaves out is not known.
- Not modeled: Form 4972 used federally but Schedule G-1 not used (a column C
  addition).

## 2. Death benefit exclusion with several recipients (changes dollars)

- Source: "allocate the $5,000 maximum death benefit exclusion among the
  recipients in the same proportion that they share the distribution"
  (::death-benefit-worksheet::b01). Line 8 divides by box 9a, and line 28
  multiplies line 27 by box 9a (::multiple-recipients-…::b02, ::line-8-…::b03).
- The federal text says the opposite for this case: "Don't allocate the
  exclusion among the recipients; the computation … effectively allocates the
  exclusion" (irs-4972-form-2025::sec::line-9::b01).
- Default: the California text. The fact holds the recipient's share, and line 9
  uses it as stated.

## 3. Whole dollars on lines 18, 19, 24 and 25 (changes dollars, by $10 at most per line)

- Source: the Tax Rate Schedule gives cents ("$34.90 + 2.00%", ::tax-rate-schedule-…::b01).
  Lines 20 and 26 multiply lines 19 and 25 by ten.
- Default: the engine's rule, each line rounded to the nearest dollar
  (CLAUDE.md, whole-dollar rounding). So line 20 is ten times a rounded line 19.

## 4. Line 21 and the worksheet ratios (changes dollars, by cents to a few dollars)

- Source: line 21 is "carried to four places and rounded to three places"
  (::line-8-…::b02). The worksheets' line C is "rounded to at least three
  places" (irs-4972-form-2025::sec::specific-instructions::b04); the California
  Death Benefit Worksheet says only "enter the result as a decimal".
- Default: line 21 cuts to four places, then rounds half up to three. The NUA
  and Death Benefit Worksheet ratios round to three places.

## 5. Line 7 and line 28 without Part III (no dollar change)

- Source: line 7, "If you elect to use Part III, go to line 8. Otherwise, enter
  the amount from line 7 on Form 540, line 34" (the blank form).
- Default: without Part III, lines 8 to 28 stay blank and Form 540 line 34 takes
  line 7. Line 6 is 0 without the 5.5% election ("Enter zero (-0-) and go to
  Part III", ::part-ii::b01), so line 7 prints 0.

## 6. Box 8 and its percentage (no dollar change for one recipient)

- Source: "Divide the amount shown on federal Form 1099-R, box 8, by the
  percentage shown on federal Form 1099-R, box 8" (::line-8-…::b02).
- Default: a new 1099-R field, box8Percent; absent means 100%. Box 8 on a named
  1099-R is read as the annuity's value: the fact names only lump-sum 1099-Rs.

## 7. A California basis that differs (FTB Pub. 1005)

- Source: ftb-pub-1005-2025::sec::california-federal-worksheet-i::b01: line 6 =
  California taxable amount × box 3 ÷ box 2a; line 8 = that amount − line 6.
- Default: the fact's californiaTaxableAmount, when stated, replaces box 2a.
  With the NUA election or a death benefit exclusion, the schedule is
  unsupported: neither text says how the worksheets use it. Schedule CA's basis
  adjustment is unsupported too.

## 8. Who files and what Cade asks

- The fact is the taxpayer's choice. A 1099-R with "total distribution" for a
  person born before 1936 does not make the engine ask about Schedule G-1 by
  itself. Cade's question decides it.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I, lines 1 to 5 | stated rule (taxpayer's answers) |
| Lines 6 and 7 | stated rule; death benefit and NUA worksheets own reading of the ratio places |
| Lines 8 to 12 | published example with numbers (Pub. 575, 2012, federal) |
| Lines 13 to 17 | published example (skip at $70,000) and stated rule (the allowance) |
| Lines 18 to 20 | published example for line 18; stated rule for the schedule; own reading of rounding |
| Lines 21 to 24 | published example with numbers (Pub. 575, 2012) and the instructions' rounding examples |
| Lines 25 to 27 | stated rule; own reading of rounding |
| Line 28 | stated rule (worksheet) |
| Form 540 line 34 and its box | stated rule |
| Schedule CA line 5b, column B | own reading (question 1) |
| Several participants, an IRA 1099-R, a blank box 2a, mixed percentages | unsupported |
