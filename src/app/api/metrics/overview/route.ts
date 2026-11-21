import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/http";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const [activeSessions, completedSessions, webhookCount] = await Promise.all([
    prisma.activitySession.count({
      where: { workspaceId: session.workspaceId, clockOutAt: null },
    }),
    prisma.activitySession.findMany({
      where: { workspaceId: session.workspaceId, clockOutAt: { not: null } },
      select: { totalMessages: true, totalSalesCents: true },
      take: 500,
    }),
    prisma.webhookEvent.count({
      where: { workspaceId: session.workspaceId },
    }),
  ]);

  const totals = completedSessions.reduce(
    (acc, row) => {
      acc.messages += row.totalMessages;
      acc.salesCents += row.totalSalesCents;
      return acc;
    },
    { messages: 0, salesCents: 0 }
  );

  return NextResponse.json({
    activeSessions,
    webhookEventsTotal: webhookCount,
    messagesTotal: totals.messages,
    salesTotalCents: totals.salesCents,
  });
}
