import { env } from "@/lib/env";

export type HqHoursRow = {
  userEmail: string;
  minutes: number;
  workDate: string;
};

export async function fetchHqHoursSince(isoDate: string): Promise<HqHoursRow[]> {
  if (!env.HQ_API_BASE_URL || !env.HQ_SHARED_SECRET) {
    return [];
  }
  const url = new URL(`${env.HQ_API_BASE_URL.replace(/\/$/, "")}/api/crm/hours`);
  url.searchParams.set("since", isoDate);
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Crm-Hq-Secret": env.HQ_SHARED_SECRET,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  const body = (await res.json()) as { rows?: HqHoursRow[] };
  return Array.isArray(body.rows) ? body.rows : [];
}