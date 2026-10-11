import { AppShell } from "@/components/AppShell";
import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile } from "@/lib/profile";
import { listOwnerReturns } from "@/lib/serverDb";
import { redirect } from "next/navigation";

/*
 * Return-scoped layout. It resolves the route param against the caller's
 * real filings (the filings + filing_members tables). If no filing exists
 * for the requested year, redirect to '/' so the user can start one; the
 * home-home page renders the empty-state CTA.
 *
 * The outer (app)/layout.tsx already gates auth. We call getOwnerSession
 * again to get the verified userId for AppShell. That costs one extra DB
 * roundtrip per navigation, acceptable for now.
 */
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
