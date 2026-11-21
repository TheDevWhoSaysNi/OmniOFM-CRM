import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listCreators } from "@/lib/fanvue/client";

export async function syncFanvueCreatorsForWorkspace(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, useQcDataBridge: true },
  });
  if (!workspace || workspace.useQcDataBridge) {
    return { skipped: true, reason: "qc_bridge" as const };
  }

  const res = await listCreators(workspaceId);
  if (!res.ok) {
    const text = await res.text();
    await prisma.fanvueSyncState.upsert({
      where: { workspaceId },
      create: { workspaceId, lastError: text.slice(0, 500), backfillStatus: "error" },
      update: { lastError: text.slice(0, 500), backfillStatus: "error" },
    });
    return { ok: false, error: text };
  }

  const payload = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const rows = Array.isArray(payload.data) ? payload.data : [];

  for (const row of rows) {
    const externalUuid = String(row.uuid ?? row.id ?? "");
    if (!externalUuid) {
      continue;
    }
    await prisma.creator.upsert({
      where: {
        workspaceId_platform_externalUuid: {
          workspaceId,
          platform: "FANVUE",
          externalUuid,
        },
      },
      create: {
        workspaceId,
        platform: "FANVUE",
        externalUuid,
        handle: row.handle ? String(row.handle) : null,
        displayName: row.displayName ? String(row.displayName) : null,
        metadata: row as Prisma.InputJsonValue,
      },
      update: {
        handle: row.handle ? String(row.handle) : null,
        displayName: row.displayName ? String(row.displayName) : null,
        metadata: row as Prisma.InputJsonValue,
      },
    });
  }

  await prisma.fanvueSyncState.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      lastCreatorsSyncAt: new Date(),
      backfillStatus: "ok",
      lastError: null,
    },
    update: {
      lastCreatorsSyncAt: new Date(),
      backfillStatus: "ok",
      lastError: null,
    },
  });

  await prisma.platformAccount.upsert({
    where: {
      workspaceId_provider: {
        workspaceId,
        provider: "FANVUE",
      },
    },
    create: {
      workspaceId,
      provider: "FANVUE",
      status: "CONNECTED",
      capabilities: ["METRICS", "INBOX"],
      lastSyncAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      lastSyncAt: new Date(),
      lastError: null,
    },
  });

  return { ok: true, count: rows.length };
}