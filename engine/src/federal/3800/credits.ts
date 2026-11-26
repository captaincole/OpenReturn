/*
 * One source of a general business credit: a Part III credit of the current
 * year, or a Part IV carryover. Every row, total and breakdown line of Parts
 * III to VI is figured from these (rowLines.ts, breakdown.ts).
 */

import type {
  BasisIncreaseElection,
  CreditTransfer,
  PassiveCreditActivity,
} from "../../facts/index.js";
import { gap, type Cell } from "./cells.js";

export interface CurrentCredit {
  /* The Part III line. */
  line: string;
  /* The fact or K-1 it came from: the order of the Part V rows. */
  key: string;
  /* Whole dollars before the passive activity limit, or the gap that stops it. */
  amount: Cell;
  passive: boolean;
  /* A passive credit's activity, for Form 8582-CR; undefined while not stated. */
  activity?: PassiveCreditActivity;
  /* A passive credit: the amount Form 8582-CR allows (form.ts sets it). */
  allowed?: Cell;
  /* The pass-through entity's EIN, for a credit from a K-1. */
  ein?: string;
  transfer?: CreditTransfer;
  electivePayment?: { amount: number; registrationNumber: string };
}

export interface Carryover {
  line: string;
  key: string;
  /* The tax year it arose in; 2026 is a carryback. */
  originYear: number;
  amount: Cell;
  passive: boolean;
  activity?: PassiveCreditActivity;
  /* Form 8582-CR Part VI: lowers the prior year unallowed credit. */
  basisIncreaseElection?: BasisIncreaseElection;
  /* A passive carryover: column (e), the amount Form 8582-CR allows (form.ts sets it). */
  allowed?: Cell;
  ein?: string;
  changed: boolean;
  /* Column (h), whole dollars; absent means none. */
  recaptured?: number;
}

/* The tax year of the form: a carryover from before it is a carryforward, from after it a carryback. */
export const TAX_YEAR = 2025;

export const isCarryback = (carryover: Carryover) => carryover.originYear > TAX_YEAR;

/* The signed column (f) amount: a sale is negative, a purchase positive (Part III column (f)). */
export function signedTransfer(credit: CurrentCredit): number | undefined {
  const transfer = credit.transfer;
  if (transfer === undefined) return undefined;
  return transfer.direction === "sold" ? -transfer.amount : transfer.amount;
}

/* An election on the return: a transfer or an elective payment (items B(i), columns (b), (i)). */
export const makesElection = (credit: CurrentCredit) =>
  credit.transfer !== undefined || credit.electivePayment !== undefined;

/* A credit that needs Form 8582-CR: passive, with an amount or a transfer. */
export const needsPassiveLimit = (credit: CurrentCredit) =>
  credit.passive && (credit.amount !== 0 || credit.transfer !== undefined);

/* What Form 8582-CR allows of a passive source; a source it has not figured is a gap. */
export const allowedOf = (source: { allowed?: Cell }): Cell => source.allowed ?? gap(PASSIVE_GAP);

export const PASSIVE_GAP =
  "A passive activity credit is allowed by Form 8582-CR (irs-3800-inst-2025::sec::line-3::b01), and Form 8582-CR does not file (decisions.scope.must_file_8582_cr is false).";

export const ELECTIVE_PAYMENT_GAP =
  "The net elective payment amount (column (j)) is a payment on Schedule 3 line 13c, which the engine does not fill yet.";
