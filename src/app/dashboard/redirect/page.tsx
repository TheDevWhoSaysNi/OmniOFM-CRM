import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/roles";

export default async function DashboardRedirectPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  redirect(homePathForRole(session.role));
}