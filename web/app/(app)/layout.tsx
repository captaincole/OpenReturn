import { getOwnerSession, ownerExists } from "@/lib/localAuth";
import { redirect } from "next/navigation";

/* The real auth gate: proxy.ts only checked cookie presence. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getOwnerSession();
  if (!session) {
    redirect((await ownerExists()) ? "/login" : "/setup");
  }

  return <>{children}</>;
}
