import { getAccessSession } from "@/lib/accessAuth";
import { behindAccess } from "@/lib/authMode";
import { getLocalSession } from "@/lib/localAuth";
import type { UserSession } from "@/lib/userStore";

/*
 * Who this request is for. Every layout and route handler asks here; the
 * sign-in mode (lib/authMode.ts) decides how the answer is checked.
 */

export type { UserSession };

export async function getUserSession(): Promise<UserSession | null> {
  return behindAccess() ? getAccessSession() : getLocalSession();
}
