import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { runInactivityLifecycle } from "@/lib/lifecycle/run-inactivity";

export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) {
    return auth.error;
  }

  const result = await runInactivityLifecycle();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
