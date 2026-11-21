import { cookies } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "omniofm_crm_session";

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySession(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      workspaceId: true,
      status: true,
      workspace: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!user || user.workspaceId !== payload.workspaceId) {
    return null;
  }
  if (user.status !== "ACTIVE") {
    return null;
  }
  if (user.workspace.status !== "ACTIVE") {
    return null;
  }

  return payload;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export { hasRequiredRole } from "@/lib/auth/roles";
