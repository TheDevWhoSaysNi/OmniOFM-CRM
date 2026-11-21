import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

type OAuthStatePayload = {
  provider: "fanvue" | "onlyfans";
  workspaceId: string;
  userId: string;
};

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export async function signOAuthState(payload: OAuthStatePayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyOAuthState(token: string): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      provider: payload.provider as OAuthStatePayload["provider"],
      workspaceId: String(payload.workspaceId),
      userId: String(payload.userId),
    };
  } catch {
    return null;
  }
}

export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
