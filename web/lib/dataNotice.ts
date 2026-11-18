import { behindAccess } from "@/lib/authMode";
import { hasAcceptedNotice } from "@/lib/userStore";

/*
 * The first-visit notice (app/notice): where a guest's data goes. It shows on
 * an instance behind Cloudflare Access, where a person uses a computer and
 * model keys of someone else. A local instance belongs to its one user.
 */
export async function noticeIsDue(userId: string): Promise<boolean> {
  return behindAccess() && !(await hasAcceptedNotice(userId));
}
