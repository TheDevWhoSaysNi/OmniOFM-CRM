import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

const bodySchema = z.object({
  action: z.enum(["suspend", "reactivate", "deactivate"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error) {
    return auth.error;
  }

  const { workspaceId } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid action payload.", parsed.error.flatten());
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (parsed.data.action === "suspend") {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
      },
    });
  } else if (parsed.data.action === "reactivate") {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        status: "ACTIVE",
        suspendedAt: null,
        deactivatedAt: null,
      },
    });
  } else {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      actorUserId: auth.session.sub,
      action: `super_admin.workspace.${parsed.data.action}`,
      targetType: "workspace",
      targetId: workspace.id,
      metadata: {
        reason: parsed.data.reason,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
