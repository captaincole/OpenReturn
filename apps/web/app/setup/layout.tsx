import { redirect } from "next/navigation";
import { ownerExists } from "@/lib/localAuth";

/*
 * Setup is one-shot. Once the owner exists this route redirects to
 * /login; the API also 409s as a backstop.
 */
export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  if (await ownerExists()) redirect("/login");
  return <>{children}</>;
}
