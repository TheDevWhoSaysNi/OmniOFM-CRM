import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { getSession, hasRequiredRole } from "@/lib/auth/session";
import { generateRandomToken, sha256 } from "@/lib/security";
import { env } from "@/lib/env";

const bodySchema = z.object({
  action: z.enum(["deactivate", "reactivate", "resend_invite"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!hasRequiredRole(session.role, ["ADMIN", "MANAGER"])) {
    return forbidden();
  }

  const { userId } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid action payload.", parsed.error.flatten());
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      workspaceId: true,
      role: true,
      status: true,
    },
  });
  if (!target || target.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (session.role !== "ADMIN" && target.role === "ADMIN") {
    return forbidden("Only admins can manage admin users.");
  }

  if (parsed.data.action === "deactivate") {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
        scheduledPurgeAt: new Date(
          Date.now() + env.INACTIVITY_PURGE_DAYS_AFTER_DEACTIVATION * 24 * 60 * 60 * 1000
        ),
        removedReason: parsed.data.reason ?? "Deactivated by workspace admin",
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "reactivate") {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        status: "ACTIVE",
        deactivatedAt: null,
        scheduledPurgeAt: null,
        suspendedAt: null,
        removedReason: null,
      },
    });

    return NextResponse.json({ ok: true });
  }

  const token = generateRandomToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: target.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    },
  });

  return NextResponse.json({
    ok: true,
    inviteToken: process.env.NODE_ENV === "production" ? undefined : token,
  });
}
