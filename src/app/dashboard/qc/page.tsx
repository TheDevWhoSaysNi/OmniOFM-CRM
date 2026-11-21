"use client";

import { useEffect, useState } from "react";

type LeaderboardRow = {
  userId: string;
  displayName: string;
  messageCount: number;
  messageGrossCents: number;
};

type OverviewMetrics = {
  activeSessions: number;
  messagesTotal: number;
};

export default function QcDashboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);

  useEffect(() => {
    void (async () => {
      const [fanvueRes, overviewRes] = await Promise.all([
        fetch("/api/metrics/fanvue"),
        fetch("/api/metrics/overview"),
      ]);
      if (fanvueRes.ok) {
        const body = (await fanvueRes.json()) as { leaderboard: LeaderboardRow[] };
        setLeaderboard(body.leaderboard ?? []);
      }
      if (overviewRes.ok) {
        setOverview((await overviewRes.json()) as OverviewMetrics);
      }
    })();
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">QC and management</h1>
      <p className="text-sm text-zinc-600">
        Compare chatter output, open shifts, and Fanvue leaderboard rows (QC warehouse when bridged).
      </p>

      <Stats activeSessions={overview?.activeSessions ?? 0} messages={overview?.messagesTotal ?? 0} />

      <LeaderboardBoard rows={leaderboard} />
    </section>
  );
}

function Stats({ activeSessions, messages }: { activeSessions: number; messages: number }) {
  return (
    <StatGrid
      items={[
        { label: "Active shifts", value: activeSessions },
        { label: "Logged messages (CRM)", value: messages },
      ]}
    />
  );
}

function LeaderboardBoard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Section title="Chatter leaderboard">
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <LeaderRow
            key={row.userId}
            name={row.displayName}
            detail={`${row.messageCount} msgs · $${(row.messageGrossCents / 100).toFixed(2)} PPV ask`}
          />
        ))}
        {!rows.length ? <p className="text-sm text-zinc-500">Leaderboard loads from Fanvue QC bridge.</p> : null}
      </div>
    </Section>
  );
}

function StatGrid({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={String(item.value)} />
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function LeaderRow({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
      <span className="font-medium">{name}</span>
      <span className="text-sm text-zinc-500">{detail}</span>
    </div>
  );
}