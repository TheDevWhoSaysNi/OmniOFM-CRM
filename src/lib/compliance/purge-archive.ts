import { prisma } from "@/lib/prisma";

export async function createUserPurgeArchive(userId: string, reason?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      activitySessions: {
        select: {
          id: true,
          clockInAt: true,
          clockOutAt: true,
          totalMessages: true,
          totalSalesCents: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const archive = await prisma.purgeArchive.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      originalUserId: user.id,
      archivedData: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
          deactivatedAt: user.deactivatedAt,
          scheduledPurgeAt: user.scheduledPurgeAt,
        },
        workspace: user.workspace,
        activitySummary: {
          sessionsCount: user.activitySessions.length,
          messagesTotal: user.activitySessions.reduce(
            (sum, sessionRecord) => sum + sessionRecord.totalMessages,
            0
          ),
          salesTotalCents: user.activitySessions.reduce(
            (sum, sessionRecord) => sum + sessionRecord.totalSalesCents,
            0
          ),
        },
      },
      metadata: {
        reason,
      },
    },
  });

  return archive;
}
