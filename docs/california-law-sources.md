# California's tax law: the sources and what Canon holds

This page records where California's income tax rules are written, which of those sources Canon holds, and why the others are not in it. It is the result of a source review on 2026-11-27. Read it before you add a California source.

Each claim has one of three marks:

- **Read**: we read the text itself on the review date.
- **Inferred**: we joined facts that we read. No source states it.
- **Not checked**: general knowledge. Confirm it before you rely on it.

## The layers

| Layer | Who writes it | In Canon | Where |
| --- | --- | --- | --- |
| Statute: Revenue and Taxation Code, Division 2 | The Legislature | Yes | `canon/.data/law/ca.db`, document `ca-rtc-2025` |
| Federal regulations, where California adopts the federal rule | The Treasury | Yes | `canon/.data/law/federal.db`, document `cfr-26-2025` |
| California regulations: Code of Regulations, Title 18, Division 3 | The Franchise Tax Board | No, deferred | Issue #383 |
| Form instructions and publications | The Franchise Tax Board | Yes | `corpus.db` |
| Legal Rulings, Notices, Technical Advice Memoranda | The Franchise Tax Board | No, deferred | Issue #393 |
| Appeal decisions | The Office of Tax Appeals; the Board of Equalization before 2018 | No, deferred | Issue #393 |
| Audit manuals | The Franchise Tax Board | No, deferred | Issue #393 |
| Paid research services (Spidell, CCH, Thomson Reuters) | Private publishers | No | Their text is not ours to use |

The rows from "Legal Rulings" down are **not checked**.

## The federal regulations apply in California

**Read.** Section 17024.5(d) of the code (`ca-rtc-2025::sec::s17024.5::d`):

> "When applying the Internal Revenue Code for purposes of this part, regulations promulgated in final form or issued as temporary regulations by "the secretary" shall be applicable as regulations under this part to the extent that they do not conflict with this part or with regulations issued by the Franchise Tax Board."

Three limits:

- The rule applies only where California adopts the federal section. The code says which sections, one by one.
- California adopts the Internal Revenue Code as of a fixed date (section 17024.5: January 1, 2025 for taxable years from 2025). The library's federal text is newer.
- This subdivision is in the personal income tax part. We did not read its twin in the Corporation Tax Law.

Canon's `searchLaw` description does not state this rule yet.

## California's own regulations are mostly repealed

**Read.** The official site and Cornell's copy both mark most of Title 18, Division 3 as repealed. In the personal income tax chapter, the articles on the standard deduction, personal exemptions, itemized deductions and nonresident deductions are all repealed. A repealed section has only its history notes.

**Inferred.** The repealed subjects are the ones where California follows federal law, so the federal regulations took their place under section 17024.5(d). The live sections are the subjects where California has its own rule.

**Read, as an approximate count.** About 56 sections are live in the chapters an individual needs. A model extracted the list from Cornell's index, so verify each title before use:

- Residency: § 17014, § 17016.
- A nonresident's California income: § 17951-1 to § 17951-6, § 17952, § 17953.
- Credit for tax paid to another state: § 18000-1, § 18001-2.
- Health coverage penalty: seven sections, § 26000.61000 to § 26000.61025.
- Trust residence: § 17742 to § 17744.
- Other: § 17052.6, § 17942, and 30 sections of an aerospace wage credit that no target user needs.

Not counted: the administration chapter (withholding, § 18662) and the allocation of business income between states (§ 25120 to § 25137).

Two live sections were read in full on Cornell: § 17014 (about 1,800 words) and § 17951-4 (about 4,300 words, amended through 2019).

## Where the regulations can be read

| Source | Complete and current | Access |
| --- | --- | --- |
| Official site, `govt.westlaw.com/calregs` (Thomson Reuters, for the Office of Administrative Law) | Yes, updated weekly | One section per page. Opens in a browser. Refuses automated requests. Its terms of use were not read. |
| Cornell Legal Information Institute, `law.cornell.edu/regulations/california/title-18/division-3` | Full text with history notes. Updated quarterly; the page shows no date. | Loads for an automated request. No bulk file. |
| Franchise Tax Board website | Not confirmed | Refuses automated requests. |
| Internet Archive scan | From 2008 | Too old. |

Rights:

- **Read.** The Office of Administrative Law's conditions of use say that information on its site, "unless otherwise indicated, is considered in the public domain".
- **Read.** Cornell says that government texts "lie in the public domain", and claims rights only in its own markup.
- **Read.** No bulk file exists. Public.Resource.Org asked the state for one under the Public Records Act in 2022 and lost in the Court of Appeal. We did not find the Supreme Court's answer.

## Decision, 2026-11-27

California's regulations, rulings, appeal decisions and audit manuals are deferred. The reasons:

- The statute, the federal regulations, the instructions and eight publications are in. They cover how the lines of a return are filled.
- The publications on residency (1031) and nonresidents (1100) already state the board's reading of the live regulations in plain words.
- The gain from about 20 useful regulation sections is small, and the official source cannot be fetched by a program.

When the work starts, the plan we preferred is: a hand-picked list of live sections, plain text from Cornell, each section pinned by sha256 in a sidecar, a person's spot check against the official site, stored in `ca.db` as a second California document. A person decides whether Cornell is acceptable as the source.

The deferred sources matter most for residency and nonresident returns. Start there.
