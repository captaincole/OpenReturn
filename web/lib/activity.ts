export type ActivityKind = "fact" | "decision";
/* `ungroundable` appears on legacy rows only. */
export type Verdict =
  | "pending"
  | "accurate"
  | "inaccurate"
  | "ungroundable"
  | "needs_more_facts"
  | "review_failed"
  | "review_unreached";
export type Confidence = "low" | "medium" | "high";

export interface ActivityItem {
  kind: ActivityKind;
  id: string;
  createdAt: string;
  title: string;
  value: unknown;
  sourceNote: string | null;
  category?: string;
  rationale?: string;
  supportingFactKeys?: string[];
  confidence?: Confidence;
  verdict?: Verdict | null;
  verdictReason?: string | null;
}

const DEMO_TAX_YEAR = 2025;
export const ACTIVITY_TAX_YEAR = DEMO_TAX_YEAR;

export async function fetchActivityItems(limit = 50): Promise<ActivityItem[]> {
  const res = await fetch(`/api/activity?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`activity fetch failed: ${res.status}`);
  return (await res.json()) as ActivityItem[];
}
