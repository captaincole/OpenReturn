# FTB 3801 — open questions

Each item is a place where the form and its instructions do not settle a rule.
It gives the source text, the default the engine applies, and whether the
default changes a dollar amount.

## 1. Who files: a federal loss on a property that has only California gains

- Source: "Form FTB 3801 is filed by individuals ... that have losses
  (including prior year unallowed losses) from passive activities"
  (`ca-3801-inst-2025::sec::b-who-must-file::b01`). Schedule CA line 5: use
  FTB 3801 with "one or more passive activities that produce a loss"; use FTB
  3885A for "passive activities that produce gains"
  (`ca-540-sched-ca-inst-2025::sec::line-5-rental-real-estate-royalties-partnerships-s-corporations-trusts-etc::b01`, `::b02`).
- The gap: a property can have a federal loss (federal Form 8582 limits it)
  and a California gain (lower California depreciation). FTB 3885A alone then
  misses the federal limit.
- Default: the form files for a passive property with a California loss or
  carryover, and also with a federal loss or carryover on a property that is
  passive federally. Its Schedule E worksheet then sets line 5.
- The exception (only rental real estate whose loss the special allowance
  takes in full) is not modeled: Part II allows the whole loss, so filing then
  changes no amount.
- Changes dollars: yes, Schedule CA line 5 in the federal-loss case.

## 2. Line 8 limit for married/RDP filing separately who lived apart

- Source: the form's line 8 says "Do not enter more than $25,000". The
  California text changes only line 5 to $75,000 ("Line 5",
  `ca-3801-inst-2025::sec::part-ii::b01`) and says "Get federal Form 8582 for
  line instructions". Federal line 8: "Don't enter more than $12,500 ... if
  you're married filing a separate return and ... lived apart"
  (`irs-8582-inst-2025::sec::line-8::b01`).
- Default: $12,500 (the federal rule, which IRC 469(i)(5) sets and California
  follows).
- Changes dollars: yes, for that filer when line 7 is over $25,000.

## 3. Line 9 when Part II does not apply

- Source: line 3 text: "Otherwise, enter -0- on line 9 and go to line 10";
  MFS who lived together: "You must enter -0- on line 9"
  (`ca-3801-inst-2025::sec::part-ii::b01`).
- Default: 0 on line 9, lines 4 to 8 blank (the federal engine leaves line 9
  blank).
- A married/RDP filing separately filer who lived with the spouse puts the
  rental in Part V, not Part IV: "must use Part V instead of Part IV"
  (`irs-8582-inst-2025::sec::part-iv-2::b01`). The California text says only
  "You must enter -0- on line 9". A reading that keeps the rental in Part IV
  moves the loss from line 2b to line 1b; lines 9 to 11 stay the same.
- Changes dollars: no.

## 4. "Form or schedule to be reported on" (Parts VI to VIII)

- Source: "enter the form or schedule and line number on which the loss will
  be reported" (`irs-8582-inst-2025::sec::part-vi::b01`). The California
  amount goes to the California Adjustment Worksheet, Schedule E Activities
  (`ca-3801-inst-2025::sec::step-4-figuring-the-california-adjustment::b01`).
- Default: "Sch E, line 22" for a rental, "Sch E, line 21" for a royalty, as
  federal Form 8582 writes them.
- Changes dollars: no.

## 5. The California carryover when none is stated

- Source: Parts IV and V column (c) is the California prior year unallowed
  loss; the instructions give no default.
- Default: the federal carryover (the rental fact's) when the property is
  passive federally and has no federal carryover. Otherwise the form asks
  (`ca_passive.prior_year_unallowed_loss.<id>`), as Schedule D (540) does for
  its carryover.
- Changes dollars: yes, if a California-only carryover exists and is not
  stated.

## 6. Column (e) of the California Passive Activity Worksheet

- Source: "Enter any adjustment resulting from differences in federal and
  California law"; Step 1 names FTB 3885A (`ca-3801-inst-2025::sec::step-1::b01`).
- Default: the FTB 3885A difference only (lines 8b + 14b − 8a − 14a). A
  property with depreciation stated as one amount (no depreciation answers)
  has no difference, as Schedule CA line 5 already assumes.
- Changes dollars: yes, when another difference exists.

## 7. Line 6 and RDPs

- Source: "Enter your modified federal adjusted gross income from federal
  Form 8582, line 6. For RDPs, enter ... your refigured federal Form 8582, line
  6" (`ca-3801-inst-2025::sec::part-ii::b02`).
- Default: line 6 is figured by the federal rule (federal/8582/magi.ts) even
  when Form 8582 does not file. The engine has no RDP return that differs from
  the federal one. The military pay subtraction is for servicemembers
  domiciled outside California: a nonresident return, a gap here.
- Changes dollars: no for the returns the engine models.

## 8. Column (c) of the Schedule E adjustment worksheet

- Source: "the amount of any overall gain from Part IV and Part V and allowed
  losses from Part VIII and Part IX" (`::step-4-figuring-the-california-adjustment::b02`).
- Default: income (column (a)) less the allowed part of the losses (columns
  (b) and (c)), across both parts when the carryover is in Part V. A
  nonpassive property keeps its California net.
- Changes dollars: no (it is the reading that makes the total equal line 10
  less line 11).

## 9. Column (d) for a royalty

- Source: "Schedule E income, line 21; Schedule E loss, line 22"
  (`::step-4-figuring-the-california-adjustment::b03`). A royalty has no line 22.
- Default: a passive royalty's loss is the part federal Form 8582 allows; any
  other royalty's line 21.
- Changes dollars: no (Schedule E line 26 counts the same amounts).

## 10. Lines 4 to 11 when line 3 is income or zero

- Source: the form's line 3: "If the result is net income or zero, see the
  instructions for line 3. If line 3 and line 1d are losses, go to line 4.
  Otherwise, enter -0- on line 9 and go to line 10." The line 3 instruction:
  "If line 3 shows income, all of your losses are allowed, including any prior
  year unallowed losses entered on line 1c or line 2c. Transfer the income and
  losses to the form or schedule on which you normally report them"
  (`ca-3801-inst-2025::sec::part-i::b01`). Neither text says to fill lines 9
  to 11 then.
- Default: the form stops after line 3; lines 4 to 11 and Part VII are blank.
  The blind fill made the same choice.
- The other reading: "Otherwise" also covers line 3 income, so line 9 = 0,
  line 10 = lines 1a + 2a and line 11 = line 10. That prints an "allowed
  loss" on line 11 smaller than the losses the line 3 rule allows.
- Changes dollars: yes on the printed lines 9 to 11; no on Schedule CA (every
  loss is allowed under both readings).

## Second opinions

- PolicyEngine-US 2.153.8 (commit b3edc04, 2026-11-23), read 2026-11-24. It
  has no passive activity loss model, federal or California: no IRC 469
  variable, no $25,000 special allowance or $150,000 phase-out parameter.
  Rental losses reach AGI limited only by the IRC 461(l) excess business loss
  rule (`limited_business_loss`). Its California code has no rental,
  depreciation or passive-loss adjustment. Nothing to compare.
- IRS Direct File: no checkout in the repo (issue #140 is undecided), and it
  covers no rental or passive activity. Not compared.
- The blind fill (14 cases) matched the engine on every dollar amount. The
  only differences were line 10 blank (engine) against 0 (blind) in 9 cases
  with no income on lines 1a or 2a.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Part I lines 1a to 3 | published example with numbers (Pub. 925) |
| Part II lines 4 to 9 | published example with numbers (Pub. 925); MFS line 8 own reading (item 2) |
| Part III lines 10, 11 | stated rule |
| Parts IV and V | stated rule (federal Part IV/V instructions) |
| Parts VI to VIII | published example with numbers (Pub. 925, Terry); column text own reading (item 4) |
| Part IX | stated rule: blank, no activity reports on two forms |
| Passive Activity Worksheet | stated rule; column (e) own reading (item 6) |
| Schedule E adjustment worksheet | stated rule; columns (c), (d) own reading (items 8, 9) |
| Schedule C and F worksheets | stated rule: blank; a passive business or a farm is a gap |
| Whole form, passive K-1, 540NR, passive business, farm | unsupported |
| Schedule CA line 5 columns B and C | stated rule; who files own reading (item 1) |
