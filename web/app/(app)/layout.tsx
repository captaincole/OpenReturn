import { getOwnerSession, ownerExists } from "@/lib/localAuth";
import { redirect } from "next/navigation";

/*
 * Auth gate. getOwnerSession() verifies the cookie HMAC against the
 * owner row; the proxy only checked cookie presence, so this is the real
 * gate. The sub-layout at /r/[returnId]/layout.tsx wraps children in
 * AppShell. The home-home at (app)/page.tsx renders its own minimal top
 * bar and needs no AppShell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getOwnerSession();
  if (!session) {
    redirect((await ownerExists()) ? "/login" : "/setup");
  }

  return <>{children}</>;
}
