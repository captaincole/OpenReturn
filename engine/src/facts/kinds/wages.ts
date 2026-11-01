import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface W2Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface W2Box12Entry {
  code: string;
  amount: number;
}

export interface W2Box14Entry {
  label: string;
  amount: number;
}

export interface W2FactValue {
  employerName: string;
  employerEin: string;
  employerAddress?: W2Address;
  /* Boxes (a), (e), (f): one W-2 ingest also fills the identity facts. */
  employee?: {
    firstName: string;
    middleInitial?: string;
    lastName: string;
    suffix?: string;
    ssn: string;
    address?: W2Address;
  };
  box1: number;
  box2: number;
  box3?: number;
  box4?: number;
  box5?: number;
  box6?: number;
  box7?: number;
  box8?: number;
  box10?: number;
  box11?: number;
  box12?: W2Box12Entry[];
  box13?: {
    statutoryEmployee?: boolean;
    retirementPlan?: boolean;
    thirdPartySickPay?: boolean;
  };
  box14?: W2Box14Entry[];
  box15?: string; // state
  box16?: number; // state wages
  box17?: number; // state income tax
}

export interface W2Fact {
  employerSlug: string;
  w2: W2FactValue;
  sourceFact: TaxFactRow;
}

const W2_CATEGORY = "wages";
const W2_KEY_RE = /^employer\.([^.]+)$/;

export function makeW2FactKey(employerSlug: string): string {
  return `employer.${employerSlug}`;
}

export function isW2FactKey(key: string): boolean {
  return W2_KEY_RE.test(key);
}

export function isW2Fact(fact: TaxFactRow): boolean {
  return fact.category === W2_CATEGORY && W2_KEY_RE.test(fact.key);
}

export function parseW2Fact(fact: TaxFactRow): W2Fact | null {
  if (fact.category !== W2_CATEGORY) return null;
  const match = fact.key.match(W2_KEY_RE);
  if (!match) return null;
  const [, employerSlug] = match;
  return {
    employerSlug,
    w2: fact.value as W2FactValue,
    sourceFact: fact,
  };
}

export function getW2Facts(facts: FactsView): W2Fact[] {
  const out: W2Fact[] = [];
  for (const fact of facts.byCategory(W2_CATEGORY)) {
    const parsed = parseW2Fact(fact);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
