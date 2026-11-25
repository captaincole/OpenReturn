import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import {
  CALIFORNIA_RETURN_KEYS,
  filesCaliforniaReturn,
  form3840CopiesOf,
  form3840Exchanges,
} from "./exchanges.js";
import type { Form3840FilingInfo } from "./filingInfo.js";

/*
 * Who files (exchanges.ts): an exchange of California real property for
 * property outside California, in 2025 or an earlier year whose California
 * deferred gain is not recognized before 2025; an exchange with no California
 * answers while a California return files; a malformed California fact. The
 * explicit decision wins. The form asks for the facts an exchange still needs.
 */
export function resolve3840Info(inputs: ResolverInputs): Form3840FilingInfo {
  const exchanges = form3840Exchanges(inputs);
  const keys = [
    ...exchanges.filing.flatMap((exchange) => [exchange.federalKey, exchange.californiaKey]),
    ...exchanges.malformedKeys,
  ];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3840",
    fallbacks: [
      {
        rule: `fallback: ${exchanges.filing.length} exchange(s) of California property for property outside California, or with the California answers missing while a California return files; ${exchanges.malformedKeys.length} malformed fact(s)`,
        value: exchanges.filing.length + exchanges.malformedKeys.length > 0,
        triggeredByFactKeys: keys,
        triggeredByDecisionKeys: [...CALIFORNIA_RETURN_KEYS],
      },
    ],
  });
  const files = resolution.value === true;
  const copies = files ? form3840CopiesOf(exchanges) : undefined;
  return {
    mustFile: { "form-3840": resolution },
    missingInputs: { "form-3840": files ? exchanges.missingKeys : [] },
    form3840: copies?.[0],
    form3840Copies: copies,
    form3840Attached: filesCaliforniaReturn(inputs),
  };
}
