import { behindAccess } from "@/lib/authMode";
import { hasLocalLogin } from "@/lib/localAuth";
import { redirect } from "next/navigation";

/* The API also refuses as a backstop. Behind Cloudflare Access there is no password to set. */
export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  if (behindAccess()) redirect("/");
  if (await hasLocalLogin()) redirect("/login");
  return <>{children}</>;
}
