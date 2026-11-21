import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { env } from "@/lib/env";
import { getSession, hasRequiredRole } from "@/lib/auth/session";
import { generateRandomToken } from "@/lib/security";
import { encryptSecret } from "@/lib/crypto/tokens";

const bodySchema = z.object({
  botToken: z.string().min(20),
  botUsername: z.string().min(3).max(64).optional(),
  webhookBaseUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!hasRequiredRole(session.role, ["ADMIN", "MANAGER"])) {
    return forbidden();
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid Telegram connection body.", parsed.error.flatten());
  }

  const webhookSecret = generateRandomToken(24);
  const baseUrl =
    parsed.data.webhookBaseUrl ??
    env.TELEGRAM_BOT_DEFAULT_WEBHOOK_BASE_URL ??
    env.APP_BASE_URL;
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook?workspaceId=${session.workspaceId}&secret=${webhookSecret}`;

  await prisma.$transaction([
    prisma.telegramBotConfig.upsert({
      where: { workspaceId: session.workspaceId },
      create: {
        workspaceId: session.workspaceId,
        botTokenEncrypted: encryptSecret(parsed.data.botToken),
        botUsername: parsed.data.botUsername,
        webhookSecret,
        webhookUrl,
        isEnabled: true,
      },
      update: {
        botTokenEncrypted: encryptSecret(parsed.data.botToken),
        botUsername: parsed.data.botUsername,
        webhookSecret,
        webhookUrl,
        isEnabled: true,
      },
    }),
    prisma.integrationConnection.upsert({
      where: {
        workspaceId_provider_externalAccountId: {
          workspaceId: session.workspaceId,
          provider: "TELEGRAM",
          externalAccountId: "primary",
        },
      },
      create: {
        workspaceId: session.workspaceId,
        provider: "TELEGRAM",
        externalAccountId: "primary",
        status: "CONNECTED",
        accessTokenEncrypted: parsed.data.botToken,
        metadata: {
          botUsername: parsed.data.botUsername,
          connectedByUserId: session.sub,
          webhookUrl,
        },
      },
      update: {
        status: "CONNECTED",
        accessTokenEncrypted: parsed.data.botToken,
        metadata: {
          botUsername: parsed.data.botUsername,
          connectedByUserId: session.sub,
          webhookUrl,
          updatedAt: new Date().toISOString(),
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    nextStep:
      "In BotFather, set the webhook URL for this bot. Then configure funnel rules in /api/telegram/funnel-rules.",
    webhookUrl,
  });
}
