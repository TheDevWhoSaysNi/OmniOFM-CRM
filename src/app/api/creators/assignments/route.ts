import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { roleCanManageTeam } from "@/lib/auth/roles";

const postSchema = z.object({
  creatorId: z.string().cuid(),
  userId: z.string().cuid(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const rows = await prisma.creatorAssignment.findMany({
    where: { workspaceId: session.workspaceId, isActive: true },
    include: {
      creator: true,
      user: { select: { id: true, email: true, displayName: true, role: true } },
    },
  });
  return NextResponse.json({ assignments: rows });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!roleCanManageTeam(session.role)) {
    return forbidden();
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid body", parsed.error.flatten());
  }

  const assignment = await prisma.creatorAssignment.upsert({
    where: {
      creatorId_userId: {
        creatorId: parsed.data.creatorId,
        userId: parsed.data.userId,
      },
    },
    create: {
      workspaceId: session.workspaceId,
      creatorId: parsed.data.creatorId,
      userId: parsed.data.userId,
      isActive: parsed.data.isActive,
    },
    update: { isActive: parsed.data.isActive },
    include: { creator: true, user: { select: { id: true, email: true, displayName: true } } },
  });

  return NextResponse.json({ assignment });
}