import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/session";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { listChatMessages, sendChatMessage } from "@/lib/fanvue/client";

const querySchema = z.object({
  creatorUuid: z.string().uuid(),
  fanUuid: z.string().uuid(),
});

const postSchema = z.object({
  creatorUuid: z.string().uuid(),
  fanUuid: z.string().uuid(),
  text: z.string().min(1).max(4000),
});

export async function GET(request: Request) {
  if (!env.FEATURE_INBOX) {
    return NextResponse.json({ error: "Inbox feature disabled." }, { status: 503 });
  }

  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (session.role !== "CHATTER" && session.role !== "ADMIN") {
    return forbidden();
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsed.success) {
    return badRequest("Invalid query", parsed.error.flatten());
  }

  const res = await listChatMessages(
    session.workspaceId,
    parsed.data.creatorUuid,
    parsed.data.fanUuid
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(request: Request) {
  if (!env.FEATURE_INBOX) {
    return NextResponse.json({ error: "Inbox feature disabled." }, { status: 503 });
  }

  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (session.role !== "CHATTER" && session.role !== "ADMIN") {
    return forbidden();
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid body", parsed.error.flatten());
  }

  const res = await sendChatMessage(
    session.workspaceId,
    parsed.data.creatorUuid,
    parsed.data.fanUuid,
    parsed.data.text
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}