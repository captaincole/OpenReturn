/*
 * Every exchange that files FTB 3840 this year, and the copy the engine prints.
 * Who files (ca-3840-inst-2025::sec::b-who-must-file::b01, c-when-to-file::b01):
 * a taxpayer who exchanged real property in California for like-kind property
 * outside California, "regardless of residence status", for the year of the
 * exchange and each later year until the California sourced deferred gain is
 * recognized. "File a separate form FTB 3840 for each such exchange"
 * (g-multiple-exchanges::b01).
 */

import {
  exchangeSlugOf,
  makeCaLikeKindExchangeFactKey,
  makeLikeKindExchangeFactKey,
  readCaLikeKindExchangeFacts,
  readLikeKindExchangeFacts,
} from "../../../facts/index.js";
import { yearOf } from "../../../federal/8824/lines.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { CaExchange } from "./exchange.js";
import { TAX_YEAR } from "./lines.js";

/* The form's exchange, or why its exchange lines cannot be figured. */
export interface Form3840State {
  exchange?: CaExchange;
  gap?: string;
}

export interface Form3840Exchanges {
  /* The exchanges that file, and those that file until the California answers say otherwise. */
  filing: CaExchange[];
  malformedKeys: string[];
  /* The facts each filing exchange still needs. */
  missingKeys: string[];
}

/* The California return files: Form 540 or Form 540NR. */
export const CALIFORNIA_RETURN_KEYS = [
  "decisions.scope.must_file_ca_540",
  "decisions.scope.must_file_540nr",
] as const;

export const filesCaliforniaReturn = (inputs: ResolverInputs): boolean =>
  CALIFORNIA_RETURN_KEYS.some((key) => inputs.decisionByKey.get(key) === true);

/* Each exchange by slug: its federal fact, its California fact, or both. */
function pairs(inputs: ResolverInputs): { exchanges: CaExchange[]; malformedKeys: string[] } {
  const federal = readLikeKindExchangeFacts(inputs.facts).facts;
  const california = readCaLikeKindExchangeFacts(inputs.facts);
  const slugs = [
    ...new Set([...federal, ...california.facts].flatMap((fact) => exchangeSlugOf(fact.key) ?? [])),
  ];
  const exchanges = slugs.map((slug) => ({
    federalKey: makeLikeKindExchangeFactKey(slug),
    californiaKey: makeCaLikeKindExchangeFactKey(slug),
    federal: federal.find((fact) => exchangeSlugOf(fact.key) === slug)?.value,
    california: california.facts.find((fact) => exchangeSlugOf(fact.key) === slug)?.value,
  }));
  return { exchanges, malformedKeys: california.malformedKeys };
}

/*
 * One exchange files: California property given up for property outside
 * California, transferred by the end of 2025. With no California answers yet,
 * an exchange files while a California return files, so the form asks where
 * each property is (QUESTIONS.md).
 */
function files(exchange: CaExchange, californiaReturn: boolean): boolean {
  const { federal, california } = exchange;
  if (federal !== undefined && yearOf(federal.givenUp.dateTransferred) > TAX_YEAR) return false;
  if (california === undefined) return californiaReturn;
  return california.givenUp.inCalifornia && !california.received.inCalifornia;
}

/* The facts an exchange still needs: either fact, or the related party's number (line C). */
function missingOf(exchange: CaExchange): string[] {
  const related = exchange.federal?.relatedParty;
  return [
    ...(exchange.federal === undefined ? [exchange.federalKey] : []),
    ...(exchange.california === undefined ? [exchange.californiaKey] : []),
    ...(related !== undefined && related.identifyingNumber === undefined
      ? [exchange.federalKey]
      : []),
  ];
}

export function form3840Exchanges(inputs: ResolverInputs): Form3840Exchanges {
  const { exchanges, malformedKeys } = pairs(inputs);
  const californiaReturn = filesCaliforniaReturn(inputs);
  const filing = exchanges.filter((exchange) => files(exchange, californiaReturn));
  return {
    filing,
    malformedKeys,
    missingKeys: [...new Set(filing.flatMap(missingOf))],
  };
}

const MALFORMED = (keys: string[]) => `Malformed FTB 3840 fact(s): ${keys.join(", ")}.`;
const NO_FACTS =
  "FTB 3840 files by decision, but no like-kind exchange fact gives the exchange (likeKindExchange.ts and caLikeKindExchange.ts).";

/*
 * The printed copies: one form for each exchange ("File a separate form FTB 3840
 * for each such exchange", g-multiple-exchanges::b01), or one copy whose every
 * exchange line is the gap.
 */
export function form3840CopiesOf(exchanges: Form3840Exchanges): Form3840State[] {
  if (exchanges.malformedKeys.length > 0) return [{ gap: MALFORMED(exchanges.malformedKeys) }];
  if (exchanges.filing.length === 0) return [{ gap: NO_FACTS }];
  return exchanges.filing.map((exchange) => ({ exchange }));
}
