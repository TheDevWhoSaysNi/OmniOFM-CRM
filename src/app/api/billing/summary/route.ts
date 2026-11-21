import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { unauthorized, forbidden } from "@/lib/http";
import { roleAtLeastManager } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { fetchQcBillingSummary } from "@/lib/qc/bridge";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!roleAtLeastManager(session.role)) {
    return forbidden();
  }

  const month = new URL(request.url).searchParams.get("month") ?? undefined;
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: { useQcDataBridge: true, qcAgencyUuid: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (workspace.useQcDataBridge) {
    const billing = await fetchQcBillingSummary(workspace.qcAgencyUuid, month);
    return NextResponse.json({ source: "qc_bridge", billing });
  }

  return NextResponse.json({
    source: "crm_poller",
    billing: {
      month: month ?? new Date().toISOString().slice(0, 7),
      clients: [],
      message:
        "CRM-owned billing compiles after Fanvue sync fills the warehouse. Connect Fanvue and enable FANVUE_SYNC_ENABLED.",
    },
  });
}