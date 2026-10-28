import { ownerExists } from "@/lib/localAuth";
import { redirect } from "next/navigation";

/* The API also 409s as a backstop. */
export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  if (await ownerExists()) redirect("/login");
  return <>{children}</>;
}
