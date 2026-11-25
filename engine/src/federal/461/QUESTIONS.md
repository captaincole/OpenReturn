# Form 461: open questions

Each item: the source text, the block id, the default the engine applies, and
whether the default can change a dollar amount. The second pass (2026-11-24)
sorted them by kind: (1) two official texts conflict, (2) a choice of what to
do now, (3) a pattern change. Item numbers stay as they were.

## Kind 1: official texts that conflict (quoted, not decided)

- **Item 3. Pub. 225 counts Form 8949 business losses.** Pub. 225: "Business
  gains and losses reported on Form 4797 and Form 8949 are included in the
  excess business loss calculation"
  (irs-pub-225-2025::sec::excess-business-loss::b01). Form 461 instructions:
  "Losses from sales or exchanges of capital assets are not included in the
  calculation of the total deductions from your trades or businesses. So any
  such amounts included here in line 3 should be added back on line 11"
  (irs-461-inst-2025::sec::line-3::b01; the same in ::who-must-file::b02 and
  ::line-11::b01). Default: the Form 461 instructions; every capital loss goes
  on line 11. Dollars: yes, for a business capital loss.
- **Item 14. A nonbusiness capital loss inside a positive line 3.** Two
  sentences of the same block pull apart. "Losses from sales or exchanges of
  capital assets are not included ... So any such amounts included here in
  line 3 should be added back on line 11", and "Gains ... should not exceed
  the lesser of capital gain net income limited to only gains and losses
  attributable to a trade or business, or capital gain net income"
  (::line-3::b01). Example: line 3 is $40,000, business trades net $60,000,
  investment trades net -$20,000. Default (`lines.ts`, `capitalAdjustment`):
  apply the cap; the business gain counts as $40,000 and lines 10 and 11 stay
  blank. Adding the -$20,000 back on line 11 would count $60,000, above the
  cap. The blind fill chose the same. Dollars: yes, $20,000 on line 14 in the
  example.

## Kind 2: what to do now

- **Item 1. Who must file is a bound.** "File Form 461 if ... (i) your net
  losses from all of your trades or businesses are more than $313,000
  ($626,000 ...), or (ii) you would report a loss of more than $156,500 on any
  one of Form 461, lines 1 through 8"
  (irs-461-inst-2025::sec::who-must-file::b01). The resolver cannot read the
  lines, so it adds the business losses without any income
  (`passThrough/excessBusinessLoss.ts`). Default: the form can file when the
  lines net below both limits. Line 16 is then 0 or more, and Schedule 1 line
  8p stays blank. Dollars: no. Not now: the engine's way to drop a form after
  its lines settle (`filesOnlyWithAmountOn`) tests one line for an amount
  above 0, and this rule tests six lines and a total. Scenario `androl` files
  the form for test (ii) with no excess.
- **Item 2. Which capital gains are business gains.** Gains count only up to
  "the lesser of ... capital gain net income limited to only gains and losses
  attributable to a trade or business, or ... capital gain net income"
  (::line-3::b01, ::who-must-file::b02). The engine cannot tell a business
  capital asset from an investment. Default: the answer
  `business_loss_limit.business_capital_gain`; absent means no capital gain
  comes from a business, so the whole gain goes on line 10. Dollars: yes, when
  a K-1 or a sale holds a business capital gain and no answer says so. Done
  now: the fact's comment gives the question and what the taxpayer looks at
  (`facts/kinds/businessLossLimit.ts`). Not now: no Cade skill names this
  answer or the line 8 answer, so Cade never asks them; adding them to the
  Schedule K-1 skill is a prompt change for eval work.
- **Item 4. Rentals, royalties and K-1 rentals.** A trade or business is
  decided by "facts and circumstances" (::who-must-file::b03); for a
  partnership or an S corporation "at that entity's level". Default: a rental
  property reads its fact's `tradeOrBusiness` (the section 162 answer Form
  8960 reads); a portfolio royalty is not a business, a passive or nonpassive
  royalty is; a K-1 rental item reads
  `business_loss_limit.k1_rental_trade_or_business.<id>`. The lines wait while
  an answer is missing. Dollars: no (the taxpayer answers). Nothing more to do.
- **Item 5. A trust K-1.** The instructions put estates and trusts on line 5
  (::line-5::b01) but do not say whose trade or business a beneficiary's box 6
  is. Default: box 6 (ordinary business income) is business, box 5 ("other
  portfolio and nonbusiness income") is not, boxes 7 and 8 read the rental
  answer. Dollars: yes, for a box 6 amount. Not now: no text decides it; a
  person decides.
- **Item 6. Guaranteed payments.** Not named in the instructions. A partner is
  not an employee, so they are not "services of an employee"
  (::who-must-file::b02). Default: business income. Dollars: yes, when a K-1
  has guaranteed payments. Not now: no text decides it; a person decides.
- **Item 7. Line 8.** "Any other trade or business income, gain, or loss not
  reported on lines 1 through 7 that you reported on your tax return"
  (::line-8::b01). The engine cannot find such an amount by itself. Default:
  the answer `business_loss_limit.other_business_income`; absent means none.
  Dollars: yes, when such an amount exists and no answer says so. As item 2:
  the question is written down; Cade does not ask it yet.
- **Item 8. Lines 4 and 6.** Line 4 is "any other gains or losses reported on
  Schedule 1 (Form 1040), line 4" (::line-4::b01), which is "the amount from
  Form 4797, line 18b" (irs-1040-inst-2025::sec::line-4-2::b01). Line 6 is
  Schedule 1 line 6 (Schedule F). Neither form has rules on `main`. Default:
  blank without those forms; a gap (and lines 9 to 16 too) when either files.
  Dollars: no. Not now: Form 4797 is on another branch. When Form 4797 is on
  `main`, change these, in order:
  - Schedule 1 line 4 copies Form 4797 line 18b and checks the 4797 box (on
    the Form 4797 branch). Schedule 1 line 10 already adds line 4.
  - `figures.ts`: a `line4Source` like `line2Source`, reading
    `schedule-1.0.line.4`; it waits while Form 4797 files and line 4 is blank.
    `partIAmounts` adds it to the sources and passes `line4`.
  - `bindings.ts`: line 4 copies `line4Source`, as line 2 does, in place of
    `gapOrBlank`.
  - `resolveInfo.ts`: drop `FORM_4797_GAP` from `lineGaps` (and the
    `resolve4797Info` import); `formGap` then no longer stops lines 9 to 16.
  - The who-must-file bound (`passThrough/excessBusinessLoss.ts`,
    `OtherBusinessLosses`): add the Form 4797 ordinary loss as a loss on line
    4, so a loss over $156,500 there files the form.
  - `businessLosses.ts`: a Form 4797 loss is one more business with a loss.
  - Part II: a section 1231 gain that Form 4797 sends to Schedule D is a
    business capital gain on line 3 (item 2); it can come from Form 4797 line
    7 rather than the answer.
  - Tests: replace "shows line 4 and the total lines as gaps when Form 4797
    files" (`tests/unit/federal/461/form.test.ts`) with a juilin variant that
    has a Form 4797 loss.
- **Item 9. Rounding of K-1 rental amounts.** Line 10 or 11 adds each K-1's
  nonbusiness items by sign, rounded once per K-1. Schedule E rounds per row
  and column. Default: the K-1 rounding. Dollars: at most $1 per K-1. Nothing
  to do.
- **Item 10. The excess and QBI.** Losses "suspended by ... 461(l)" are not
  QBI this year (irs-8995-inst-2025::sec::determining-your-qualified-business::b02).
  "If a loss or deduction is partially suspended, only the portion of the
  allowed loss or deduction attributable to QBI must be considered ... The
  allowed loss or deduction is then multiplied by this percentage" (::b03).
  Done now (`qbi/excessBusinessLoss.ts`, `461/businessLosses.ts`): with exactly
  one business with a loss on Form 461 lines 2, 5 and 8, and that business a
  QBI business, the excess is its loss: its QBI is its QBI times (loss -
  excess) / loss. Own reading: ::b03 gives the proration and no split among
  businesses; with one losing business there is nothing to split. With two or
  more losing businesses (a stated line 8 loss counts as one), the QBI lines
  stay a gap. With no losing QBI business, the excess holds back no QBI. Not
  modeled: the QBI Loss Tracking Worksheet for the held-back part in later
  years. Tests: a juilin variant (`form.test.ts`) and an elaida variant
  (`sCorporationBasis.test.ts`, -60,000 x 626,400 / 700,000 = -53,691), which
  was a gap before. Dollars: no (a gap where no rule settles it).
- **Item 11. The excess and Form 1116.** Line 16 adds back the disallowed loss
  "to the extent it is attributable to the separate category"
  (irs-1116-inst-2025::sec::line-16::b01). Default: with an excess, Form 1116
  line 16 is a gap. Dollars: no (a gap). Not now: the split by category has
  the problem of item 10 with two or more businesses.
- **Item 12. Farming losses.** The threshold goes "first to the farming
  losses" (::ordering-rules::b01). Schedule F has no rules, so it is a gap
  (item 8). Dollars: no.
- **Item 15. The threshold for married filing separately, head of household
  and a qualifying surviving spouse.** "$313,000 ($626,000 for taxpayers
  filing a joint return)" (::who-must-file::b02). Settled by the text:
  $313,000 for every status but a joint return. The blind fill agreed.
  Dollars: no.

## Kind 3: a pattern change

- **Item 13. California: settled by FTB 3461's rules.** Schedule CA line 8p
  column B now takes out the federal amount and column C adds FTB 3461 line 16
  or 17, so California AGI no longer assumes the federal amount
  (`state/ca/3461/QUESTIONS.md` has that form's own questions). The text below
  is the record of what was wrong before, kept for the pattern it shows.

  Before FTB 3461 had rules: Schedule CA line 8p column A
  copies Schedule 1 line 8p, as line 9a column A does. "Enter the amount from
  form FTB 3461, line 16 or line 17, whichever applies, on line 8p, column C
  ... Enter the amount of the federal excess business loss adjustment
  included on line 8p, column A, on line 8p, column B"
  (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04). FTB 3461 has no
  rules, so columns B and C are gaps. California AGI is right only when FTB
  3461 line 16 equals Form 461 line 16. They differ with a California business
  amount that differs from the federal one, or a California carryover on FTB
  3461 line 14b (ca-3461-inst-2025::sec::line-16::b01). Dollars: yes, when
  FTB 3461 differs from Form 461.

  **Trace (juilin made a full-year California resident, 2026-11-24).** The
  gaps reach Form 540 as zeros:

  | Line | Value | Why |
  | --- | --- | --- |
  | Sch 1 line 8p; Sch CA 8p col A | 289,000 | copies Form 461 line 16 |
  | Sch CA 8p col B, col C | gap | FTB 3461 has no rules |
  | Sch CA 9a col A | 295,000 | holds 8p col A |
  | Sch CA 9a col B | blank | `sumOrBlank` of 8a to 8z col B reads the 8p col B gap as nothing |
  | Sch CA 9a col C | gap | its own gap (`LINE_9A_ADDITIONS_GAP`, childIncome.ts) |
  | Sch CA 10 col B | blank | adds the blank 9a col B |
  | Sch CA 10 col C | blank | `sumOrBlank` reads the 9a col C gap as nothing |
  | Sch CA 27 col A, B, C | 109,337; blank; blank | `line27Total` of blank lines |
  | Form 540 lines 14, 16 | 0; 0 | `adjustmentFromLine27` reads a blank as 0 |
  | Form 540 lines 13, 17 | 109,337; 109,337 | California AGI = federal AGI, add-back included |

  The same holds with no line 8z item. So two totals read a gap as 0:
  Schedule CA line 9a column B (reads line 8p column B) and Schedule CA line
  10 column C (reads line 9a column C). From there, line 27 and Form 540
  lines 14 and 16 read blanks as 0, and Form 540 line 17 prints the federal
  AGI. Not changed here: the fix changes Form 540, and belongs with FTB
  3461's rules and a person.

  **Pattern change.** Before: a Schedule CA total adds its column with
  `sumOrBlank`, so a gap in one cell counts as nothing and the total looks
  complete. After: a total that adds a gap is a gap with the cell's reason,
  so Form 540 line 17 cannot print a California AGI that assumes a federal
  amount.

## Second opinions

- **Blind fill (14 cases, 2025).** No dollar difference with the engine.
  Lines 12 and 13 differ only as blank against 0 (cases 1, 5, 7, 8, 9: the
  engine leaves them blank when lines 10 and 11 are blank; "Subtract line 11
  from line 10", ::line-12::b01, gives no amount to enter).
- **PolicyEngine-US 2.153.8 (commit b3edc04).** `excess_business_loss`,
  `net_business_loss`, `limited_business_loss`, parameter
  `gov.irs.ald.loss.max`. The 2025 threshold agrees ($313,000; $626,000 joint
  only; $313,000 for a qualifying surviving spouse). The formula agrees:
  business losses over business income plus the threshold, wages left out.
  Three scope differences, where the IRS text decides for the engine: it
  counts every rental and estate amount as business (the engine asks, per
  ::who-must-file::b03, and keeps trust box 5 out, item 5); it leaves every
  capital gain out (the engine counts the business part up to the cap,
  ::line-3::b01); it counts Schedule F and Form 4797 amounts, which are gaps
  here (item 8). No engine change.
- **IRS Direct File.** Not compared: no checkout in the repo, and Direct File
  did not support business income, so it has no Form 461 logic.
- **Second pass (2026-11-24).** Rendered juilin and checked Form 461, Schedule
  1, Schedule E, Form 7203, Form 8995-A and Form 1040 line by line against a
  hand computation: no difference on Form 461. Added `androl` for the side
  juilin does not show (files for test (ii), no excess, the joint threshold, a
  capital loss on line 11).

## Rows and copies

Form 461 has one copy per return, joint returns included ("Complete one Form
461 containing all the information for both spouses",
irs-461-inst-2025::sec::specific-instructions::b01). Every line is one amount:
nothing repeats and nothing runs out of space.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 2, 3, 5 (copies of the return's lines) | stated rule |
| Lines 4, 6 | unsupported when Form 4797 or Schedule F files; else blank (stated rule) |
| Line 8 | own reading (an answer the taxpayer gives) |
| Line 9 | published example with numbers (2024 TaxAct output) |
| Line 10 | stated rule (capital gains); own reading (rentals, K-1 items) |
| Line 11 | published example with numbers (capital loss); own reading (rentals, K-1 items) |
| Lines 12 to 16 | published example with numbers |
| Schedule 1 line 8p | published example with numbers |
| QBI forms with one losing business | own reading of a stated proration (item 10) |
| QBI forms with two or more, Form 1116 line 16 | unsupported with an excess (no rule settles the split) |
