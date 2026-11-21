import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { getSessionCookieName } from "@/lib/auth/session";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid request body", parsed.error.flatten());
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      displayName: true,
      status: true,
      workspaceId: true,
      workspace: { select: { name: true, status: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Account access has been removed." }, { status: 403 });
  }
  if (user.workspace.status !== "ACTIVE") {
    return NextResponse.json({ error: "Workspace access has been removed." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }),
    prisma.workspace.update({
      where: { id: user.workspaceId },
      data: { lastActivityAt: new Date() },
    }),
  ]);

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    },
    workspace: {
      id: user.workspaceId,
      name: user.workspace.name,
    },
  });

  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
