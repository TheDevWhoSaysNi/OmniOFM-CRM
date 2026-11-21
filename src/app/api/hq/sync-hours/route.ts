import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { roleAtLeastManager } from "@/lib/auth/roles";
import { unauthorized, forbidden } from "@/lib/http";
import { fetchHqHoursSince } from "@/lib/hq/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!roleAtLeastManager(session.role)) {
    return forbidden();
  }

  const since =
    new URL(request.url).searchParams.get("since") ??
    new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);

  const rows = await fetchHqHoursSince(since);
  let updated = 0;
  for (const row of rows) {
    const user = await prisma.user.findFirst({
      where: { workspaceId: session.workspaceId, email: row.userEmail.toLowerCase() },
      select: { id: true },
    });
    if (!user) {
      continue;
    }
    const openShift = await prisma.shiftSession.findFirst({
      where: { workspaceId: session.workspaceId, userId: user.id, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
    });
    if (openShift) {
      await prisma.shiftSession.update({
        where: { id: openShift.id },
        data: { hqMinutesSynced: row.minutes },
      });
      updated += 1;
    }
  }

  return NextResponse.json({ since, rows: rows.length, shiftsUpdated: updated });
}