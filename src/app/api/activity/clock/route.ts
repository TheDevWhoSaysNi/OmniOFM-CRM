import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, unauthorized } from "@/lib/http";
import { getSession } from "@/lib/auth/session";

const bodySchema = z.object({
  action: z.enum(["in", "out"]),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid clock payload.", parsed.error.flatten());
  }

  if (parsed.data.action === "in") {
    const openSession = await prisma.activitySession.findFirst({
      where: {
        workspaceId: session.workspaceId,
        userId: session.sub,
        clockOutAt: null,
      },
      select: { id: true },
    });
    if (openSession) {
      return NextResponse.json({ error: "Already clocked in." }, { status: 409 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const sessionRecord = await tx.activitySession.create({
        data: {
          workspaceId: session.workspaceId,
          userId: session.sub,
          clockInAt: new Date(),
          notes: parsed.data.notes,
        },
      });

      await tx.shiftSession.create({
        data: {
          workspaceId: session.workspaceId,
          userId: session.sub,
          activitySessionId: sessionRecord.id,
          clockInAt: sessionRecord.clockInAt,
          notes: parsed.data.notes,
        },
      });

      await tx.user.update({
        where: { id: session.sub },
        data: { lastActiveAt: new Date() },
      });
      await tx.workspace.update({
        where: { id: session.workspaceId },
        data: { lastActivityAt: new Date() },
      });

      return sessionRecord;
    });

    return NextResponse.json({ session: created }, { status: 201 });
  }

  const openSession = await prisma.activitySession.findFirst({
    where: {
      workspaceId: session.workspaceId,
      userId: session.sub,
      clockOutAt: null,
    },
  });

  if (!openSession) {
    return NextResponse.json({ error: "No active session to clock out." }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const clockOutAt = new Date();
    const sessionRecord = await tx.activitySession.update({
      where: { id: openSession.id },
      data: {
        clockOutAt,
        notes: parsed.data.notes ?? openSession.notes,
      },
    });

    await tx.shiftSession.updateMany({
      where: {
        workspaceId: session.workspaceId,
        userId: session.sub,
        activitySessionId: openSession.id,
        clockOutAt: null,
      },
      data: { clockOutAt },
    });

    await tx.user.update({
      where: { id: session.sub },
      data: { lastActiveAt: new Date() },
    });
    await tx.workspace.update({
      where: { id: session.workspaceId },
      data: { lastActivityAt: new Date() },
    });

    return sessionRecord;
  });

  return NextResponse.json({ session: updated });
}
