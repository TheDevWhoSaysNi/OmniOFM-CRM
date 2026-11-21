import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  fetchQcBillingSummary,
  fetchQcCreators,
  fetchQcLeaderboard,
} from "@/lib/qc/bridge";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: {
      useQcDataBridge: true,
      qcAgencyUuid: true,
      creators: {
        select: { externalUuid: true, handle: true, displayName: true },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  if (workspace.useQcDataBridge) {
    const [creators, leaderboard, billing] = await Promise.all([
      fetchQcCreators(workspace.qcAgencyUuid),
      fetchQcLeaderboard(workspace.qcAgencyUuid),
      fetchQcBillingSummary(workspace.qcAgencyUuid),
    ]);
    return NextResponse.json({
      source: "qc_bridge",
      creators: creators?.creators ?? [],
      leaderboard: leaderboard?.leaderboard ?? [],
      billing,
    });
  }

  return NextResponse.json({
    source: "crm_db",
    creators: workspace.creators.map((row) => ({
      uuid: row.externalUuid,
      handle: row.handle,
      displayName: row.displayName,
    })),
    leaderboard: [],
    billing: null,
  });
}