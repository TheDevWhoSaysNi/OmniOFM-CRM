import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { badRequest } from "@/lib/http";
import { env } from "@/lib/env";
import { isSupportedProvider, getOAuthConfig } from "@/lib/integrations/providers";
import { verifyOAuthState } from "@/lib/integrations/oauth";
import { encryptSecret } from "@/lib/crypto/tokens";
import { prisma } from "@/lib/prisma";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  [key: string]: unknown;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  if (!isSupportedProvider(provider) || provider === "telegram") {
    return badRequest("Unsupported provider callback.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");

  if (!code || !stateToken) {
    return badRequest("Missing code or state.");
  }

  const state = await verifyOAuthState(stateToken);
  if (!state || state.provider !== provider) {
    return badRequest("Invalid OAuth state.");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: state.workspaceId },
    select: { kind: true },
  });
  const oauth = getOAuthConfig(provider as "fanvue" | "onlyfans", {
    agency: workspace?.kind !== "CREATOR",
  });
  if (!oauth.tokenUrl || !oauth.clientId || !oauth.clientSecret || !oauth.redirectUri) {
    return NextResponse.json(
      { error: `${provider} OAuth server config is incomplete.` },
      { status: 501 }
    );
  }

  const verifier = (await cookies()).get(`omniofm_pkce_${provider}`)?.value;
  if (!verifier) {
    return badRequest("Missing PKCE verifier.");
  }

  const tokenResponse = await fetch(oauth.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: oauth.redirectUri,
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    return NextResponse.json(
      { error: "Token exchange failed.", provider, details: errorBody },
      { status: 400 }
    );
  }

  const tokens = (await tokenResponse.json()) as TokenResponse;
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const prismaProvider = provider === "fanvue" ? "FANVUE" : "ONLYFANS";

  await prisma.integrationConnection.upsert({
    where: {
      workspaceId_provider_externalAccountId: {
        workspaceId: state.workspaceId,
        provider: prismaProvider,
        externalAccountId: "primary",
      },
    },
    create: {
      workspaceId: state.workspaceId,
      provider: prismaProvider,
      status: "CONNECTED",
      externalAccountId: "primary",
      accessTokenEncrypted: encryptSecret(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token
        ? encryptSecret(tokens.refresh_token)
        : null,
      tokenExpiresAt: expiresAt,
      scopes: tokens.scope ? tokens.scope.split(" ") : undefined,
      metadata: {
        connectedByUserId: state.userId,
      },
    },
    update: {
      status: "CONNECTED",
      accessTokenEncrypted: encryptSecret(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token
        ? encryptSecret(tokens.refresh_token)
        : null,
      tokenExpiresAt: expiresAt,
      scopes: tokens.scope ? tokens.scope.split(" ") : undefined,
      metadata: {
        connectedByUserId: state.userId,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  await prisma.platformAccount.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: state.workspaceId,
        provider: prismaProvider,
      },
    },
    create: {
      workspaceId: state.workspaceId,
      provider: prismaProvider,
      status: "CONNECTED",
      capabilities: provider === "fanvue" ? ["METRICS", "INBOX"] : ["METRICS"],
    },
    update: {
      status: "CONNECTED",
      lastError: null,
    },
  });

  const base = env.APP_BASE_URL.replace(/\/$/, "");
  return NextResponse.redirect(`${base}/dashboard/integrations?oauth=connected`);
}