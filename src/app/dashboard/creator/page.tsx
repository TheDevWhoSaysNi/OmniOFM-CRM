"use client";

import { useEffect, useState } from "react";

type CreatorRow = {
  uuid: string;
  handle: string | null;
  displayName: string | null;
  monthGrossCents?: number;
};

export default function CreatorDashboardPage() {
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [billing, setBilling] = useState<{
    month?: string;
    clients?: Array<{ grossCents: number }>;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const [metricsRes, billingRes] = await Promise.all([
        fetch("/api/metrics/fanvue"),
        fetch("/api/billing/summary"),
      ]);
      if (metricsRes.ok) {
        const body = (await metricsRes.json()) as { creators: CreatorRow[] };
        setCreators(body.creators ?? []);
      }
      if (billingRes.ok) {
        const body = (await billingRes.json()) as { billing: typeof billing };
        setBilling(body.billing ?? null);
      }
    })();
  }, []);

  const grossTotal =
    billing?.clients?.reduce((sum, row) => sum + (row.grossCents ?? 0), 0) ?? 0;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Creator metrics</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Read-only revenue and roster view. No chatter tools on this screen.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Month gross (agency)</p>
          <p className="mt-2 text-3xl font-semibold">${(grossTotal / 100).toFixed(2)}</p>
          <p className="mt-1 text-xs text-zinc-500">{billing?.month ?? "Current month"}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Creators on roster</p>
          <p className="mt-2 text-3xl font-semibold">{creators.length}</p>
        </article>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Roster</h2>
        <RosterList creators={creators} />
      </div>
    </section>
  );
}

function RosterList({ creators }: { creators: CreatorRow[] }) {
  return (
    <div className="mt-4 grid gap-2">
      {creators.map((creator) => (
        <RosterRow
          key={creator.uuid}
          label={creator.displayName || creator.handle || creator.uuid}
          value={
            creator.monthGrossCents != null
              ? `$${(creator.monthGrossCents / 100).toFixed(2)}`
              : "—"
          }
        />
      ))}
      {!creators.length ? <p className="text-sm text-zinc-500">No creators synced yet.</p> : null}
    </div>
  );
}

function RosterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
      <span>{label}</span>
      <span className="text-zinc-500">{value}</span>
    </div>
  );
}