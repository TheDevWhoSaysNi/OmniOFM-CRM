import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { flushHoldcoOutbox } from "@/lib/holdco/events";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!env.CRON_SHARED_SECRET || secret !== env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await flushHoldcoOutbox();
  return NextResponse.json(result);
}