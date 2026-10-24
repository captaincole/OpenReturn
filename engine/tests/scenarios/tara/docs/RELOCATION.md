# Tara Black — IRS ATS scenario 1, moved to California

Source: IRS Modernized e-File Assurance Testing System (ATS), tax year
2025, Form 1040 test scenario 1 (`irs-ats-2025-scenario-1.pdf`, a public
IRS test package). Download page:
https://www.irs.gov/e-file-providers/tax-year-2025-form-1040-series-and-extensions-modernized-e-file-mef-assurance-testing-system-ats-information

The IRS package is a test of e-file schema, not an answer key. Its
draft forms fill the inputs and leave the computed lines blank.

## What changed

Every dollar amount is unchanged, so the federal return computes the
same as the IRS input. Only the location moved, so the scenario also
covers Form 540.

| Item | IRS package | This scenario |
| --- | --- | --- |
| Home address | 17 Lexington Drive, Cincinnati, OH 45223 | 17 Lexington Drive, San Jose, CA 95125 |
| Employee address on both W-2s | Cincinnati, OH 45223 | San Jose, CA 95125 |
| W-2 box 15 (state) on both W-2s | GA | CA |
| Form 5695 lines 17d and 21c (home address) | Cincinnati, OH | San Jose, CA |
| Employer addresses and state ID numbers on the W-2s | Atlanta, GA and Cincinnati, OH | unchanged |

The W-2 state amounts (box 16 wages, box 17 tax: $320 and $416) are
unchanged. They are now California withholding.

## Answers the package does not give

- Date of birth: 08/14/1985 (invented). The draft 1040 leaves line 12d
  unchecked, so Tara is under 65.
- Full-year California resident, covered by health insurance all year,
  no use tax owed, mailing address is the home address.
- California SDI: a real California W-2 shows SDI in box 14. It is left
  out, so the W-2s keep the IRS amounts. It matters only to an itemizer.

## Documents we made

The package gives Schedule H and Form 5695 amounts, but no source
documents for them.

- **Household employee W-2** (`03-…-copy-d.pdf`): the employer's Copy D
  of the official 2025 W-2 that Tara issued. Schedule H gives $3,100 cash
  wages and no withholding. The employee (Rosa Delgado), her SSN, her
  address, and boxes 4 and 6 (the employee share withheld, $192.20 and
  $44.95) are invented. Boxes 4 and 6 do not change Schedule H. The
  employer EIN (00-0000029) is the IRS Schedule H value. Schedule H line
  9 is No: no quarter reached $1,000.
- **Contractor invoices** (`04`–`06`): the vendors, invoice numbers,
  dates, descriptions, labor lines, and the QMIDs A1B7, A1B8, A1B9,
  A1C1, and A1C2 are invented. The other QMIDs and every cost are the
  IRS Form 5695 values. Labor lines are excluded from door and window
  costs, as the Form 5695 instructions require.

## A value in the IRS data that looks wrong

Form 5695 line 19e ("all other exterior doors") is $2,740. That is
exactly line 19a plus line 19d ($1,020 + $1,720), so the IRS data may
count the three listed doors twice. We kept the amount: the door
invoice lists four more doors at $685 each. The $500 door cap on line
19h makes the credit the same either way.

The IRS draft also prints 0 on lines with no property (20b, 23a, 23b,
24b, 29g). OpenReturn leaves them blank.

## Not modeled

- Schedule H Part II (FUTA tax) and Part IV: line 9 is No, so this
  return does not need them.
- Form 5695 Part I (residential clean energy): the IRS draft leaves it
  blank.

## Input documents

File 00 is page 1 of the IRS PDF, unchanged. Files 01–02 are the
official 2025 IRS W-2, Copy B, filled with the values on IRS PDF pages
4–5 and the San Jose address. We made files 03–06.

| File | Source | What it holds |
| --- | --- | --- |
| `00-tara-cover.pdf` | IRS PDF page 1 | Forms list |
| `01-green-ladies-w-2.pdf` | values from IRS PDF page 4 | W-2, $22,970 wages |
| `02-c-and-r-w-2.pdf` | values from IRS PDF page 5 | W-2, $19,500 wages |
| `03-household-employee-w-2-copy-d.pdf` | made by us (Schedule H, page 9) | W-2 Tara issued, $3,100 cash wages |
| `04-bay-area-door-invoice.pdf` | made by us (Form 5695, page 12) | Seven exterior doors |
| `05-sierra-window-invoice.pdf` | made by us (Form 5695, page 12) | One window |
| `06-valley-comfort-hvac-invoice.pdf` | made by us (Form 5695, page 13) | Two central air conditioners |

The other IRS pages are the draft 1040, Schedules 2, 3, and H, and Form
5695. They are not input documents. They stay in
`irs-ats-2025-scenario-1.pdf` only.
