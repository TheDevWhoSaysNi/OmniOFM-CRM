import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { fetchQcChatterMessageCount } from "@/lib/qc/bridge";

const bodySchema = z.object({
  shiftSessionId: z.string().cuid(),
  chatterAlias: z.string().min(1),
});

export async function POST(request: Request) {
  const service = request.headers.get("x-cron-secret");
  const sessionAuth = request.headers.get("authorization");
  const isService = Boolean(env.CRON_SHARED_SECRET && service === env.CRON_SHARED_SECRET);

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const shift = await prisma.shiftSession.findUnique({
    where: { id: parsed.data.shiftSessionId },
    include: {
      workspace: { select: { qcAgencyUuid: true, useQcDataBridge: true } },
    },
  });
  if (!shift) {
    return NextResponse.json({ error: "Shift not found." }, { status: 404 });
  }
  if (!isService && !sessionAuth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = shift.workspace.useQcDataBridge
    ? await fetchQcChatterMessageCount({
        agencyUuid: shift.workspace.qcAgencyUuid,
        chatterAlias: parsed.data.chatterAlias,
        sinceIso: shift.clockInAt.toISOString(),
        untilIso: shift.clockOutAt?.toISOString(),
      })
    : null;

  const updated = await prisma.shiftSession.update({
    where: { id: shift.id },
    data: {
      qcValidatedMsgs: count,
      qcValidatedAt: count != null ? new Date() : undefined,
    },
  });

  return NextResponse.json({
    shiftSessionId: updated.id,
    qcValidatedMsgs: updated.qcValidatedMsgs,
    qcValidatedAt: updated.qcValidatedAt,
  });
}