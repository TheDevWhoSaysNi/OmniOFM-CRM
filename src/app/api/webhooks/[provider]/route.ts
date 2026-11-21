import { NextResponse } from "next/server";
import { IntegrationProvider, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { isSupportedProvider, getWebhookSecret } from "@/lib/integrations/providers";
import { sha256 } from "@/lib/security";

function mapProvider(provider: "fanvue" | "onlyfans"): IntegrationProvider {
  return provider === "fanvue" ? "FANVUE" : "ONLYFANS";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  if (!isSupportedProvider(provider) || provider === "telegram") {
    return badRequest("Unsupported webhook provider.");
  }
  if (provider === "fansly" || provider === "stacked") {
    return badRequest("Webhook provider not implemented yet.");
  }

  const rawBody = await request.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return badRequest("Webhook body must be valid JSON.");
  }
  const workspaceId = String(payload.workspaceId ?? "");
  if (!workspaceId) {
    return badRequest("Webhook payload must include workspaceId.");
  }

  const signature = request.headers.get("x-signature");
  const secret = getWebhookSecret(provider);
  if (secret && signature !== sha256(rawBody + secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const providerEventId =
    request.headers.get("x-event-id") ??
    (typeof payload.id === "string" ? payload.id : undefined) ??
    sha256(`${provider}:${rawBody}`);

  try {
    await prisma.webhookEvent.create({
      data: {
        workspaceId,
        provider: mapProvider(provider),
        idempotencyKey: `${provider}:${providerEventId}`,
        eventType: typeof payload.type === "string" ? payload.type : undefined,
        payload: payload as Prisma.InputJsonValue,
        status: "RECEIVED",
      },
    });
  } catch {
    // Already ingested this idempotency key; return success to stop retries.
    return NextResponse.json({ ok: true, deduped: true });
  }

  return NextResponse.json({ ok: true, queued: true });
}
