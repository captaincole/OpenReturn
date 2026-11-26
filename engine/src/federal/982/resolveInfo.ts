import { getCanceledDebtFacts } from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { readDebts, type DebtsRead } from "./debts.js";
import type { Form982FilingInfo } from "./filingInfo.js";
import { figureForm982, type Form982Outcome } from "./form.js";
import { principalResidenceLimit } from "./lines.js";

const BUSINESS_DEBT_GAP =
  "The taxable part of a canceled business, rental or farm debt goes on Schedule C line 6, Schedule E line 3, Schedule F line 8 or Form 4835 line 6 (irs-pub-4681-2025::sec::general-rules::b03), and the engine does not move it there.";

const CLAIMS = new Set(["principal_residence", "farm", "real_property_business"]);

/* A debt fact that asks for an exclusion of section 108, even one whose answers are missing. */
function claimsExclusion(inputs: ResolverInputs): string[] {
  return getCanceledDebtFacts(inputs.facts)
    .filter(
      (fact) =>
        fact.value.title11Case === true ||
        fact.value.insolventBefore === true ||
        CLAIMS.has(fact.value.kind),
    )
    .map((fact) => fact.key);
}

export interface CanceledDebts {
  read: DebtsRead;
  /* Undefined while an answer is missing or with a gap in the facts. */
  outcome?: Form982Outcome;
}

/* The debts and Form 982, figured once for Form 982, Schedule 1 and Schedule CA. */
export function canceledDebts(inputs: ResolverInputs): CanceledDebts {
  const read = readDebts(inputs.facts, inputs.factByKey);
  if (read.gap !== undefined || read.missing.length > 0) return { read };
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  const outcome = figureForm982(
    read.debts,
    read.insolvency,
    read.attributes,
    principalResidenceLimit(separate),
  );
  return { read, outcome };
}

/* Schedule 1 line 8c from the debts: the amount, the wait, or the gap. */
export function canceledDebtIncomeOf(
  debts: CanceledDebts,
): Pick<Form982FilingInfo, "canceledDebtIncome" | "canceledDebtGap" | "canceledDebtWaits"> {
  const { read, outcome } = debts;
  const waits = read.unanswered1099C.length > 0 || read.missing.length > 0;
  const gap =
    read.gap ??
    (outcome?.kind === "gap" ? outcome.reason : undefined) ??
    (outcome?.kind === "figured" && outcome.businessTaxable > 0 ? BUSINESS_DEBT_GAP : undefined);
  const income = outcome?.kind === "figured" ? outcome.nonbusinessTaxable : undefined;
  const anyDebt = read.debts.length + read.unanswered1099C.length + read.missing.length > 0;
  return {
    canceledDebtIncome: anyDebt ? income : undefined,
    canceledDebtGap: gap,
    canceledDebtWaits: waits || undefined,
  };
}

/*
 * Who files: "File Form 982 with your federal income tax return for a year a
 * discharge of indebtedness is excluded from your income under section 108(a)"
 * (irs-982-inst-2025::sec::when-to-file::b01). The form files when line 2 has an
 * amount, or while a debt that asks for an exclusion waits for an answer or has
 * a gap. Part III is for a corporation and never files on this return. The
 * explicit decision still wins.
 */
export function resolve982Info(inputs: ResolverInputs): Form982FilingInfo {
  const debts = canceledDebts(inputs);
  const { read, outcome } = debts;
  const claims = claimsExclusion(inputs);
  const figured = outcome?.kind === "figured" ? outcome : undefined;
  const pending = outcome === undefined || outcome.kind === "gap";
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_982",
    fallbacks: [
      {
        rule: `fallback: Form 982 line 2 $${figured?.form?.line2 ?? 0} excluded, or ${claims.length} debt(s) asking for an exclusion that wait or have a gap`,
        value: figured?.form !== undefined || (claims.length > 0 && pending),
        triggeredByFactKeys: claims,
      },
    ],
  });
  const gap = read.gap ?? (outcome?.kind === "gap" ? outcome.reason : undefined);
  return {
    mustFile: { "form-982": mustFile },
    missingInputs: { "form-982": read.missing },
    form982: figured?.form,
    form982Gap: gap,
    ...canceledDebtIncomeOf(debts),
    principalResidenceExclusion: figured?.principalResidenceExcluded,
  };
}
