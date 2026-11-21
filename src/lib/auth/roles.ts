import type { SessionPayload, UserRole } from "@/lib/auth/jwt";

const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/dashboard/admin",
  MANAGER: "/dashboard/qc",
  QC: "/dashboard/qc",
  CHATTER: "/dashboard/chatter",
  CREATOR_VIEW: "/dashboard/creator",
};

export function homePathForRole(role: UserRole): string {
  return ROLE_HOME[role] ?? "/dashboard";
}

export function hasRequiredRole(
  role: SessionPayload["role"],
  allowed: SessionPayload["role"][]
): boolean {
  return allowed.includes(role);
}

export function roleAtLeastManager(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "QC";
}

export function roleCanManageIntegrations(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function roleCanManageTeam(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}