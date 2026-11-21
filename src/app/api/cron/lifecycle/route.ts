import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runInactivityLifecycle } from "@/lib/lifecycle/run-inactivity";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const providedSecret =
    request.headers.get("x-cron-secret") ?? url.searchParams.get("secret") ?? "";

  if (!env.CRON_SHARED_SECRET || providedSecret !== env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const result = await runInactivityLifecycle();
  return NextResponse.json({ ok: true, ...result });
}
