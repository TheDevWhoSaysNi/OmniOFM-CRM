import { env } from "@/lib/env";
import { decryptSecret } from "@/lib/crypto/tokens";
import { prisma } from "@/lib/prisma";

type FanvueRequestInit = RequestInit & { workspaceId: string };

async function loadAccessToken(workspaceId: string): Promise<string | null> {
  const connection = await prisma.integrationConnection.findFirst({
    where: { workspaceId, provider: "FANVUE", status: "CONNECTED" },
    orderBy: { updatedAt: "desc" },
  });
  if (!connection?.accessTokenEncrypted) {
    return null;
  }
  try {
    return decryptSecret(connection.accessTokenEncrypted);
  } catch {
    return connection.accessTokenEncrypted;
  }
}

export async function fanvueFetch(
  workspaceId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await loadAccessToken(workspaceId);
  if (!token) {
    return new Response(JSON.stringify({ error: "Fanvue not connected" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const url = `${env.FANVUE_API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Fanvue-API-Version": env.FANVUE_API_VERSION,
      ...(init.headers ?? {}),
    },
  });
}

export async function listAgencyChats(workspaceId: string, updatedAfter?: string) {
  const params = new URLSearchParams();
  if (updatedAfter) {
    params.set("updatedAfter", updatedAfter);
  }
  const suffix = params.size ? `?${params.toString()}` : "";
  return fanvueFetch(workspaceId, `/agencies/chats${suffix}`);
}

export async function listCreators(workspaceId: string) {
  return fanvueFetch(workspaceId, "/creators");
}

export async function listChatMessages(
  workspaceId: string,
  creatorUuid: string,
  fanUuid: string
) {
  return fanvueFetch(
    workspaceId,
    `/creators/${creatorUuid}/chats/${fanUuid}/messages?markAsRead=false`
  );
}

export async function sendChatMessage(
  workspaceId: string,
  creatorUuid: string,
  fanUuid: string,
  body: string
) {
  return fanvueFetch(workspaceId, `/creators/${creatorUuid}/chats/${fanUuid}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: body }),
  });
}