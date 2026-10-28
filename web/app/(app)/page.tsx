import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile, type UserProfile } from "@/lib/profile";
import { listOwnerReturns } from "@/lib/serverDb";
import { redirect } from "next/navigation";
import { CURRENT_TAX_YEAR } from "./components/constants";
import { EstimatesSection } from "./components/EstimatesSection";
import { KnowledgeSearch } from "./components/KnowledgeSearch";
import { ReturnsSection } from "./components/ReturnCards";
import { TaxPictureSection } from "./components/TaxPicture";
import { HomeTopBar } from "./HomeTopBar";

export default async function HomeHome() {
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  const returns = await listOwnerReturns(session.userId);
  const hasCurrentYear = returns.some((r) => r.year === CURRENT_TAX_YEAR);
  const hasAnyFiledReturn = returns.some((r) => r.state === "filed");

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl space-y-14">
          <div className="space-y-6">
            <Greeting profile={profile} />
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

function Greeting({ profile }: { profile: UserProfile }) {
  return (
    <header>
      <h1 className="font-serif text-4xl text-ink-primary">Hi, {profile.firstName}.</h1>
      <p className="mt-2.5 text-[15px] text-ink-secondary">Your tax life, in one place.</p>
    </header>
  );
}
