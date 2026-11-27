/*
 * Form 8332 rules: each copy prints one child's form (resolveInfo.ts builds the
 * copies, lines.ts holds the rules). The form has no arithmetic: every field
 * is a name, an SSN or the years a part names.
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form8332FilingInfo } from "./filingInfo.js";
import type { Form8332Copy, Form8332Part } from "./lines.js";
import type { Form8332 } from "./types.js";

type Value = string | Unsupported | undefined;
type Binding = (form: unknown, info: Form8332FilingInfo) => Value;

/* This copy's child: the first copy is the first child's. */
const copyOf = (info: Form8332FilingInfo): Form8332Copy | undefined =>
  info.form8332Copies?.[info.form8332CopyIndex ?? 0];

/* A field of this copy; a copy the engine cannot print is a gap on every field. */
function fromCopy(pick: (copy: Form8332Copy) => string | undefined): Binding {
  return (_, info) => {
    const copy = copyOf(info);
    if (copy === undefined) return undefined;
    return copy.gap === undefined ? pick(copy) : unsupported(copy.gap);
  };
}

/* An entry of one part; blank when this copy does not complete the part. */
const partEntry = (
  part: (copy: Form8332Copy) => Form8332Part | undefined,
  pick: (entries: Form8332Part) => string | undefined,
): Binding =>
  fromCopy((copy) => {
    const entries = part(copy);
    return entries === undefined ? undefined : pick(entries);
  });

const partI = (copy: Form8332Copy) => copy.partI;
const partII = (copy: Form8332Copy) => copy.partII;
const partIII = (copy: Form8332Copy) => copy.partIII;

const formatSsn = (value: unknown) => SSN.format(value as Parameters<typeof SSN.format>[0]);

export function register(): void {
  defineForm<Form8332, Form8332FilingInfo>("form-8332", {
    bindings: {
      /*
       * The header names the noncustodial parent: this filer on a release
       * copy, the other parent on a revocation copy
       * (irs-8332-form-2025::sec::custodial-parent-and::b01).
       */
      "0.header.noncustodial_parent_name": fromCopy((copy) => copy.noncustodialParentName),
      "0.header.noncustodial_parent_ssn": fromCopy((copy) => copy.noncustodialParentSsn),

      // Part I: the release for the current year (irs-8332-form-2025::sec::part-i::b01).
      "0.part1.child_name": partEntry(partI, (part) => part.childName),
      "0.part1.tax_year": partEntry(partI, (part) => part.years),
      "0.part1.custodial_parent_ssn": partEntry(partI, (part) => part.custodialParentSsn),

      // Part II: the release for future years, as written (irs-8332-form-2025::sec::part-ii::b01).
      "0.part2.child_name": partEntry(partII, (part) => part.childName),
      "0.part2.future_tax_years": partEntry(partII, (part) => part.years),
      "0.part2.custodial_parent_ssn": partEntry(partII, (part) => part.custodialParentSsn),

      // Part III: the revocation, as written (irs-8332-form-2025::sec::part-iii::b01).
      "0.part3.child_name": partEntry(partIII, (part) => part.childName),
      "0.part3.revoked_tax_years": partEntry(partIII, (part) => part.years),
      "0.part3.custodial_parent_ssn": partEntry(partIII, (part) => part.custodialParentSsn),
    },

    // The SSN widgets (text, maxLength 11) keep the dashes.
    formatters: {
      "0.header.noncustodial_parent_ssn": formatSsn,
      "0.part1.custodial_parent_ssn": formatSsn,
      "0.part2.custodial_parent_ssn": formatSsn,
      "0.part3.custodial_parent_ssn": formatSsn,
    },
  });
}
