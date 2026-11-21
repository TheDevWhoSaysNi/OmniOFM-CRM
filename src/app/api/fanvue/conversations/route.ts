import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/session";
import { forbidden, unauthorized } from "@/lib/http";
import { listAgencyChats } from "@/lib/fanvue/client";

export async function GET(request: Request) {
  if (!env.FEATURE_INBOX) {
    return NextResponse.json({ error: "Inbox feature disabled." }, { status: 503 });
  }

  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (session.role !== "CHATTER" && session.role !== "ADMIN" && session.role !== "MANAGER") {
    return forbidden();
  }

  const updatedAfter = new URL(request.url).searchParams.get("updatedAfter") ?? undefined;
  const res = await listAgencyChats(session.workspaceId, updatedAfter);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}