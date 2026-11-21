import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { env } from "@/lib/env";
import { createUserPurgeArchive } from "@/lib/compliance/purge-archive";

const bodySchema = z.object({
  action: z.enum(["suspend", "reactivate", "deactivate", "purge", "hard_delete"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error) {
    return auth.error;
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
      status: true,
      email: true,
      displayName: true,
    },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (parsed.data.action === "suspend") {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
        removedReason: parsed.data.reason,
      },
    });
  } else if (parsed.data.action === "reactivate") {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        status: "ACTIVE",
        suspendedAt: null,
        deactivatedAt: null,
        scheduledPurgeAt: null,
        removedReason: null,
      },
    });
  } else if (parsed.data.action === "deactivate") {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
        scheduledPurgeAt: new Date(
          Date.now() + env.INACTIVITY_PURGE_DAYS_AFTER_DEACTIVATION * 24 * 60 * 60 * 1000
        ),
        removedReason: parsed.data.reason,
      },
    });
  } else if (parsed.data.action === "purge") {
    await createUserPurgeArchive(target.id, parsed.data.reason ?? "Purged by super admin");

    await prisma.user.update({
      where: { id: target.id },
      data: {
        status: "PURGED",
        purgedAt: new Date(),
        email: `purged+${target.id}@nicrm.local`,
        displayName: "Purged account",
        phoneNumber: null,
        passwordHash: "PURGED",
        removedReason: parsed.data.reason ?? "Purged by super admin",
      },
    });
  } else {
    const archive = await createUserPurgeArchive(
      target.id,
      parsed.data.reason ?? "Hard deleted by super admin"
    );
    if (!archive) {
      return NextResponse.json({ error: "Unable to archive user before hard delete." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: target.id },
    });

    await prisma.purgeArchive.update({
      where: { id: archive.id },
      data: {
        hardDeletedAt: new Date(),
        metadata: {
          hardDeletedBy: auth.session.sub,
          reason: parsed.data.reason,
        },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: target.workspaceId,
      actorUserId: auth.session.sub,
      action: `super_admin.user.${parsed.data.action}`,
      targetType: "user",
      targetId: target.id,
      metadata: {
        reason: parsed.data.reason,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
