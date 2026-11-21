import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { getSession, hasRequiredRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { generateRandomToken, sha256 } from "@/lib/security";

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80).optional(),
  role: z.enum(["CHATTER", "MANAGER", "ADMIN"]).default("CHATTER"),
  sendInvite: z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  if (!hasRequiredRole(session.role, ["ADMIN", "MANAGER"])) {
    return forbidden();
  }

  const users = await prisma.user.findMany({
    where: { workspaceId: session.workspaceId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
      lastActiveAt: true,
      scheduledPurgeAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!hasRequiredRole(session.role, ["ADMIN", "MANAGER"])) {
    return forbidden();
  }

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid user payload.", parsed.error.flatten());
  }

  if (session.role !== "ADMIN" && parsed.data.role === "ADMIN") {
    return forbidden("Only admins can create other admins.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const temporaryPassword = generateRandomToken(12);
  const passwordHash = await hashPassword(temporaryPassword);

  const created = await prisma.user.create({
    data: {
      workspaceId: session.workspaceId,
      email: parsed.data.email.toLowerCase(),
      displayName: parsed.data.displayName,
      role: parsed.data.role as UserRole,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
      lastActiveAt: true,
    },
  });

  let inviteToken: string | null = null;
  if (parsed.data.sendInvite) {
    inviteToken = generateRandomToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: created.id,
        tokenHash: sha256(inviteToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: session.workspaceId,
      actorUserId: session.sub,
      action: "user.created",
      targetType: "user",
      targetId: created.id,
      metadata: {
        role: created.role,
      },
    },
  });

  return NextResponse.json(
    {
      user: created,
      invite:
        parsed.data.sendInvite && inviteToken
          ? {
              token: process.env.NODE_ENV === "production" ? undefined : inviteToken,
              expiresInHours: 48,
            }
          : null,
      temporaryPassword: process.env.NODE_ENV === "production" ? undefined : temporaryPassword,
    },
    { status: 201 }
  );
}
