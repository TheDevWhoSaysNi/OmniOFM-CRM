import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) {
    return auth.error;
  }

  const [workspaces, users, notifications] = await Promise.all([
    prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        lastActivityAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        workspaceId: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        lastActiveAt: true,
        scheduledPurgeAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    workspaces,
    users,
    notifications,
  });
}
