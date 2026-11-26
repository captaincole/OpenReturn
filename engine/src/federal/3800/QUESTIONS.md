# Form 3800 — doubts and defaults

The engine fills Form 3800 for an individual. The instructions publish no example with numbers, and no prior-year example was found on the web (search of 2026-11-25). The tests are the form's own lines, limit tests, and the synthetic taxpayer `renald`.

Three decisions with conflicting texts are rows A18, A19 and A20 of `docs/rule-decisions.md` (the tentative minimum tax, a recaptured carryover, Part IV column (g)).

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, item A (always "No" for an individual) | Stated rule |
| Item B (transfers) | Stated rule |
| Part I lines 1, 4, 5, 6 | Stated rule |
| Part I lines 2, 3; Part II lines 23, 24, 32, 33 (passive credits) | Unsupported: Form 8582-CR |
| Part II lines 7 to 17 | Stated rule (line 14: decision A18) |
| Part II lines 18 to 26 (empowerment zone) | Stated rule |
| Part II lines 27 to 38 | Stated rule |
| Part III columns (a) to (g), every row and total | Stated rule |
| Part III column (i) | Own reading (item 3) |
| Part III columns (h), (j) | Unsupported with an elective payment election; blank without |
| Part III lines 1c, 4i (research limitation) | Stated rule; the scaling in item 6 is own reading |
| Part III lines 1e, 1k (caps) | Stated rule |
| Part III lines 1s, 1y, 1aa | Stated rule (Forms 8911 and 8936) |
| Part IV columns (a) to (f), (h) | Stated rule |
| Part IV columns (g), (i) | Decision A20 and A19; the order inside one year is own reading (item 2) |
| Part V, Part VI | Stated rule; when a line needs a breakdown is own reading (item 1) |

## 1. When a line gets a Part V or Part VI breakdown

- Source: "If any of the amounts entered in Part III (aside from totals) are aggregate figures from more than one facility or more than one pass-through entity, provide breakdowns" (`irs-3800-inst-2025::sec::part-v-3::b01`); Part VI the same for "more than 1 year or more than one pass-through entity" (`part-vi-2::b01`).
- Default: any line with two or more sources (facts or K-1 items) gets one row per source, and column (a) of Part III or IV counts them. A line with one source has no breakdown and column (a) is blank.
- Changes dollars: no.

## 2. The order of use inside one year

- Source: the list "Order in which credits are used" (`credit-ordering-rule::b02` to `::b04`).
- Default: each Part III or IV line takes the place of its credit in the list. A carryforward-only credit (biofuel, Indian employment, renewal community, nonconventional source fuel, and so on) takes its Part IV line. Lines the list does not name (1zz, 2j, 2n, 2t, 2u, 2v, 2zz, 4y, 4z) come after it, in form order. Two sources of one line keep the order they were recorded.
- Changes dollars: no for the total allowed. It moves the carryforward to 2026 from one row to another.

## 3. Part III column (i) only with an election

- Source: "Complete columns (b), (c), (f), (h), (i), and (j) of Part III (as applicable) only if you are making the EPE under section 6417, the transfer election under section 6418 (as transferor), or receive a credit from a transfer (as transferee)" (`part-iii-4::b01`). Part V columns (i)(1) and (k) have no such rule (`part-v-3::b03`, `::b04`).
- Default: Part III column (i) is blank unless a credit on the return is transferred or has an elective payment; then every row and total with a credit fills it. Part V columns (i)(1) and (k) always fill.
- Changes dollars: no.

## 4. A K-1 credit is passive when the owner did not materially participate

- Source: "If you have credits that are passive activity credits to you, you must complete Form 8582-CR" (`irs-1065k1-inst-2025::sec::box-15-credits::b01`).
- Default: a credit from a rental (box 15 codes C to G) is passive. Any other credit is passive when the K-1 holding says the owner did not materially participate; with no answer, Form 3800 waits on the holding fact. A real estate professional's rental credit is not modeled.
- Changes dollars: yes, for a passive credit (it is a gap, Form 8582-CR).

## 5. The credits of Forms 8911 and 8936 are not passive

- Source: Form 8911 line 3 and Form 8936 lines 8 and 21 say only "report this amount on Form 3800, Part III".
- Default: column (e). The facts of a refueling property or a vehicle do not say whether the business is passive.
- Changes dollars: only for a passive business.

## 6. Research credit fractions that add to more than 1

- Source: "The sum of the fractions used for determining the limits can't exceed 1" (`lines-1c-and-4i::b02`).
- Default: each fraction is scaled down in proportion so they add to 1. A source with a loss has a fraction of 0.
- Changes dollars: yes, only when the attributable incomes add to more than the taxable income.

## 7. Blank or 0 on lines with nothing in them

- Source: line 3 and line 24 and line 33: "If no credits are allowed, enter -0-" (`line-3::b01`, `line-24::b02`, `line-33::b01`).
- Default: with no passive credit, lines 2, 3, 23, 24, 32 and 33 are blank. Line 10c is blank when lines 10a and 10b are. Line 8 prints 0 when Form 6251 files with no tax. Line 26 prints 0 when Section B is skipped, as the note says.
- Changes dollars: no.

## 8. A credit stated for a line the engine figures

- Source: Form 8911 line 3 and Form 8936 lines 8 and 21 go to lines 1s, 1y and 1aa.
- Default: a stated credit fact on those lines is a gap: the refueling property or vehicle fact holds it. A K-1 code AO credit is inside Form 8911 line 2 when Form 8911 files. A K-1 code AY or AZ credit must match the amount Form 8936 states for its line 7 or 20.
- Changes dollars: no.

## 9. Form 6251 for line 14

- Source: Form 6251 files when "you claim any general business credit, and either line 6 (in Part I) of Form 3800 or line 25 of Form 3800 is more than zero" (`irs-6251-inst-2025::sec::who-must-file::b01`).
- Default: the resolver files Form 6251 when a credit outside lines 4a to 4z is on the return. With only specified credits it does not file; line 14 is then a gap, line 17 is 0 and line 38 still computes.
- Changes dollars: no.

## 10. The copy count

- Default: Parts V and VI print 15 and 35 rows; the count comes from the resolver's sources, before Forms 8911 and 8936 stand in for K-1 credits. That can only print one extra empty copy.
- Changes dollars: no.

## 11. Line 13 for an individual: line 12, not line 11

- Source: the face, "Enter 25% (0.25) of the excess, if any, of line 12 (line 11 for corporations) over $25,000" (`irs-3800-face-2025::sec::face-part-ii::b02`). The instructions describe only corporations: "25% of the excess (if any) of net income tax over $25,000" (`irs-3800-inst-2025::sec::line-13::b01`).
- Default: line 12 for an individual, as the face says. The blind fill read it the same way.
- Changes dollars: yes, only with an alternative minimum tax. Regular tax $90,000 and AMT $5,000 give line 13 $16,250 from line 12, and $17,500 from line 11.

## 12. A credit above the line 1e or 1k cap

- Source: "don't enter more than $5,000" on line 1e (`line-1e::b01`) and "don't enter more than $150,000" on line 1k (`line-1k::b01`); "the limited amount allowed is allocated pro rata and anything above the limitation is lost" (`limitation-on-certain-credits-reported-in-part-iii::b01`).
- Default: the cap applies before column (e), so columns (e) and (g) never hold more than the cap. Each source gets its share to the nearest dollar, and the shares add to the cap (two K-1 credits of $4,000 and $3,500: $2,667 and $2,333). The excess is lost: it is not a carryforward. The blind fill agrees.
- Changes dollars: yes, if a reader carried the excess forward. The text says it is lost.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit `363e9fc5`, 2026-11-25). It does not model Form 3800. `general_business_credit` is a bare input with no formula (`variables/gov/irs/credits/general_business/general_business_credit.py`), and it has none of the source credits (Forms 8826, 8820, 5884, 6765, 8882, 8844), no line 13 or line 14 limit, and no carryforward. Its only limit is the cap of all nonrefundable credits at the income tax before credits. There is nothing to compare for the constants ($25,000, 25%, 75%, $5,000, $150,000) or the ordering.
- **Other projects.** The repository names no other reference implementation that models Form 3800. IRS Direct File (issue #140) is not checked out here, and it does not support business credits.
- **Blind fill** (2026-11-25, 14 cases): every compared line matches the engine, including blank against 0. Its dollar doubts are decisions A19 and A20 and items 11 and 12.

## Proposals for a discussion

- **Form 8582-CR.** A passive credit (current or carried) makes column (g), Part I line 3, Part II lines 24 and 33, and so line 38, a gap. Form 8582-CR needs its own rules and the passive income of each activity (Form 8582 and Schedule E have most of it).
- **The elective payment election.** Columns (h) and (j) and Part V columns (h)(1), (i)(2) and (j) are gaps with an election. The net elective payment is a payment on Schedule 3 line 13c, and Schedule 3 lines 13a to 15 have no rules yet. The proposal: bind line 13c and 14 together, then the election.
- **A research credit carryover.** It shares the limitation of lines 1c and 4i with the credit of the year, and Part I line 4 then takes only its allowable part. That needs the limitation for each source across years, and a fact that links a carryover to its source. It is a gap now.
- **A beneficiary's credits (Schedule K-1 (Form 1041) box 13).** They have no route: the passive rules for a beneficiary are not issued, as for the losses (`passThrough/passive.ts`).
- **Transfers to an individual.** A purchased credit is a passive activity credit for most individuals (`transfer-of-eligible-credits-under-section-6418::b03`), so it needs Form 8582-CR first.
