# Schedule S — open questions

Schedule S has no published example with numbers. The FTB instructions
(`ca-540-sched-s-inst-2025`) give the rules only. Each place below is a rule
that the form and the instructions do not settle. The engine applies the
default named. A person decides whether to keep it.

## 1. Rounding of lines 5 and 10

- Source: "Divide line 3 by line 4. Do not enter more than 1.0000" (the form).
  The instructions say nothing more (`ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01`).
- Default: four places, rounded half up (0.20645 is 0.2065). Line 6 multiplies
  by the rounded ratio.
- Changes a dollar amount: yes, by a few dollars at most, if FTB means to drop
  the fifth place.

## 2. A ratio with no income or no AGI

- Source: the same line text. It does not say what to enter when line 3 is 0
  or less, or when line 4 is 0 or less.
- Default: line 3 at 0 or less gives 0.0000. Line 4 at or under line 3 (a
  zero or negative AGI too) gives 1.0000. Line 10 works the same way.
- Changes a dollar amount: rarely. With California AGI at 0 or less, line 2 is
  0, so the credit is 0 either way.

## 3. The lump-sum distribution on line 4

- Source: "Residents – Form 540, line 17, and any lump-sum distribution from
  Schedule G-1" (`ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01`).
  It does not name a line of Schedule G-1.
- Default: Schedule G-1 line 6 (the capital gain taxed in Part II) plus line 10
  (the taxable amount of Part III). These are the amounts G-1 taxes outside AGI.
- Changes a dollar amount: yes, only for a return with Schedule G-1.

## 4. The PTE elective tax credit on line 2

- Source: "Form 540, line 48 (without other state tax credit and PTE elective
  tax credit)" (`ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01`).
- Default: nothing is added back. FTB 3804-CR has no rules in the engine, so
  no PTE credit is on the return.
- Changes a dollar amount: not today. It will when FTB 3804-CR gets rules.

## 5. New Hampshire, Tennessee and the District of Columbia

- Source: "New Hampshire (NH) (business profits tax)", "Tennessee (TN) (excise
  tax only)", "District of Columbia (DC) (unincorporated business tax and
  income tax, the latter for dual residents only)"
  (`ca-540-sched-s-inst-2025::sec::c-california-residents::b01`).
- Default: the engine allows the three states and trusts the stated tax to be
  the kind the list names. DC cannot tax a nonresident's personal income, so a
  California resident's DC tax is the unincorporated business tax or a dual
  resident's tax.
- Changes a dollar amount: yes, if the taxpayer states a tax of another kind.

## 6. The group nonresident return exception

- Source: residents in a group nonresident return with a listed state, AZ, OR
  or VA "may also claim a credit ... unless any of these states allow a credit
  for taxes paid to California on the group nonresident tax return"
  (`ca-540-sched-s-inst-2025::sec::c-california-residents::b02`).
- Default: a stated group return allows the credit. The engine does not check
  whether the other state allows its own credit on that return.
- Changes a dollar amount: yes, in that rare case.

## 7. Separate California returns, joint other-state return

- Source: "When a joint tax return is filed in the other state and separate
  California tax returns are filed, the credit is allowed in proportion to the
  income reported on each California tax return"
  (`ca-540-sched-s-inst-2025::sec::b-application-of-the-credit::b01`).
- Default: the engine takes the stated tax (line 7) as this return's share. It
  does not prorate.
- Changes a dollar amount: yes, for a married filer who files separately in
  California and jointly in the other state.

## 8. More than three income items

- Source: Part I has three rows. The instructions give no continuation
  statement (`ca-540-sched-s-inst-2025::sec::part-i-double-taxed-income::b01`).
- Default: rows 1 and 2 print the first two items. Row 3 is unsupported.
  Line 1 still adds every item.
- Changes a dollar amount: no.

## 9. Rows and line 1 rounding

- Source: "Combine the amounts in column (b) and column (c)"
  (`ca-540-sched-s-inst-2025::sec::part-i-double-taxed-income::b02`).
- Default: each row prints whole dollars. Line 1 adds the stated amounts with
  their cents and rounds once, as the 1040 instructions say for sums.
- Changes a dollar amount: by $1 at most, only with cents in the answers.

## 10. Schedule S with no stated state

- Source: none. An explicit decision can file Schedule S with no other-state
  fact.
- Default: every line is blank, as Form 3903 does with no move.
- Changes a dollar amount: no.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I rows (a), (b), (c) | stated rule (stated answers) |
| Line 1 (b), (c); lines 3 and 8 | stated rule |
| Line 2 | stated rule; PTE add-back own reading (4) |
| Line 4 | stated rule; Schedule G-1 part own reading (3) |
| Lines 5 and 10 | stated rule; rounding own reading (1, 2) |
| Lines 6 and 11 | stated rule |
| Line 7 (state, amount), line 9 | stated rule (stated answers) |
| Line 12 | stated rule |
| Who files, one copy per state | stated rule; NH, TN, DC, group return own reading (5, 6) |
| Form 540 line 43 (name, code 187, amount) | stated rule |
| Schedule P (540) line 20 (a), (b), (c) | stated rule |
| A nonresident or part-year filer (Form 540NR) | unsupported |
| A fourth Part I item (row 3) | unsupported |

No field group has a published example with numbers.
