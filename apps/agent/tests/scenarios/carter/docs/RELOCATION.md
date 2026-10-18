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

## Answers the package does not give

The package has no California questions. These answers were added so
Form 540 can compute:

- Full-year California resident.
- Full-year health coverage (Medicare): yes.
- California use tax owed: none.
- Mailing address is the home address.

The package names the 1099-DIV only by its amount. The payer name
("Example REIT Fund") is invented. The package has no SSA-1099; the
cover page gives the net benefits ($1,000).

## Not modeled

- Form 1040 line 4c, box 2 ("QCD"): the IRS draft checks it for the
  code Q (qualified Roth IRA) distribution. Summa does not model
  qualified charitable distributions. The taxable amount (line 4b) is
  0 either way, because box 2a of that 1099-R is 0.
