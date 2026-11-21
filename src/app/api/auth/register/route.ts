import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { hashPassword } from "@/lib/auth/password";
import { getSessionCookieName } from "@/lib/auth/session";
import { signSession } from "@/lib/auth/jwt";
import { enqueueHoldcoEvent } from "@/lib/holdco/events";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80).optional(),
  workspaceName: z.string().min(2).max(80),
  workspaceKind: z.enum(["AGENCY", "CREATOR"]).default("AGENCY"),
  useQcDataBridge: z.boolean().optional(),
  qcAgencyUuid: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid request body", parsed.error.flatten());
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const useBridge = parsed.data.useQcDataBridge ?? parsed.data.workspaceKind === "AGENCY";

  const created = await prisma.workspace.create({
    data: {
      name: parsed.data.workspaceName,
      kind: parsed.data.workspaceKind,
      useQcDataBridge: useBridge,
      qcAgencyUuid: parsed.data.qcAgencyUuid,
      lastActivityAt: new Date(),
      users: {
        create: {
          email: parsed.data.email.toLowerCase(),
          passwordHash,
          displayName: parsed.data.displayName,
          role: "ADMIN",
          lastActiveAt: new Date(),
        },
      },
      auditLogs: {
        create: {
          action: "workspace.created",
          metadata: {
            source: "auth.register",
            kind: parsed.data.workspaceKind,
          },
        },
      },
    },
    include: {
      users: {
        take: 1,
      },
    },
  });

  await enqueueHoldcoEvent(created.id, "workspace.signup", {
    workspaceName: created.name,
    kind: created.kind,
    adminEmail: parsed.data.email.toLowerCase(),
  });

  const admin = created.users[0];
  const token = await signSession({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    workspaceId: created.id,
  });

  const response = NextResponse.json({
    user: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      displayName: admin.displayName,
    },
    workspace: {
      id: created.id,
      name: created.name,
      kind: created.kind,
      useQcDataBridge: created.useQcDataBridge,
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