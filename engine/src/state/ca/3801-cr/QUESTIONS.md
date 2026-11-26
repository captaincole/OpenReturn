# FTB 3801-CR — open questions

The engine fills FTB 3801-CR for a Form 540 filer from the California passive credit facts (`facts/kinds/caPassiveCredit.ts`). Lines 1a to 16 and Worksheets 1 to 9 are federal Form 8582-CR's rules in California amounts. The 2025 instructions publish no example with numbers. The federal 2005 and 2009 example (Mr. Jones) is a unit test of Part I. The synthetic taxpayers `kiruna` (Part II, Schedule P (540) lines 16 to 18, Form 540 line 45) and `leonin` (lines 2a to 2c, no FTB 3801, Form 540 lines 43 and 44) are the scenarios.

Three rules have conflicting texts. They are decisions A46, A47 and A48 in `docs/rule-decisions.md`, with `DECISION` comments in `lines.ts` and `creditUsed.ts`.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Lines 1a to 5 (worksheet choice) | Stated rule; Part I logic matches the federal published example (prior-year, logic only) |
| Line 6 | Stated rule (the A to E steps); net passive income without FTB 3801 is own reading (item 2) |
| Line 7 | Stated rule |
| Lines 8 to 16 | Stated rule (the same lines as federal Form 8582-CR) |
| Line 10 | Stated rule; RDPs are own reading (item 3) |
| Line 13 | Stated rule |
| Line 17 | Stated rule; line 7 at zero: decision A46; low-income housing: decision A47 |
| Worksheets 5 to 9 (the allowed credit of each code) | Stated rule (the federal worksheets) |
| Lines 18 to 21 (Part IV) | Stated rule; the lower credit is own reading (item 5) |
| Form 540 lines 43 to 45, Schedule P (540) lines 16 to 18 | Stated rule; the order is decision A48 |

## 1. The tax on taxable income (lines 6 and 15)

- Source: "B. Tax on line A ... D. Tax on line C" (`ca-3801cr-inst-2025::sec::line-6::b01`, `::line-15::b01`).
- Default: the Tax Table or Tax Rate Schedule of Form 540 line 31, on Form 540 line 19 with and without the amount. Exemption credits are left out: they are the same in both figures. A child's tax on FTB 3800 is a gap.
- Changes dollars: no, for the returns the engine fills.

## 2. Net passive income when FTB 3801 does not file

- Source: "if you did not complete form FTB 3801 because you had net passive income, you will have to figure the tax on the net passive income" (`ca-3801cr-inst-2025::sec::line-6::b01`).
- Default: the sum of the California net income (FTB 3801 worksheet column (f)) of the passive Schedule E activities. FTB 3801's gaps (a passive K-1, a passive business, an entire disposition) pass through.
- Changes dollars: no; there is no other source of the amount.

## 3. Line 10 for an RDP

- Source: "For RDPs, enter your federal modified adjusted gross income from your refigured federal Form 8582-CR, line 10" (`ca-3801cr-inst-2025::sec::line-10::b01`).
- Default: the engine has no fact that says a spouse is an RDP, so line 10 is federal Form 8582-CR line 10 as built for the return. A military servicemember domiciled outside California files Form 540NR, which is a gap.
- Changes dollars: yes, for an RDP whose refigured amount differs.

## 4. Lines 2 and 3 when the credit has nothing to offset

- Source: decision A47. Lines 2c and 3c count on line 5, and only line 6 allows them.
- Default: the form's lines. The unallowed part carries forward (Worksheet 9 column (b)).
- Changes dollars: yes; see A47.

## 5. Part IV lowers the carried credit

- Source: the California instructions say only that the taxpayer "may elect to increase the basis of the credit property" (`ca-3801cr-inst-2025::sec::dispositions::b01`). Federal Form 8582-CR: "The amount of the unallowed credit that may be applied against tax is reduced by the amount of the basis adjustment" (`irs-8582cr-inst-2025::sec::line-38::b01`), and the California text says "Get federal Form 8582-CR for definitions" (`::b-special-note::b01`).
- Default: the federal rule. Column (b) of that credit is its carryover less line 21.
- Changes dollars: yes, the credit of that activity; there is no conflicting text.

## 6. The business credit limitation and FTB 3870

- Source: business credits "may not reduce the 'net tax' by more than $5,000,000"; column (d) subtracts any credit elected refundable on FTB 3870 (`ca-540-sched-p-inst-2025::sec::part-iii-credits-that-reduce-tax::b01`, `::column-a-through-column-d-instructions::b01`).
- Default: not modeled. The cap binds only above $5,000,000 of credits, and no fact records an FTB 3870 election.
- Changes dollars: no, below $5,000,000.

## 7. The publicly traded partnership steps

- Source: "Do not enter credits from PTPs on the worksheets or on form FTB 3801-CR" (`ca-3801cr-inst-2025::sec::credits-from-publicly-traded-partnerships-ptps::b01`).
- Default: a PTP credit stays off the form, and the Form 540 credit lines are a gap.

## 8. Not covered by a scenario

- Line 13 (FTB 3801 line 9 above 0) needs a passive loss, which leaves line 6 at 0; a unit test covers it.
- Part IV needs the sale of an entire interest on the return; unit tests cover lines 18 to 21.
- A research credit from a rental activity (Worksheet 1) is unusual; `kiruna` has one so that Part II shows.

## Proposals for a discussion

None.
