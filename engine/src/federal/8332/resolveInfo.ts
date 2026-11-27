import {
  SPOUSE_KEYS,
  getDependentFacts,
  getForm8332ReleaseFacts,
  getForm8332RevocationFacts,
  isClaimedDependent,
  livedWithTaxpayerOverHalfYear,
  makeForm8332FactKey,
  type DependentFact,
  type Form8332Parent,
} from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { ssnOf } from "../../values.js";
import type { Form8332FilingInfo } from "./filingInfo.js";
import {
  TAX_YEAR,
  releaseCopy,
  revocationCopy,
  revocationEffectiveFor,
  type Form8332Copy,
  type Form8332Person,
} from "./lines.js";

const SPOUSE_NOT_ON_RETURN =
  "The Form 8332 answer names the spouse as the child's parent, but the spouse is not on this return (not a joint return).";

/* The child's parent on this return: the taxpayer, or the spouse on a joint return. */
function parentOf(inputs: ResolverInputs, parent: Form8332Parent | undefined): Form8332Person {
  const spouse = parent === "spouse";
  const first = text(inputs, spouse ? SPOUSE_KEYS.firstName : "identity.name.first");
  const last = text(inputs, spouse ? SPOUSE_KEYS.lastName : "identity.name.last");
  return {
    name: first && last ? `${first} ${last}` : undefined,
    ssn: ssnOf(text(inputs, spouse ? SPOUSE_KEYS.ssn : "identity.ssn")),
  };
}

const withSpouseGap = (copy: Form8332Copy, parent: Form8332Parent | undefined, joint: boolean) =>
  parent === "spouse" && !joint ? { ...copy, gap: SPOUSE_NOT_ON_RETURN } : copy;

interface ChildForm {
  copy?: Form8332Copy;
  missing: string[];
}

/*
 * A noncustodial parent's copy: the custodial parent released the claim
 * (form8332Release) for a child who did not live with this filer more than
 * half the year. "The noncustodial parent must attach this form or similar
 * statement to his or her tax return each year the exemption is claimed"
 * (irs-8332-form-2025::sec::part-i-release-of-claim-to-exemption-for-current-year::b02).
 */
function releaseForm(inputs: ResolverInputs, fact: DependentFact, joint: boolean): ChildForm {
  const { dependent, dependentSlug } = fact;
  const lived = livedWithTaxpayerOverHalfYear(dependent, TAX_YEAR);
  if (dependent.form8332Release !== true || !isClaimedDependent(dependent) || lived === true) {
    return { missing: [] };
  }
  const factKey = makeForm8332FactKey("release", dependentSlug);
  const release = getForm8332ReleaseFacts(inputs.facts).facts.find(
    (row) => row.dependentSlug === dependentSlug,
  )?.value;
  const copy = releaseCopy({
    dependentKey: fact.sourceFact.key,
    factKey,
    childName: `${dependent.firstName} ${dependent.lastName}`,
    noncustodialParent: parentOf(inputs, release?.parent),
    release,
  });
  return {
    copy: withSpouseGap(copy, release?.parent, joint),
    missing: [...(lived === undefined ? [fact.sourceFact.key] : []), ...(release ? [] : [factKey])],
  };
}

/*
 * A custodial parent's copy: a revocation that counts for 2025, for a child
 * this filer claims. "You must attach a copy of the revocation to your tax
 * return each year the exemption is claimed as a result of the revocation"
 * (irs-8332-form-2025::sec::part-i-release-of-claim-to-exemption-for-current-year::b03).
 * A revocation fact missing an answer files the form and waits.
 */
function revocationForm(inputs: ResolverInputs, fact: DependentFact, joint: boolean): ChildForm {
  const { dependent, dependentSlug } = fact;
  if (!isClaimedDependent(dependent) || dependent.form8332Release === true) return { missing: [] };
  const factKey = makeForm8332FactKey("revocation", dependentSlug);
  const read = getForm8332RevocationFacts(inputs.facts);
  const childName = `${dependent.firstName} ${dependent.lastName}`;
  const dependentKey = fact.sourceFact.key;
  if (read.incompleteKeys.includes(factKey)) {
    const copy: Form8332Copy = {
      kind: "revocation",
      dependentKey,
      factKey,
      noncustodialParentName: undefined,
      noncustodialParentSsn: undefined,
      partIII: { childName, years: undefined, custodialParentSsn: undefined },
    };
    return { copy, missing: [factKey] };
  }
  const revocation = read.facts.find((row) => row.dependentSlug === dependentSlug)?.value;
  if (revocation === undefined || !revocationEffectiveFor(revocation)) return { missing: [] };
  const custodialParent = parentOf(inputs, revocation.parent);
  const copy = revocationCopy({ dependentKey, factKey, childName, custodialParent, revocation });
  return { copy: withSpouseGap(copy, revocation.parent, joint), missing: [] };
}

/*
 * Who files: the noncustodial parent who claims a child through the custodial
 * parent's release attaches the form, one for each child; the custodial parent
 * who claims a child because a revocation took effect attaches a copy of it. A
 * custodial parent who released the claim gives the form to the other parent
 * and files none. The decision still wins.
 */
export function resolve8332Info(inputs: ResolverInputs): Form8332FilingInfo {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const forms = getDependentFacts(inputs.facts).flatMap((fact) => [
    releaseForm(inputs, fact, joint),
    revocationForm(inputs, fact, joint),
  ]);
  const copies = forms.flatMap((form) => (form.copy ? [form.copy] : []));
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8332",
    fallbacks: [
      {
        rule: `fallback: ${copies.length} child(ren) claimed through a Form 8332 release or revocation`,
        value: copies.length > 0,
        triggeredByFactKeys: copies.flatMap((copy) =>
          inputs.factByKey.has(copy.factKey)
            ? [copy.dependentKey, copy.factKey]
            : [copy.dependentKey],
        ),
      },
    ],
  });
  const files = mustFile.value === true;
  const missing = files ? forms.flatMap((form) => form.missing) : [];
  return {
    mustFile: { "form-8332": mustFile },
    missingInputs: {
      "form-8332": missingInputs(Object.fromEntries(missing.map((key) => [key, undefined]))),
    },
    form8332Copies: files ? copies : undefined,
  };
}
