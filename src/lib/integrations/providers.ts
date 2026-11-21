import { env } from "@/lib/env";

export const SUPPORTED_PROVIDERS = [
  "fanvue",
  "onlyfans",
  "fansly",
  "stacked",
  "telegram",
] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export function isSupportedProvider(value: string): value is SupportedProvider {
  return SUPPORTED_PROVIDERS.includes(value as SupportedProvider);
}

const FANVUE_AGENCY_SCOPES_DEFAULT = [
  "openid",
  "offline_access",
  "offline",
  "read:self",
  "read:agency",
  "read:creator",
  "read:insights",
  "read:chat",
  "read:fan",
  "write:chat",
].join(" ");

const FANVUE_CREATOR_SCOPES_DEFAULT = [
  "openid",
  "offline_access",
  "read:self",
  "read:creator",
  "read:insights",
  "read:chat",
  "read:fan",
  "write:chat",
].join(" ");

type OAuthProviderConfig = {
  provider: "fanvue" | "onlyfans";
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  redirectUri?: string;
  defaultScopes: string[];
};

export function getOAuthConfig(
  provider: "fanvue" | "onlyfans",
  options?: { agency?: boolean }
): OAuthProviderConfig {
  if (provider === "fanvue") {
    const agency = options?.agency !== false;
    return {
      provider,
      clientId: env.FANVUE_CLIENT_ID,
      clientSecret: env.FANVUE_CLIENT_SECRET,
      authorizationUrl: env.FANVUE_AUTHORIZATION_URL,
      tokenUrl: env.FANVUE_TOKEN_URL,
      redirectUri: env.FANVUE_REDIRECT_URI,
      defaultScopes: (
        agency
          ? env.FANVUE_AGENCY_SCOPES ?? FANVUE_AGENCY_SCOPES_DEFAULT
          : env.FANVUE_CREATOR_SCOPES ?? FANVUE_CREATOR_SCOPES_DEFAULT
      ).split(/\s+/),
    };
  }

  return {
    provider,
    clientId: env.ONLYFANS_CLIENT_ID,
    clientSecret: env.ONLYFANS_CLIENT_SECRET,
    authorizationUrl: env.ONLYFANS_AUTHORIZATION_URL,
    tokenUrl: env.ONLYFANS_TOKEN_URL,
    redirectUri: env.ONLYFANS_REDIRECT_URI,
    defaultScopes: ["read:messages"],
  };
}

export function getWebhookSecret(provider: "fanvue" | "onlyfans"): string | undefined {
  return provider === "fanvue" ? env.FANVUE_WEBHOOK_SECRET : env.ONLYFANS_WEBHOOK_SECRET;
}

export const COMING_SOON_PLATFORMS = ["fansly", "stacked"] as const;