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
5. **Routing** (`routing.ts`, and the forms). `ROUTES` lists the items that
   have a line. Today: an S corporation's box 1, nonpassive, on Schedule E
   line 28 column (i) or (k) (`schedule-e/partII.ts`), and its section 199A
   statement as one more business on Form 8995 or 8995-A (`qbi/`).

**Nothing is dropped.** A K-1 with any item that has no route is
unsupported. Its row's amount columns, the Part II totals and Schedule E
line 41 show the reason, which names the entity and each item type. AGI then
stays blank, so the return cannot look finished. A test runs every row of the
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

## What the next steps add

- **A trust K-1** (Schedule B, Schedule D, Form 1116): routes for interest,
  dividends and capital gains, and Part III of Schedule E.
- **The S corporation basis limit** (Form 7203): the basis stage takes the
  holding's basis, limits losses and deductions, and carries the rest.
- **A passive partnership K-1** (Form 8582): the passive stage. Form 8582
  builds its activities from Schedule E Part I columns only
  (`8582/activities.ts`: `PassiveActivity.column` is a `PropertyColumn`); it
  needs a K-1 activity there, and `LimitContext` needs Form 8582's allowed
  losses. A holding that ended this year releases its passive losses.

`QUESTIONS.md` lists every doubt, with its source and the default chosen.
