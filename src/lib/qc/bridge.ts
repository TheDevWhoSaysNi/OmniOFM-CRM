import { env } from "@/lib/env";

export type QcCreatorsResponse = {
  creators: Array<{
    uuid: string;
    handle: string | null;
    displayName: string | null;
    monthGrossCents?: number;
  }>;
};

export type QcChatterLeaderboardRow = {
  userId: string;
  displayName: string;
  messageGrossCents: number;
  tipGrossCents: number;
  messageCount: number;
};

export type QcBillingSummary = {
  month: string;
  clients: Array<{
    creatorUuid: string;
    handle: string | null;
    grossCents: number;
    netCents: number;
  }>;
};

function qcHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (env.QC_BRIDGE_SERVICE_TOKEN) {
    headers["X-Crm-Service-Token"] = env.QC_BRIDGE_SERVICE_TOKEN;
  }
  return headers;
}

function bridgeUrl(path: string, agencyUuid?: string | null): string {
  const base = (env.QC_BRIDGE_BASE_URL ?? "https://fanvue-qc.omniofm.com").replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  if (agencyUuid) {
    url.searchParams.set("agency", agencyUuid);
  }
  return url.toString();
}

async function fetchQc<T>(path: string, agencyUuid?: string | null): Promise<T | null> {
  if (!env.QC_BRIDGE_BASE_URL && !env.QC_BRIDGE_SERVICE_TOKEN) {
    return null;
  }
  try {
    const res = await fetch(bridgeUrl(path, agencyUuid), {
      headers: qcHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchQcCreators(agencyUuid?: string | null) {
  return fetchQc<QcCreatorsResponse>("/api/crm/creators", agencyUuid);
}

export async function fetchQcLeaderboard(agencyUuid?: string | null) {
  return fetchQc<{ leaderboard: QcChatterLeaderboardRow[] }>(
    "/api/crm/chatter-leaderboard",
    agencyUuid
  );
}

export async function fetchQcBillingSummary(agencyUuid?: string | null, month?: string) {
  const base = (env.QC_BRIDGE_BASE_URL ?? "https://fanvue-qc.omniofm.com").replace(/\/$/, "");
  const url = new URL(`${base}/api/crm/billing-summary`);
  if (agencyUuid) {
    url.searchParams.set("agency", agencyUuid);
  }
  if (month) {
    url.searchParams.set("month", month);
  }
  if (!env.QC_BRIDGE_BASE_URL && !env.QC_BRIDGE_SERVICE_TOKEN) {
    return null;
  }
  try {
    const res = await fetch(url.toString(), { headers: qcHeaders(), cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as QcBillingSummary;
  } catch {
    return null;
  }
}

export async function fetchQcChatterMessageCount(params: {
  agencyUuid?: string | null;
  chatterAlias: string;
  sinceIso: string;
  untilIso?: string;
}): Promise<number | null> {
  const base = (env.QC_BRIDGE_BASE_URL ?? "https://fanvue-qc.omniofm.com").replace(/\/$/, "");
  const url = new URL(`${base}/api/crm/chatter-message-count`);
  if (params.agencyUuid) {
    url.searchParams.set("agency", params.agencyUuid);
  }
  url.searchParams.set("alias", params.chatterAlias);
  url.searchParams.set("since", params.sinceIso);
  if (params.untilIso) {
    url.searchParams.set("until", params.untilIso);
  }
  try {
    const res = await fetch(url.toString(), { headers: qcHeaders(), cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as { count?: number };
    return typeof body.count === "number" ? body.count : null;
  } catch {
    return null;
  }
}