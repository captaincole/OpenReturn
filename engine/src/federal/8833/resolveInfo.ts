import { getTreatyPositionFacts } from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form8833FilingInfo } from "./filingInfo.js";

const NO_POSITION =
  "Form 8833 files by decision, but no treaty position fact states the position it discloses.";

/*
 * Who files: "Generally, a taxpayer who takes a treaty-based return position
 * must disclose that position, unless reporting is specifically waived"
 * (irs-8833-form-2025::sec::who-must-file::b01), one form for each position
 * (general-instructions::b01). A position whose answers say reporting is waived
 * files none. A spouse's position belongs on a joint return only. A position
 * that is missing an answer files the form and is listed again. The decision
 * still wins, both ways.
 */
export function resolve8833Info(inputs: ResolverInputs): Form8833FilingInfo {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const positions = getTreatyPositionFacts(inputs.facts)
    .filter((position) => position.owner === "taxpayer" || joint)
    .filter((position) => position.value.reportingWaived !== true);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8833",
    fallbacks: [
      {
        rule: `fallback: ${positions.length} treaty-based return position(s) to disclose`,
        value: positions.length > 0,
        triggeredByFactKeys: positions.map((position) => position.key),
      },
    ],
  });
  const files = mustFile.value === true;
  const waiting = files ? positions.filter((position) => position.missing.length > 0) : [];
  return {
    mustFile: { "form-8833": mustFile },
    missingInputs: {
      "form-8833": missingInputs(
        Object.fromEntries(waiting.map((position) => [position.key, undefined])),
      ),
    },
    form8833Positions: files ? positions : undefined,
    form8833Gap: files && positions.length === 0 ? NO_POSITION : undefined,
  };
}
