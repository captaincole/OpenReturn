import { AppShell } from "@/components/AppShell";
import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile } from "@/lib/profile";
import { listOwnerReturns } from "@/lib/serverDb";
import { redirect } from "next/navigation";

export default async function ReturnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ returnId: string }>;
}) {
  const { returnId } = await params;
  const year = Number.parseInt(returnId, 10);
  if (!Number.isInteger(year)) redirect("/");

  const session = await getOwnerSession();
  if (!session) redirect("/login");

  const returns = await listOwnerReturns(session.userId);
  const activeReturn = returns.find((r) => r.year === year);
  if (!activeReturn) redirect("/");

  const profile = deriveProfile(session);

  return (
    <AppShell
      userId={session.userId}
      activeReturn={activeReturn}
      returns={returns}
      profile={profile}
    >
      {children}
    </AppShell>
  );
}
