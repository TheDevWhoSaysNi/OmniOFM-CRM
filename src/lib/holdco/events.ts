import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type HoldcoEventType =
  | "workspace.signup"
  | "workspace.monthly_gross"
  | "workspace.churn_risk";

export async function enqueueHoldcoEvent(
  workspaceId: string,
  eventType: HoldcoEventType,
  payload: Record<string, unknown>
) {
  return prisma.holdcoEventOutbox.create({
    data: {
      workspaceId,
      eventType,
      payload: payload as Prisma.InputJsonValue,
    },
  });
}

export async function flushHoldcoOutbox(limit = 20) {
  if (!env.HOLDOC_N8N_WEBHOOK_URL || !env.HOLDOC_WEBHOOK_SECRET) {
    return { skipped: true, delivered: 0 };
  }

  const pending = await prisma.holdcoEventOutbox.findMany({
    where: { deliveredAt: null },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let delivered = 0;
  for (const row of pending) {
    try {
      const res = await fetch(env.HOLDOC_N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": env.HOLDOC_WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          eventType: row.eventType,
          workspaceId: row.workspaceId,
          payload: row.payload,
          emittedAt: row.createdAt.toISOString(),
        }),
      });
      if (!res.ok) {
        throw new Error(`n8n returned ${res.status}`);
      }
      await prisma.holdcoEventOutbox.update({
        where: { id: row.id },
        data: { deliveredAt: new Date(), attempts: { increment: 1 } },
      });
      delivered += 1;
    } catch (err) {
      await prisma.holdcoEventOutbox.update({
        where: { id: row.id },
        data: {
          attempts: { increment: 1 },
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return { skipped: false, delivered };
}