import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized } from "@/lib/http";
import { getSession, hasRequiredRole } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ integrationId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!hasRequiredRole(session.role, ["ADMIN", "MANAGER"])) {
    return forbidden();
  }

  const { integrationId } = await context.params;
  const integration = await prisma.integrationConnection.findUnique({
    where: { id: integrationId },
    select: { id: true, workspaceId: true, provider: true },
  });

  if (!integration || integration.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: "Integration not found." }, { status: 404 });
  }

  await prisma.integrationConnection.update({
    where: { id: integration.id },
    data: {
      status: "DISCONNECTED",
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      metadata: {
        disconnectedByUserId: session.sub,
        disconnectedAt: new Date().toISOString(),
      },
    },
  });

  if (integration.provider === "TELEGRAM") {
    await prisma.telegramBotConfig.updateMany({
      where: { workspaceId: session.workspaceId },
      data: { isEnabled: false },
    });
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: session.workspaceId,
      actorUserId: session.sub,
      action: "integration.disconnected",
      targetType: "integration",
      targetId: integration.id,
      metadata: {
        provider: integration.provider,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
