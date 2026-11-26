# Form 8859 (2025): open questions

Each item is a place where the form and its instructions do not settle a rule. Each names the source text, the default the engine applies, and whether the default changes a dollar amount. No item has two official texts that conflict, so none is a `DECISION`.

## 1. Who files when the tax leaves no room

- Source: "Use Form 8859 to claim a carryforward" and "You can carry forward any unused credit shown on line 4 until you have used all of it" (`irs-8859-form-2025::sec::omb-no-1545-0074::b01`, `::line-4::b01`).
- The text does not say whether a filer with no tax this year (line 3 is 0) still attaches the form.
- Default: the form files whenever the 2024 carryforward is above 0. Line 4 then shows the whole amount for 2026. Schedule 3 also files, with line 6h at 0 (the resolver cannot see the tax: the same known gap as Schedule 3 lines 6f, 6m and 6j).
- Changes dollars: no.

## 2. "Claiming" the credit for Credit Limit Worksheet B

- Source: Worksheet B applies when "You are claiming ... District of Columbia first-time homebuyer credit, Form 8859", no Form 2555 is filed, and Schedule 8812 line 4 is above 0 (`irs-1040s8-inst-2025::sec::line-13::b01`). Form 8859 then takes Worksheet B line 14 in place of Form 1040 line 19 (`irs-8859-form-2025::sec::line-4::b01`, the footnote).
- Whether the credit is "claimed" depends on line 3, which depends on the worksheet.
- Default: Worksheet B applies whenever Form 8859 files with a qualifying child, as Form 8396 does. When line 3 is 0, Worksheet B line 15 adds 0 for line 6h, so Schedule 8812 line 13 does not change.
- Changes dollars: no.

## 3. A credit on worksheet line 2 the engine cannot figure

- Source: worksheet line 2 lists Schedule 3 lines 6l, 1, 2, 6d, 3, 4, 5b, 6m, 6f, 6g, 6c and Form 1040 line 19 (`tax-liability-limit-worksheet-line-2::b01`).
- Default: when one of them is an engine gap (each form's own gap helper: Forms 8978, 1116, 2441, 8863, 8880, 8936, 8396, 8839), lines 2 to 4 and the worksheet are unsupported with that reason, and so is Schedule 3 line 6h. A blank credit line (a form that waits for an answer) counts as 0 until the answer arrives; the form that waits keeps the return from being ready.
- Changes dollars: no, except while a credit waits.

## 4. Form 2555 with a qualifying child

- Source: with Form 2555, Schedule 8812 skips Worksheet B (`irs-1040s8-inst-2025::sec::line-13::b01`), so Form 8859 takes Form 1040 line 19.
- The engine's Schedule 8812 line 13 subtracts Schedule 3 line 6h whenever line 4 is above 0, Form 2555 or not. Form 1040 line 19 would then wait for this form, and this form for line 19.
- Default: lines 2 to 4 are unsupported in this case (a named gap), and Schedule 8812 line 13 leaves line 6h out.
- Changes dollars: yes, for that rare filer only (the form prints no credit).

## 5. Cents in the carryforward

- Source: line 1 is "the amount from line 4 of your 2024 Form 8859". Line 4 of a filed form is in whole dollars.
- Default: a stated amount with cents rounds to the nearest dollar (`money.ts`).
- Changes dollars: at most $1.

## 6. Credits that worksheet line 2 does not list

- Source: the list on worksheet line 2 (`irs-8859-form-2025::sec::tax-liability-limit-worksheet-line-2::b01`) does not name Schedule 3 line 5a (residential clean energy), 6a (general business credit) or 6b (prior-year minimum tax credit).
- The other forms order those credits after this one. The Form 5695 limit worksheet subtracts "District of Columbia First-Time Homebuyer ... line 6h" (`irs-5695-inst-2025::sec::residential-clean-energy-credit-limit::b02`). Form 3800 line 10b takes Schedule 3 lines 2 to 4, 5a, 5b and 7, and says "Don't include any general business credit claimed on Form 3800, any credit for prior-year minimum tax" (`irs-3800-inst-2025::sec::line-10b::b01`).
- Default: the list is complete; lines 5a, 6a and 6b stay out of worksheet line 2. The blind fill made the same choice (its case 8).
- Changes dollars: yes, if the list were read as open (worksheet line 3 would fall by those credits). The texts agree, so this is not a `DECISION`.

## Second opinions

- Blind fill (2026-11-26): 14 cases, filled by hand from the blank form and instructions. Every line and worksheet line matches the engine, with no blank-against-0 difference.
- PolicyEngine-US 2.154.1 (commit `0fbed6ddb1`, 2026-11-26) does not model Form 8859. Its list of credits after the child tax credit (`parameters/gov/irs/credits/ctc_tax_liability_limit/subsequent_credits.yaml`) names Schedule 3 line 6h as "not modeled". Its Credit Limit Worksheet B test (`ctc_credit_limit_worksheet_b_applies.py`) is a qualifying child and no foreign earned income exclusion, and it drops the "claiming" condition. That matches item 2. It follows section 24(d) where the instructions say "not filing Form 2555"; the engine follows the form and makes that case unsupported (item 4). No constant or formula to compare, so no change.
- IRS Direct File: the repository names no checkout, and Direct File did not support this credit. Not compared.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule (the return's names) |
| Line 1 | stated rule (the 2024 line 4, a stated fact) |
| Worksheet lines 1 to 3, line 2 | stated rule; no published example with numbers |
| Lines 3 and 4 | stated rule; no published example with numbers |
| Worksheet B line 14 in place of line 19 | stated rule (footnote); own reading of "claiming" (item 2) |
| Form 2555 with a qualifying child | unsupported (item 4) |
