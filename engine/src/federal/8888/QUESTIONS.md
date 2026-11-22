# Form 8888: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides. No question changes the tax or the refund. Questions 1 and 2 change how the refund is split among the accounts.

## 1. Stated amounts that do not add up to the refund

- Source: "The total on line 5 must equal the total amount of the refund shown on your tax return. It must also equal the total of the amounts on lines 1a, 2a, and 3a." (irs-8888-form-2025::sec::line-5::b01)
- Source: "If you made an error on your return and the amount of your refund is increased, the additional amount will be deposited to the last account listed." "... the decrease will be taken first from any deposit to an account on line 3, next from the deposit to the account on line 2, and finally from the deposit to the account on line 1." (irs-8888-form-2025::sec::math-errors::b01)
- The instructions do not say what a preparer enters when the taxpayer states amounts before the refund is known.
- Default: the engine uses the IRS order for a math error. More refund than stated: the account with no stated amount takes it; with none, the last account. Less refund than stated: line 3 gives first, then line 2, then line 1. Line 5 always equals Form 1040 line 35a.
- Own reading: an account fact may leave its amount out, and that account takes the rest. Only one account may do so; a second one waits for an amount.
- Changes dollars: yes, the split among accounts (lines 1a–3a). Not the refund, not the tax.

## 2. An account the split leaves with $0

- Source: "Each deposit must be at least $1." (irs-8888-form-2025::sec::lines-1a-2a-and-3a::b01)
- Default: an account with less than $1 after the split gets no line. The accounts after it move up, so lines 1 and 2 are filled before line 3. The form does not say whether a gap (lines 1 and 3, no line 2) is allowed.
- Changes dollars: no (the same amounts, on different lines).

## 3. Only one account gets money

- Source: "If you want your refund deposited to only one account, don't complete this form. Instead, request direct deposit on your tax return." (irs-8888-form-2025::sec::general-instructions::b01)
- Default: when the split leaves only one account with money, the form's lines are unsupported. The deposit belongs on Form 1040 lines 35b–35d, which the engine does not fill yet.
- Changes dollars: no (unsupported, not a guess).

## 4. No refund, but two accounts stated

- Source: line 5 must equal the refund (line-5::b01). The form files only to split a refund (general-instructions::b01).
- Default: two account facts file the form, because a resolver cannot read Form 1040 line 35a. With no refund (tax due, or the decision `decisions.refund.refund_full_overpayment_federal` not true), the form files with only its header; every line is blank.
- Changes dollars: no.

## 5. Injured spouse (Form 8379)

- Source: "You can't have your refund deposited into more than one account if you file Form 8379, Injured Spouse Allocation." (irs-8888-form-2025::sec::general-instructions::b01)
- Default: the engine has no Form 8379 and no fact for it. The form does not check this rule. Cade must not record two accounts for a filer who files Form 8379.
- Changes dollars: no.

## 6. Account number characters

- Source: "The account number can be up to 17 characters (both numbers and letters). Include hyphens but omit spaces and special symbols." (irs-8888-form-2025::sec::lines-1d-2d-and-3d::b01)
- Default: the engine keeps letters, digits and hyphens, and leaves out everything else. A number with nothing left, or more than 17 characters, waits for a new answer. The routing number must be nine digits as stated; the engine does not take spaces out of it.
- Changes dollars: no.

## 7. Calendar year box

- Source: the form's header, "For calendar year 20__". The form is for continuous use (irs-8888-form-2025::sec::omb-no-1545-0074).
- Default: "25", the tax year of the return. The engine has no fiscal-year return.
- Changes dollars: no.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header: name, SSN | stated rule (the return's names) |
| Header: calendar year | own reading (question 7) |
| Lines 1a–3a, amounts | stated rule; published example with numbers for the gap order (math-errors); own reading for the rest account (questions 1, 2) |
| Lines 1b–3b, routing numbers | stated rule; published example (sample check 250250025) |
| Lines 1c–3c, boxes | stated rule |
| Lines 1d–3d, account numbers | stated rule; published example (sample check 20202086) |
| Line 5 | stated rule (line-5::b01) |
| Form 1040 line 35a box | stated rule (irs-1040-inst-2025::sec::starting-in-october-2025-the-irs::b01) |
| One funded account | unsupported (question 3) |
