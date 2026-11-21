import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "QC"
  | "CHATTER"
  | "CREATOR_VIEW";

export type SessionPayload = {
  sub: string;
  workspaceId: string;
  role: UserRole;
  email: string;
};

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      workspaceId: String(payload.workspaceId),
      role: payload.role as SessionPayload["role"],
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}