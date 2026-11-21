import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isSuperAdminEmail } from "@/lib/auth/super-admin";

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!isSuperAdminEmail(session.email)) {
    return {
      error: NextResponse.json({ error: "Super admin access required." }, { status: 403 }),
    };
  }

  return { session };
}
