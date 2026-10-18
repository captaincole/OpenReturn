# Carter Lewis — IRS ATS scenario 8, moved to California

Source: IRS Modernized e-File Assurance Testing System (ATS), tax year
2025, Form 1040 test scenario 8 (`irs-ats-2025-scenario-8.pdf`, a public
IRS test package). Download page:
https://www.irs.gov/e-file-providers/tax-year-2025-form-1040-series-and-extensions-modernized-e-file-mef-assurance-testing-system-ats-information

The IRS package is a test of e-file schema, not an answer key. Its
draft forms fill the inputs and leave most computed lines blank.

## What changed

Every dollar amount is unchanged, so the federal return computes the
same as the IRS input. Only the state of residence moved, so the
scenario also covers Form 540.

| Item | IRS package | This scenario |
| --- | --- | --- |
| Home address | 807 Sahara Drive, Las Vegas, NV 89101 | 807 Sahara Drive, Sacramento, CA 95814 |
| Recipient address on both 1099-Rs | 807 Sahara Drive, Las Vegas, NV 89117 | 807 Sahara Drive, Sacramento, CA 95814 |
| Payer addresses on the 1099-Rs | Las Vegas, NV | unchanged |
| 1099-R layout | IRS official form | payer-style statement (Copies B, C, 2) |

## Answers the package does not give

The package has no California questions. These answers were added so
Form 540 can compute:

- Full-year California resident.
- Full-year health coverage (Medicare): yes.
- California use tax owed: none.
- Mailing address is the home address.

The package has no 1099-DIV and no SSA-1099. The IRS e-file test needs
only their amounts, which the cover page gives. We made the two
documents from those amounts (see Input documents below). The
1099-DIV payer ("Example REIT Fund"), its address, TIN, and account
number are invented.

## Not modeled

- Form 1040 line 4c, box 2 ("QCD"): the IRS draft checks it for the
  code Q (qualified Roth IRA) distribution. Summa does not model
  qualified charitable distributions. The taxable amount (line 4b) is
  0 either way, because box 2a of that 1099-R is 0.

## Input documents

File 00 is page 1 of the IRS PDF, unchanged. We made files 01–04, with
the California address. The 1099-Rs (01–02)
carry the IRS PDF's box values in a payer-style statement layout; their
plan names, phone numbers, and account numbers are invented.

| File | Source | What it holds |
| --- | --- | --- |
| `00-carter-cover.pdf` | IRS PDF page 1 | Date of birth, Social Security benefits, REIT capital gain distribution, lived apart from spouse |
| `01-liberty-trust-1099-r-code-q.pdf` | values from IRS PDF page 4 | 1099-R, code Q (qualified Roth IRA) |
| `02-jubilee-retirement-1099-r-code-g.pdf` | values from IRS PDF page 5 | 1099-R, code G (direct rollover) |
| `03-example-reit-fund-1099-div.pdf` | made by us | 1099-DIV, box 2a only (IRS fillable Copy B) |
| `04-ssa-1099.pdf` | made by us | SSA-1099, net benefits $1,000 (drawn; SSA has no public blank) |

Pages 2–3 are the IRS draft Form 1040. They are not an input document,
but they give the spouse's name and SSN. They stay in
`irs-ats-2025-scenario-8.pdf` only.
