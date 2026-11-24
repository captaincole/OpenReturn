# Pass-through K-1s

The engine reads the Schedule K-1 an individual receives from a partnership
(Form 1065), an S corporation (Form 1120-S) or an estate or trust (Form
1041). It never computes the entity's own return. The code is in five
layers, and each layer reads only the one before it.

1. **The document** (`facts/kinds/scheduleK1.ts`). One fact for each K-1:
   the entity (name, EIN, form), the header answers the K-1 prints, and the
   boxes as printed (box, code, amount). A box printed `STMT` has no amount.
   The section 199A statement (S corporation box 17 code V) is part of the
   fact. Nothing is interpreted here.
2. **The holding** (`facts/kinds/k1Holding.ts`). One fact for each entity,
   with the owner's answers that no K-1 prints: whose K-1 it is on a joint
   return, material participation, active participation and the real estate
   professional answer, all of the investment at risk, the Form 7203 answers
   (stock basis at the start, contributions, loans, debt basis), a partner's
   basis at the start, losses carried from earlier years by each limit (basis
   losses by item), and an interest that ended with the gain on it. It shares
   the K-1's id: `k1.holding.<id>` goes with `k1.s_corporation.<id>`. The
   carried basis losses become items marked `fromPriorYear` (`priorYearItemsOf`
   in `items.ts`); a carried passive loss becomes one at the passive stage,
   marked `passiveCarryover` too.
3. **One vocabulary** (`itemTypes.ts`, `boxTable.ts` and the three tables
   `sCorporationBoxes.ts`, `partnershipBoxes.ts`, `trustBoxes.ts`). Each
   table turns a box and code into an item `{ entity, type, amount }`. The
   tables are the only place that knows a box number: box 1 is business
   income on an S corporation's K-1 and interest on a trust's. A box or code
   a table does not list becomes a `not_modeled` item, never nothing.
4. **The loss limits** (`limits.ts`). Four pure stages in the order the law
   sets: basis, at-risk, passive, excess business loss. Each takes the items
   still allowed and returns, for each K-1, the items it allows and the items
   it carries to next year, or why it waits or cannot decide. Portfolio items
   (interest, dividends, capital gains) skip the passive stage. The basis
   stage of an S corporation reads `basis.ts`, which figures every Form 7203
   line; Form 7203's rules read the same computation. A partner's basis stage
   reads `partnerBasis.ts`, the Partner's Basis Worksheet. The passive stage
   (`passive.ts`, `passiveActivity.ts`) puts each passive partnership K-1 on
   Form 8582 Part V with the return's rentals and allows what Part VIII
   allows. The stages read a `LimitContext` besides the items: the filing
   status, the return's other business losses and Form 8582's rows for the
   return's rentals (`limitContextOf` in `receipts.ts`), which a form gets from
   Schedule E's `passThroughLimitContext` slot (`limitContextFrom`). Form 8582
   reads the K-1 rows from Schedule E's `passiveK1Activities` slot
   (`form8582Rows.ts`), the same rows the stage builds.
5. **Routing** (`routing.ts`, `receipts.ts`, and the forms). `ROUTES` lists,
   for each K-1 form, the item types that have a line, and each route names
   its destination (`interest_list`, `schedule_d_line_12`, ...). A form that
   adds K-1 items to its own amounts reads a receipt: `receivedAt(routed,
   route)` gives the items the limits allow, or says a K-1 waits, or gives
   the gap of a K-1 the limits stopped. Part II and Part III of Schedule E
   read their rows from the routed entities directly.

**Routes today.**

| Form | Item | Route | Where |
| --- | --- | --- | --- |
| 1120-S | box 1 ordinary business income or allowed loss, nonpassive | `schedule_e_part_ii` | Schedule E line 28 (i) or (k); a carried loss allowed now on its own "PYA" row (`schedule-e/partII.ts`) |
| 1120-S | box 4 interest, box 5a ordinary dividends, box 5b qualified dividends | `interest_list`, `dividend_list`, `qualified_dividends` | Schedule B payer rows; Form 1040 lines 2b, 3b, 3a |
| 1120-S | box 7, box 8a net short-term and long-term gain or allowed loss | `schedule_d_line_5`, `schedule_d_line_12` | Schedule D lines 5 and 12 |
| 1120-S | box 12 charitable contributions, allowed | `schedule_a_line_11` | Schedule A line 11 for code A (cash, 60%); any other code is unsupported there |
| 1120-S | box 16 code A tax-exempt interest | `form_1040_line_2a` | Form 1040 line 2a |
| 1120-S | box 16 codes B, C, D | `form_7203` | the basis computation only (Form 7203 lines 3k, 8a, 6) |
| 1120-S | box 16 code F foreign taxes | `schedule_3_line_1` | unsupported there: the credit comes from Schedule K-3, which the engine does not read; Form 7203 line 46 still takes it |
| 1120-S | box 17 code V statement | `qbi` | one more business on Form 8995 or 8995-A (`qbi/`), its QBI scaled to the allowed loss |
| 1120-S, 1065 | box 17 code AC, box 20 code AG: gross receipts for section 448(c) | `no_line` | none: it informs Form 8990 only |
| 1065 | box 1, boxes 2 and 3 | `schedule_e_part_ii` | Schedule E line 28: (h) passive income, (g) the passive loss Form 8582 allows, (k) or (i) for a business the partner materially participated in; an entire disposition with an overall loss in (g), its carried passive loss on a "PYA" row |
| 1065 | boxes 4a, 4b, 4c guaranteed payments | `schedule_e_part_ii` | column (k); box 4c only for the part above 4a and 4b. Rentals and guaranteed payments next to box 1 go on separate line 28 rows that follow it, described in column (a) (irs-1040se-inst-2025::sec::line-28::b01) |
| 1065 | box 5, box 6a, box 6b | `interest_list`, `dividend_list`, `qualified_dividends` | Schedule B payer rows; Form 1040 lines 2b, 3b, 3a |
| 1065 | box 8, box 9a; boxes 9b, 9c | `schedule_d_line_5`, `schedule_d_line_12`; `schedule_d_line_18`, `schedule_d_line_19` | Schedule D lines 5 and 12; lines 18 and 19 are unsupported there |
| 1065 | box 13 codes A to G | `schedule_a_line_11` | code A on line 11; the others are unsupported there |
| 1065 | box 18 code A; codes B, C; box 19 | `form_1040_line_2a`; `partner_basis` | Form 1040 line 2a; the Partner's Basis Worksheet only (box 19 codes other than A are unsupported there) |
| 1065 | box 20 code Z statement | `qbi` | one more business on Form 8995 or 8995-A, its QBI scaled to the allowed loss |
| 1065 | box 21 foreign taxes | `schedule_3_line_1` | unsupported there: the credit comes from Schedule K-3 |
| 1041 | box 1 interest | `interest_list` | a Schedule B line 1 payer row (the trust's name); Form 1040 line 2b |
| 1041 | box 2a ordinary dividends | `dividend_list` | a Schedule B line 5 payer row; Form 1040 line 3b |
| 1041 | box 2b qualified dividends | `qualified_dividends` | Form 1040 line 3a, so the qualified dividends worksheet |
| 1041 | box 3, box 4a net short-term and long-term gain | `schedule_d_line_5`, `schedule_d_line_12` | Schedule D lines 5 and 12 |
| 1041 | box 4b, box 4c | `schedule_d_line_18`, `schedule_d_line_19` | unsupported there: the two worksheets are not modeled |
| 1041 | boxes 5 to 8 income | `schedule_e_part_iii` | Schedule E line 33 column (f) for box 5, (d) for boxes 6 to 8 (`schedule-e/partIII.ts`) |
| 1041 | box 14 code I statement | `qbi` | its section 199A dividends on Form 8995 line 6 or 8995-A line 28; QBI from a trust's business is a gap there |
| 1041 | box 14 code B foreign taxes | `schedule_3_line_1` | one Form 1116 source, passive category (`1116/sources.ts`): the election on Schedule 3 line 1, or Form 1116 with the trustee's statement (the K-1 fact's `foreignIncome`) |
| 1041 | box 14 code H | `form_8960_line_7` | unsupported on Form 8960 lines 7 and 13 when not 0 |

A route whose destination the engine does not fill is still a route: the
line there is unsupported and names the entity, so the rest of the return
computes. A trust K-1 whose items all go to Schedule B, Schedule D or Form
1040 does not file Schedule E; it files it only while it is unsupported or
waits on an answer.

**Nothing is dropped.** A K-1 with any item that has no route is
unsupported. Its row's amount columns, the Part II or Part III totals and
Schedule E line 41 show the reason, which names the entity and each item
type. AGI then stays blank, so the return cannot look finished. The items
that do have a route still reach their lines. A test runs every row of the
three tables through the limits and routes, and fails when a row is neither
routed nor reported (`tests/unit/federal/passThrough/boxTables.test.ts`).

## What this first step handles

- One or more S corporation K-1s (four rows) with box 1 income and an owner
  who materially participated: Schedule E Part II, Schedule 1 line 5.
- The box 17 code V statement: QBI, W-2 wages, UBIA and the specified service
  answer go to Form 8995 or 8995-A. Without a statement the K-1 adds nothing
  to the deduction.
- S corporation income is not self-employment income and not earned income
  (irs-1120sk1-inst-2025::sec::general-instructions::b01): Schedule SE and the
  EIC never read it. EIC Worksheet 1 adds only passive K-1 amounts.
- Three bounds count K-1 items before evaluation: the MAGI upper bound
  (`8960/mustFile.ts`), the AGI floor for the EIC (`schedule-eic/possible.ts`),
  and through MAGI the choice of Form 8995 or 8995-A.

## What the second step handles

- A beneficiary's K-1 (Form 1041) with interest, dividends, capital gains,
  boxes 5 to 8 income and section 199A dividends, joined with the return's
  own 1099 amounts (scenario `mat`). Losses and deductions of a trust K-1
  stay unsupported.
- An S corporation shareholder with fewer shares at the end of the year than
  at the start: the sale needs Form 7203, so the K-1 stops at the basis stage.
- Guaranteed payments printed only as the box 4c total count in the income
  upper bound.

## What the third step handles

- An S corporation shareholder's basis limit (Form 7203, `basis.ts`): stock
  basis, then debt basis, in the form's order. Losses and deductions above the
  basis are allowed in proportion, item by item, and the rest carries to next
  year with its character (scenario `elaida`). A loss carried from an earlier
  year is column (b) and, once allowed, a "PYA" row on Schedule E, a "Yes" on
  line 27, and Form 8995 line 3 (scenario `gareth`).
- Form 7203 itself, one copy for each S corporation K-1 that files it, and
  Schedule E line 28 column (e) checked on its row.
- The at-risk stage passes a loss when the holding says all of the investment
  is at risk; the excess business loss stage passes when every business loss
  on the return, added without any income, is at most the threshold ($313,000,
  or $626,000 on a joint return), so no loss can be limited. Form 461 then
  still files when a line's losses are more than $156,500, with its lines
  unsupported (`excessBusinessLoss.ts`, `461/resolveInfo.ts`).
- QBI counts only the allowed loss: the statement's QBI is scaled to the part
  of the business losses the limits allow, and a net QBI loss carries forward
  on Form 8995 line 16.
- Not yet: a distribution above stock basis (a capital gain on Form 8949), a
  loan repayment (Form 7203 Part II Section C), a sale of stock, the section
  1.1367-1(g) election, amounts not at risk (Form 6198), business losses above
  the threshold (Form 461's limit), and a carried loss on Form 8995-A. Each is
  unsupported with a reason.

## What the fourth step handles

- A trust K-1's foreign taxes (box 14 code B) as one more Form 1116 source:
  the election to claim the credit with no Form 1116 when the return's
  foreign taxes are at most $300 ($600 joint), else Form 1116 from the
  trustee's statement of the foreign-source income (scenario `thom`). Without
  the statement Form 1116 waits on the K-1 fact.
- An S corporation's box 16 code F has a route: Schedule 3 line 1 is the gap
  (the credit needs Schedule K-3), and the rest of the K-1 computes.
- Form 8960 files for a K-1's passive activity income too: a trust's boxes 6
  to 8 reach line 4a through Schedule E line 41 and Schedule 1 line 5.
- Form 8960 line 4b takes a materially participating owner's Part II income
  or loss (columns (i) and (k)) back out of line 4a: it is not net investment
  income (`8960/lines.ts nonpassiveK1Adjustments`, QUESTIONS.md item 30).

## What the partnership step handles

- A partnership K-1's items have routes (the table above): business and
  rental income or loss, guaranteed payments, the portfolio boxes, gifts,
  tax-exempt interest, the basis-only items, the section 199A statement and
  foreign taxes.
- A partner's basis (`partnerBasis.ts`): the worksheet's Part I (the basis at
  the start, contributions, the change in the share of liabilities from item
  K1, the income items, cash distributions) and Part II (nondeductible
  expenses, then each loss and deduction in proportion). A loss over the basis
  carries to next year by item, as Form 7203 does; once allowed, a carried
  nonpassive loss is a "PYA" row.
- A passive partnership K-1 on Form 8582 (scenarios `tam`, `cadsuane`): a
  business the partner does not materially participate in, or a rental, is
  one Part V activity with its carried passive loss in column (c). Its passive
  income frees other K-1s' losses and the rentals' losses; each losing K-1 is
  allowed its Part VIII column (c), shared between this year's loss and the
  carried one in proportion; the rest carries. Schedule E line 28 shows the
  income in column (h) and the allowed loss in column (g). The rentals' rows
  are the same with or without a K-1 (`8582/rentalRows.ts`).
- A holding that ended (scenario `bayle`): an entire disposition with an
  overall loss is not on Form 8582, and every loss is allowed in column (g):
  this year's on the K-1's row, the carried one on a "PYA" row, the layout an
  S corporation's carried basis loss uses; line 27 Yes. One with an overall
  gain is a Part V
  row with the gain in column (a). The holding gives the gain; the sale itself
  is a Form 8949 row from a trade fact.
- Readers: Form 8960 keeps passive K-1 income in net investment income and
  takes out only a materially participating partner's box 1 on line 4b; Form
  8995 scales the statement's QBI to the allowed loss; Form 8582 line 6 counts
  Schedule E Part II's nonpassive columns.

## What the next steps add

- **Schedule K-3** for an S corporation's or a partnership's foreign taxes,
  and the 28% rate gain and unrecaptured section 1250 gain worksheets.
- **A passive S corporation K-1**: the same Form 8582 rows as a partnership's;
  `passiveForSCorporation` still reports it unsupported. Until then such a
  K-1, a beneficiary's boxes 6 to 8, or a partnership K-1 the limits stop
  makes Form 8582's lines a gap that names it (`form8582Rows.ts`,
  QUESTIONS.md item 41).
- **The special allowance next to a K-1 loss**: when the return's rental real
  estate with active participation has a loss, Form 8582 line 9 needs modified
  AGI, which the limit stage cannot read; a losing K-1 is unsupported then.
  K-1 rental real estate with active participation (Part IV) waits for it too.
- **The other partnership items**: box 14 (Schedule SE takes Schedule C
  only), box 7 royalties (Schedule E Part I), boxes 10 to 12 (Form 4797 and
  Form 4562), box 15 credits, box 17 (Form 6251), box 20 codes A and B (Form
  4952), a publicly traded partnership, Form 6198, and a partial sale.

`QUESTIONS.md` lists every doubt, with its source and the default chosen.
