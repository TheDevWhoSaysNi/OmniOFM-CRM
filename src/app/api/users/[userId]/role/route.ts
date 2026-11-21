import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { getSession, hasRequiredRole } from "@/lib/auth/session";

const bodySchema = z.object({
  role: z.enum(["CHATTER", "MANAGER", "QC", "CREATOR_VIEW", "ADMIN"]),
});

export async function PATCH(
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
    return badRequest("Invalid role payload.", parsed.error.flatten());
  }

  if (session.role !== "ADMIN" && parsed.data.role === "ADMIN") {
    return forbidden("Only admins can grant admin role.");
  }
  if (session.sub === userId && parsed.data.role !== "ADMIN") {
    return forbidden("You cannot remove your own admin role.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, workspaceId: true, role: true },
  });
  if (!target || target.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (session.role !== "ADMIN" && target.role === "ADMIN") {
    return forbidden("Only admins can edit admin users.");
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, displayName: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: session.workspaceId,
      actorUserId: session.sub,
      action: "user.role.updated",
      targetType: "user",
      targetId: updated.id,
      metadata: {
        previousRole: target.role,
        newRole: parsed.data.role,
      },
    },
  });

  return NextResponse.json({ user: updated });
}
