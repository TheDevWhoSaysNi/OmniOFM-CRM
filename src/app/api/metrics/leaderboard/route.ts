import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/http";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const grouped = await prisma.activitySession.groupBy({
    by: ["userId"],
    where: { workspaceId: session.workspaceId },
    _sum: {
      totalMessages: true,
      totalSalesCents: true,
    },
    _count: {
      _all: true,
    },
  });

  const userIds = grouped.map((item) => item.userId);
  const users = await prisma.user.findMany({
    where: {
      workspaceId: session.workspaceId,
      id: { in: userIds.length ? userIds : ["__none__"] },
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
    },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const leaderboard = grouped
    .map((item) => {
      const user = userMap.get(item.userId);
      return {
        userId: item.userId,
        name: user?.displayName || user?.email || "Unknown user",
        role: user?.role ?? "CHATTER",
        messagesTotal: item._sum.totalMessages ?? 0,
        salesTotalCents: item._sum.totalSalesCents ?? 0,
        sessionsTotal: item._count._all,
      };
    })
    .sort((a, b) => b.messagesTotal - a.messagesTotal);

  return NextResponse.json({ leaderboard });
}
