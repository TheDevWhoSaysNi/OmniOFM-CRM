import { env } from "@/lib/env";

export function isSuperAdminEmail(email: string): boolean {
  const allowed = env.SUPER_ADMIN_EMAILS?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed?.length) {
    return false;
  }

  return allowed.includes(email.toLowerCase());
}
