import { deriveProfile } from "@/lib/profile";
import { latestTaxpayerFirstName, listOwnerReturns } from "@/lib/serverDb";
import type { UserSession } from "@/lib/session";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CURRENT_TAX_YEAR } from "./components/constants";
import { EstimatesSection } from "./components/EstimatesSection";
import { KnowledgeSearch } from "./components/KnowledgeSearch";
import { ReturnsSection } from "./components/ReturnCards";
import { TaxPictureSection } from "./components/TaxPicture";
import { HomeTopBar } from "./HomeTopBar";

/*
 * The name in the greeting. A person who signed in through Cloudflare Access
 * gave no name (their display name is their email), so the greeting uses the
 * first name Cade recorded for the return, and the email until then.
 */
async function greetingName(session: UserSession, typedFirstName: string): Promise<string> {
  if (session.displayName !== session.email) return typedFirstName;
  return (await latestTaxpayerFirstName(session.userId)) ?? session.email;
}

export default async function HomeHome() {
  const session = await getUserSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  const returns = await listOwnerReturns(session.userId);
  const hasCurrentYear = returns.some((taxReturn) => taxReturn.year === CURRENT_TAX_YEAR);
  const hasAnyFiledReturn = returns.some((taxReturn) => taxReturn.state === "filed");

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl space-y-14">
          <div className="space-y-6">
            <Greeting name={await greetingName(session, profile.firstName)} />
            <KnowledgeSearch />
          </div>

          <ReturnsSection returns={returns} hasCurrentYear={hasCurrentYear} />

          <EstimatesSection />

          <TaxPictureSection locked={!hasAnyFiledReturn} />
        </div>
      </main>
    </div>
  );
}

function Greeting({ name }: { name: string }) {
  return (
    <header>
      <h1 className="font-serif text-4xl text-ink-primary">Hi, {name}.</h1>
      <p className="mt-2.5 text-[15px] text-ink-secondary">Your tax life, in one place.</p>
    </header>
  );
}
