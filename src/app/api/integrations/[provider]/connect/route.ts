import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { getSession } from "@/lib/auth/session";
import { roleCanManageIntegrations } from "@/lib/auth/roles";
import { isSupportedProvider, getOAuthConfig } from "@/lib/integrations/providers";
import { generatePkcePair, signOAuthState } from "@/lib/integrations/oauth";
import { prisma } from "@/lib/prisma";

const searchSchema = z.object({
  scopes: z.string().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  if (!isSupportedProvider(provider)) {
    return badRequest("Unsupported provider.");
  }

  if (provider === "telegram" || provider === "fansly" || provider === "stacked") {
    return NextResponse.json({
      message:
        provider === "telegram"
          ? "Telegram is configured via /api/telegram/connect with BotFather token details."
          : `${provider} connector is coming soon. Metrics shell is available in Integrations.`,
    });
  }

  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!roleCanManageIntegrations(session.role)) {
    return forbidden();
  }

  const query = searchSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!query.success) {
    return badRequest("Invalid query parameters.", query.error.flatten());
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: { kind: true },
  });
  const agency = workspace?.kind !== "CREATOR";
  const oauth = getOAuthConfig(provider as "fanvue" | "onlyfans", { agency });
  if (!oauth.authorizationUrl || !oauth.clientId || !oauth.redirectUri) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured on the server.` },
      { status: 501 }
    );
  }

  const state = await signOAuthState({
    provider: provider as "fanvue" | "onlyfans",
    workspaceId: session.workspaceId,
    userId: session.sub,
  });

  const { verifier, challenge } = generatePkcePair();
  const scopes = query.data.scopes ?? oauth.defaultScopes.join(" ");

  const authUrl = new URL(oauth.authorizationUrl);
  authUrl.searchParams.set("client_id", oauth.clientId);
  authUrl.searchParams.set("redirect_uri", oauth.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", challenge);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set({
    name: `omniofm_pkce_${provider}`,
    value: verifier,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}