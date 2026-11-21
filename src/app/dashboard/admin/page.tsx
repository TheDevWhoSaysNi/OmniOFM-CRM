"use client";

import { useEffect, useState } from "react";
import { PLATFORM_CONNECTORS } from "@/lib/platforms/connectors";

export default function AdminDashboardPage() {
  const [billing, setBilling] = useState<{ clients?: Array<{ handle: string | null; grossCents: number }> } | null>(null);
  const [hqStatus, setHqStatus] = useState("");

  useEffect(() => {
    void fetch("/api/billing/summary")
      .then((res) => res.json())
      .then((body) => setBilling(body.billing ?? null));
  }, []);

  async function syncHqHours() {
    const res = await fetch("/api/hq/sync-hours", { method: "POST" });
    const body = (await res.json()) as { shiftsUpdated?: number; error?: string };
    setHqStatus(
      res.ok
        ? `Updated ${body.shiftsUpdated ?? 0} open shifts from HQ.`
        : body.error ?? "HQ sync failed."
    );
  }

  const clientRows = billing?.clients ?? [];

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Agency admin</h1>

      <PlatformGrid />

      <BillingTable rows={clientRows} />

      <HqSync status={hqStatus} onSync={() => void syncHqHours()} />
    </section>
  );
}

function PlatformGrid() {
  return (
    <Panel title="Platform connectors">
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {PLATFORM_CONNECTORS.map((connector) => (
          <article
            key={connector.provider}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          >
            <p className="font-medium">{connector.label}</p>
            <p className="text-xs text-zinc-500">
              {connector.status === "live" ? "Available" : "Coming soon"} ·{" "}
              {connector.capabilities.join(", ")}
            </p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function BillingTable({
  rows,
}: {
  rows: Array<{ handle: string | null; grossCents: number }>;
}) {
  return (
    <Panel title="Commission preview">
      <div className="mt-4 space-y-2 text-sm">
        {rows.slice(0, 20).map((row, ni) => (
          <Line
            key={String(row.handle ?? ni)}
            left={row.handle ?? "Unknown"}
            right={`$${(row.grossCents / 100).toFixed(2)}`}
          />
        ))}
        {!rows.length ? <p className="text-zinc-500">Billing summary empty or bridge not configured.</p> : null}
      </div>
    </Panel>
  );
}

function HqSync({ status, onSync }: { status: string; onSync: () => void }) {
  return (
    <Panel title="HQ time sync">
      <p className="mt-2 text-sm text-zinc-600">Pull minutes from omniofm.com HQ into open shifts.</p>
      <button
        type="button"
        onClick={onSync}
        className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Sync HQ hours
      </button>
      {status ? <p className="mt-2 text-xs text-zinc-500">{status}</p> : null}
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Line({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between rounded border border-zinc-100 px-2 py-1 dark:border-zinc-800">
      <span>@{left}</span>
      <span>{right}</span>
    </div>
  );
}