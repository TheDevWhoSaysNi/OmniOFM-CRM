import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const secret = url.searchParams.get("secret");

  if (!workspaceId || !secret) {
    return badRequest("Missing workspaceId or secret.");
  }

  const config = await prisma.telegramBotConfig.findUnique({
    where: { workspaceId },
    select: { webhookSecret: true },
  });

  if (!config || config.webhookSecret !== secret) {
    return NextResponse.json({ error: "Invalid Telegram webhook secret." }, { status: 401 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const text = String((payload.message as { text?: string } | undefined)?.text ?? "").toLowerCase();

  const activeRules = await prisma.telegramFunnelRule.findMany({
    where: { workspaceId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const matchedRule =
    activeRules.find((rule) => text.includes(rule.triggerKeyword.toLowerCase())) ??
    activeRules.find((rule) => rule.isDefault);

  // Phase 1 behavior: capture route decision only.
  await prisma.auditLog.create({
    data: {
      workspaceId,
      action: "telegram.message.received",
      targetType: "telegram.message",
      metadata: {
        matchedRuleId: matchedRule?.id,
        targetProvider: matchedRule?.targetProvider,
        targetLabel: matchedRule?.targetLabel,
        messagePreview: text.slice(0, 120),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    routedTo: matchedRule
      ? { provider: matchedRule.targetProvider, label: matchedRule.targetLabel }
      : null,
  });
}
