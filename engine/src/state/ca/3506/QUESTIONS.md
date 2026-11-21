# FTB 3506 (2025): open questions

The form has no answer key. Each item is a place where the form and its
instructions do not settle a rule. Each gives the source text, the default
the engine applies, and whether the default can change a dollar amount.

## 1. Where the care was given (line 1f)

- Source: "Enter the complete physical address where the care was provided."
  (`ca-3506-inst-2025::sec::line-1f::b01`)
- The provider fact has no place of care unless one is stated.
- Default: a stated place first. Else a household employee works in the
  taxpayer's home, and any other provider gives care at its own address.
  Only care in California counts.
- Changes dollars: yes. The place decides whether the care counts.

## 2. Column (e) and dependent care benefits

- Source: "Enter the qualified expenses you incurred and paid in 2025 for the
  qualifying person(s)." (`ca-3506-inst-2025::sec::column-e::b01`). The federal
  form says to leave out the benefits (`irs-2441-inst-2025::sec::line-2::b03`).
  The California text does not.
- Default: the person fact's amount, which is net of all benefits, as on Form
  2441 column (d). With taxable benefits (line 27 above 0), line 31 is unsupported.
- Changes dollars: no while line 27 is 0. Line 33 is capped by Form 2441 line 31.

## 3. Custody of 50% or less (column (d))

- Source: "If you have 50% or less physical custody of your child, you do not
  qualify for the credit." (`ca-3506-inst-2025::sec::column-d::b01`)
- Default: that child is left off line 2. Other children stay.
- Changes dollars: yes. It can change the $3,000 or $6,000 limit.

## 4. Date of birth or the disabled box (column (c))

- Source: "Enter the qualifying person's date of birth ... or if the
  qualifying person is disabled ... check the 'Yes' box."
  (`ca-3506-inst-2025::sec::column-c::b01`)
- Default: the date of birth always prints. The box is checked for a person
  unable to care for themselves.
- Changes dollars: no.

## 5. Line 12 after a stop

- Source: line 9 chart, "Over $100,000 — Stop. You do not qualify for this
  credit." (`ca-3506-inst-2025::sec::line-9::b02`). Line 30: "If zero or less,
  stop." (the form)
- Default: the lines after the stop stay blank and line 12 is 0. After the
  line 30 stop, line 12 is line 11 (the prior-year credit), per the exception.
- Changes dollars: no. The credit is 0 either way.

## 6. Which AGI the worksheet's line 14 reads

- Source: "Enter the decimal amount from the chart in the line 9 instructions
  of the 2024 form FTB 3506 that corresponds to your 2024 California AGI."
  (`ca-3506-inst-2025::sec::line-14-2::b01`). The 2025 line 9 chart reads
  federal AGI (its column header, `ca-3506-inst-2025::sec::line-9::b02`).
- Default: line 14 reads the chart with 2024 California AGI, as the text says.
- Changes dollars: yes, when the two AGIs fall in different bands.

## 7. Worksheet line 8 on a return that is not joint

- Source: "If not filing a joint tax return, enter your earned income."
  (the form, worksheet line 8)
- Read literally, line 8 skips the expense limits of lines 3 and 6.
- Default: line 7 is your own earned income, and line 8 is the smallest of
  lines 3, 6 and 7, as on the federal Worksheet A
  (`irs-2441-inst-2025::sec::worksheet-for-2024-expenses-paid-in-2025::b02`).
- Changes dollars: yes.

## 8. The 2024 charts (worksheet lines 12 and 14)

- Source: "the chart in the line 7 [line 9] instructions of the 2024 form FTB
  3506" (`ca-3506-inst-2025::sec::line-12::b01`, `::line-14-2::b01`). The 2024
  instructions are not in the corpus.
- Default: the 2025 charts. The federal 2024 table in the 2025 Form 2441
  instructions (`irs-2441-inst-2025::sec::worksheet-for-2024-expenses-paid-in-2025::b03`)
  is the same as the 2025 table.
- Changes dollars: only if a 2024 chart differs.

## 9. Earned income on lines 4, 5, 19 and 20

- Source: the resident list of earned income (`ca-3506-inst-2025::sec::line-4::b01`)
  names the same items as Form 2441.
- Default: the Form 2441 figures (federal W-2 box 1 and self-employment).
  California wages that differ from federal wages are not used.
- Changes dollars: yes, only where California wages differ.

## 10. Part I: which amounts are listed

- Source: "money you received in 2025 that is not included in your earned
  income ... but that was used to support your household"
  (`ca-3506-inst-2025::sec::part-i-unearned-income-and-other-funds-received-in-2025::b01`)
- Default: the return's interest (1040 lines 2a and 2b), dividends (3b),
  taxable pensions and IRAs (4b and 5b), social security (6a) and
  unemployment (Schedule 1 line 7), then the stated sources. The engine does
  not judge "used to support your household".
- Changes dollars: no.

## 11. Line 16 "Combine"

- Source: "Combine line 13 through line 15." (the form)
- Default: line 13 plus line 14 less line 15, as federal line 15 does.
- Changes dollars: yes if the sign were the other way.

## 12. Persons when only some care was in California

- Source: "Complete column (a) through column (e) for each qualifying person
  for whom care was provided in California." (`ca-3506-inst-2025::sec::line-2::b01`)
- Default: with any care in California, every Form 2441 qualifying person is
  listed, with column (e) its California expenses (0 is allowed, as in the
  Pub. 503 Paris example, `irs-pub-503-2025::sec::randall-s-reduced-dollar-limit::b03`).
- Changes dollars: yes. The count sets the $3,000 or $6,000 limit.

## 13. Military pay

- Source: "For military personnel domiciled outside of California, use your
  federal AGI less your military pay" (`ca-3506-inst-2025::sec::line-7::b01`, `::line-9::b01`).
- Default: a Form 540 filer is domiciled in California. Not modeled.
- Changes dollars: yes, for a servicemember domiciled elsewhere.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I sources and amounts | own reading (item 10) |
| Part II line 1a–1g | stated rule; 1f default is own reading (item 1) |
| Part III line 2 columns (a)–(e) | stated rule; (c), (d), (e) own reading (items 2–4, 12) |
| Lines 3, 6, 8, 10, 12 | stated rule |
| Lines 7 and 9 (charts) | stated rule (charts in the instructions) |
| Lines 4, 5 | stated rule (Form 2441); unsupported on Form 540NR or with deemed income |
| Line 11 and the worksheet | stated rule; own reading (items 6–8) |
| Lines 13–30, 33 | published examples with numbers (FTB line 17, Pub. 503 George, Randall, Paris) |
| Lines 19, 20, 22 | stated rule (Form 2441); unsupported for MFS without Section E, deemed income |
| Line 31 | stated rule; unsupported with taxable benefits |
| Line 32 | stated rule (reads Form 2441 line 31) |
