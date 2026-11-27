import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form8609ABuildingCredits } from "../8609-a/credits.js";
import { resolve8609AInfo } from "../8609-a/resolveInfo.js";
import type { Form8586FilingInfo } from "./filingInfo.js";
import { form8586LinesOf, type BuildingOnForm8586 } from "./lines.js";
import { passThroughCreditOf } from "./passThroughCredits.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8586";

/* Each Form 8609-A with the fact it comes from, in copy order. */
export function buildingsOnForm8586(
  inputs: ResolverInputs,
): Array<BuildingOnForm8586 & { key: string; waitingOn: string[] }> {
  const info = resolve8609AInfo(inputs);
  const copies = info.form8609ACopies ?? [];
  return form8609ABuildingCredits(info).map((building, index) => ({
    ...building,
    key: copies[index]?.key ?? "",
    waitingOn: [...(copies[index]?.waitingOn ?? [])],
  }));
}

/*
 * Who files: "Use Form 8586 to claim the low-income housing credit"
 * (irs-8586-form-2025::sec::purpose-of-form::b01), with "a copy of each Form
 * 8609-A you completed for the tax year" attached (::line-3::b01). So a Form
 * 8609-A on the return files it, in every year of the compliance period, also
 * when its credit is 0. "Taxpayers, other than partnerships, S corporations,
 * estates, or trusts, whose only source of this credit is from those
 * pass-through entities, are not required to complete or file this form.
 * Instead, they can report this credit directly on Form 3800" (same block):
 *
 * DECISION (2026-11-27, by the author): a K-1 credit alone does not file Form
 * 8586. The Form 8609-A instructions say a partner, shareholder or beneficiary
 * should "file only Form 8586, Low-Income Housing Credit, to claim the credit
 * using the information that the entity furnishes to you on Schedule K-1"
 * (irs-8609a-inst-2025::sec::general-instructions::b01); Form 8586's own
 * instructions say such a taxpayer is "not required to complete or file this
 * form" and "can report this credit directly on Form 3800" (irs-8586-form-2025::sec::purpose-of-form::b01).
 * The engine follows Form 8586's instructions, a form's own instructions decide
 * how it is filed, and the K-1 credit reaches Form 3800 line 4d either way
 * (docs/rule-decisions.md row A102). The explicit decision still wins.
 */
export function resolve8586Info(inputs: ResolverInputs): Form8586FilingInfo {
  const buildings = buildingsOnForm8586(inputs);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${buildings.length} Form(s) 8609-A for buildings the taxpayer owns directly`,
        value: buildings.length > 0,
        triggeredByFactKeys: buildings.map((building) => building.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8586": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8586": [] } };
  // Line 3 waits on the fact a Form 8609-A waits on.
  const waiting = [...new Set(buildings.flatMap((building) => building.waitingOn))];
  return {
    ...filed,
    missingInputs: { "form-8586": waiting },
    lowIncomeHousingCredit: form8586LinesOf(buildings, passThroughCreditOf(inputs)),
  };
}
