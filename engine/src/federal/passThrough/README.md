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
   return, material participation, basis at the start of the year, losses
   carried from earlier years by each limit, and an interest that ended. It
   shares the K-1's id: `k1.holding.<id>` goes with `k1.s_corporation.<id>`.
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
   (interest, dividends, capital gains) skip the passive stage.
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
| 1120-S | box 1 ordinary business income, nonpassive | `schedule_e_part_ii` | Schedule E line 28 (i) or (k) (`schedule-e/partII.ts`) |
| 1120-S | box 17 code V statement | `qbi` | one more business on Form 8995 or 8995-A (`qbi/`) |
| 1120-S, 1065 | box 17 code AC, box 20 code AG: gross receipts for section 448(c) | `no_line` | none: it informs Form 8990 only |
| 1041 | box 1 interest | `interest_list` | a Schedule B line 1 payer row (the trust's name); Form 1040 line 2b |
| 1041 | box 2a ordinary dividends | `dividend_list` | a Schedule B line 5 payer row; Form 1040 line 3b |
| 1041 | box 2b qualified dividends | `qualified_dividends` | Form 1040 line 3a, so the qualified dividends worksheet |
| 1041 | box 3, box 4a net short-term and long-term gain | `schedule_d_line_5`, `schedule_d_line_12` | Schedule D lines 5 and 12 |
| 1041 | box 4b, box 4c | `schedule_d_line_18`, `schedule_d_line_19` | unsupported there: the two worksheets are not modeled |
| 1041 | boxes 5 to 8 income | `schedule_e_part_iii` | Schedule E line 33 column (f) for box 5, (d) for boxes 6 to 8 (`schedule-e/partIII.ts`) |
| 1041 | box 14 code I statement | `qbi` | its section 199A dividends on Form 8995 line 6 or 8995-A line 28; QBI from a trust's business is a gap there |
| 1041 | box 14 code B foreign taxes | `schedule_3_line_1` | unsupported there: Form 1116 is not modeled |
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

## What the next steps add

- **The foreign tax credit** (Form 1116), for a trust's box 14 code B, and
  the 28% rate gain and unrecaptured section 1250 gain worksheets.
- **The S corporation basis limit** (Form 7203): the basis stage takes the
  holding's basis, limits losses and deductions, and carries the rest.
- **A passive partnership K-1** (Form 8582): the passive stage. Form 8582
  builds its activities from Schedule E Part I columns only
  (`8582/activities.ts`: `PassiveActivity.column` is a `PropertyColumn`); it
  needs a K-1 activity there, and `LimitContext` needs Form 8582's allowed
  losses. A holding that ended this year releases its passive losses.

`QUESTIONS.md` lists every doubt, with its source and the default chosen.
