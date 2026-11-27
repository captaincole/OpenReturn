# Law search eval

Checks that a search of the law library finds the section that holds a rule: the Internal Revenue Code (Title 26), the Treasury regulations (26 CFR Parts 1 and 301), and California's Revenue and Taxation Code (Division 2, Parts 10 and 10.2, and Part 11 Chapter 17).

A case in `cases.json` has a plain-words `question`, 1 to 3 `queries` that an agent writes after it read the IRS instructions (the statute's terms, never a section number), and `expect`: the sections where the rule is. A hit in any of them counts. `expectPath` names the exact subdivision when one holds the rule. `source` says where the case came from: a row of `docs/rule-decisions.md`, a topic of the target user's return, or a "hard direction" case whose question uses words far from the statute's.

Each label was checked against the statute text (the USLM XML of Title 26 from uscode.house.gov): the subdivision in `expectPath` was printed and read, and it states the rule the question asks about. No label is from memory.

**Status:** Not reviewed by a person yet: agents wrote and checked these cases. Use the scores for development only.

The Code cases search the statute only (`source: "statute"`). They run a second time with no source (the statute and the regulations), and the report counts the statute hits that the regulations push out of the top 8.

## Regulation cases

Not reviewed by a person yet: agents wrote and checked these cases. Use the scores for development only.

`regCases.json` has the same shape, for questions that the statute leaves to the regulations: the material participation tests, real estate professionals, grouping, wash sales, like-kind exchanges of several properties, the partial home sale exclusion, the 83(b) election, incentive stock options, the foreign currency spot rate, estimated tax, PFIC elections, specified service businesses, the net investment income tax on rentals and the de minimis safe harbor. `expect` names regulation sections ("1.469-5T"), and `expectPath` a paragraph ("1.469-5T(a)(1)"). Each label was read in the library (`law read`) after a search found it; no section number came from memory. They search with no source (the statute and the regulations), as `searchLaw` does by default.

## California cases

Not reviewed by a person yet: agents wrote and checked these cases. Use the scores for development only.

`caCases.json` has the same shape, for California's personal income tax law: residency, nonresident source income, the part-year and nonresident tax, the credits for tax paid to another state, conformity to the Internal Revenue Code, the standard deduction, the exemption credits, the estimated tax penalty, the mental health services tax, capital gains, the renters' credit, health savings accounts, bonus depreciation, net operating losses, the minimum tax, and the apportionment rules of Part 11 Chapter 17 (business and nonbusiness income, the sales factor, the sourcing of sales of services, the allocation of nonbusiness income, the combined report). `expect` and `expectPath` name the code: "CA 17041", "CA 17041(i)(1)". Each label was read in the library (`law read`) after a search found it. They search California only (`source: "california"`), the only way `searchLaw` returns it.

The contingent payment rules for installment sales are in 26 CFR Part 15a, which the library does not hold, so no case covers them.

## Run

From the repo root, with law.db installed (`npm run corpus -- law sync`) and Ollama running:

```bash
npm run evals:law
```

It runs every case in hybrid, fts and vector modes (no model call) and writes `docs/evals/law.md`. It needs all three documents in law.db.
