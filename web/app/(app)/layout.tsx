import { getUserSession, hasUsers } from "@/lib/localAuth";
import { redirect } from "next/navigation";

/* The real auth gate: proxy.ts only checked cookie presence. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session) {
    redirect((await hasUsers()) ? "/login" : "/setup");
  }

  return <>{children}</>;
}
