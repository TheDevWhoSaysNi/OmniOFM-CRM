import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { syncFanvueCreatorsForWorkspace } from "@/lib/fanvue/sync";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!env.CRON_SHARED_SECRET || secret !== env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!env.FANVUE_SYNC_ENABLED) {
    return NextResponse.json({ skipped: true, reason: "FANVUE_SYNC_ENABLED=false" });
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      status: "ACTIVE",
      useQcDataBridge: false,
      integrations: {
        some: { provider: "FANVUE", status: "CONNECTED" },
      },
    },
    select: { id: true },
    take: 50,
  });

  const results = [];
  for (const workspace of workspaces) {
    results.push({
      workspaceId: workspace.id,
      ...(await syncFanvueCreatorsForWorkspace(workspace.id)),
    });
  }

  return NextResponse.json({ ok: true, results });
}