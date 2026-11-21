"use client";

import { useEffect, useState } from "react";

type Integration = {
  id?: string;
  provider: "FANVUE" | "ONLYFANS" | "TELEGRAM";
  status: "DISCONNECTED" | "CONNECTED" | "ERROR";
  updatedAt: string;
};

type FunnelRule = {
  id: string;
  triggerKeyword: string;
  targetProvider: "FANVUE" | "ONLYFANS" | "TELEGRAM";
  targetLabel?: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [rules, setRules] = useState<FunnelRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("");

  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [targetProvider, setTargetProvider] = useState<"FANVUE" | "ONLYFANS" | "TELEGRAM">(
    "FANVUE"
  );
  const [targetLabel, setTargetLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  async function load() {
    setLoading(true);
    setNotice("");
    try {
      const [integrationResponse, rulesResponse] = await Promise.all([
        fetch("/api/integrations"),
        fetch("/api/telegram/funnel-rules"),
      ]);

      if (integrationResponse.ok) {
        const payload = (await integrationResponse.json()) as { integrations: Integration[] };
        setIntegrations(payload.integrations);
      }
      if (rulesResponse.ok) {
        const payload = (await rulesResponse.json()) as { rules: FunnelRule[] };
        setRules(payload.rules);
      }
    } catch {
      setNotice("Unable to load integration data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const displayIntegrations: Integration[] = (
    ["FANVUE", "ONLYFANS", "TELEGRAM"] as const
  ).map((provider) => {
    const existing = integrations.find((integration) => integration.provider === provider);
    return (
      existing ?? {
        provider,
        status: "DISCONNECTED",
        updatedAt: new Date(0).toISOString(),
      }
    );
  });

  function connectOAuth(provider: "fanvue" | "onlyfans") {
    window.location.href = `/api/integrations/${provider}/connect`;
  }

  async function disconnectIntegration(integrationId?: string) {
    if (!integrationId) {
      setNotice("No active integration to disconnect.");
      return;
    }

    const response = await fetch(`/api/integrations/disconnect/${integrationId}`, {
      method: "POST",
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Unable to disconnect integration.");
      return;
    }

    setNotice("Integration disconnected.");
    await load();
  }

  async function connectTelegram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/telegram/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botToken,
        botUsername: botUsername || undefined,
        webhookBaseUrl: webhookBaseUrl || undefined,
      }),
    });
    const payload = (await response.json()) as { error?: string; webhookUrl?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Unable to connect Telegram.");
      return;
    }
    setNotice(`Telegram connected. Set this webhook in BotFather: ${payload.webhookUrl}`);
    await load();
  }

  async function createRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/telegram/funnel-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        triggerKeyword,
        targetProvider,
        targetLabel: targetLabel || undefined,
        isDefault,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Unable to create funnel rule.");
      return;
    }

    setTriggerKeyword("");
    setTargetLabel("");
    setIsDefault(false);
    setNotice("Funnel rule created.");
    await load();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Integrations</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Connect Fanvue, OnlyFans, and Telegram for webhook-driven routing.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">OAuth connectors</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={() => connectOAuth("fanvue")}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Connect Fanvue
          </button>
          <button
            onClick={() => connectOAuth("onlyfans")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Connect OnlyFans
          </button>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {displayIntegrations.map((integration) => (
            <article
              key={integration.provider}
              className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <p className="text-sm font-medium">{integration.provider}</p>
              <p className="mt-1">
                <span
                  className={
                    integration.status === "CONNECTED"
                      ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                      : integration.status === "ERROR"
                        ? "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                        : "rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
                  }
                >
                  {integration.status}
                </span>
              </p>
              <div className="mt-3 flex gap-2">
                {integration.provider === "FANVUE" ? (
                  <button
                    onClick={() => connectOAuth("fanvue")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Reconnect
                  </button>
                ) : integration.provider === "ONLYFANS" ? (
                  <button
                    onClick={() => connectOAuth("onlyfans")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Reconnect
                  </button>
                ) : null}
                {integration.id ? (
                  <button
                    onClick={() => void disconnectIntegration(integration.id)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Telegram BotFather setup
        </h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={connectTelegram}>
          <label className="block text-sm">
            <span className="mb-1 block">Bot token</span>
            <input
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Bot username (optional)</span>
            <input
              value={botUsername}
              onChange={(event) => setBotUsername(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block">Webhook base URL (optional)</span>
            <input
              value={webhookBaseUrl}
              onChange={(event) => setWebhookBaseUrl(event.target.value)}
              placeholder="https://your-domain.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Save Telegram config
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Telegram funnel rules
        </h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createRule}>
          <label className="block text-sm">
            <span className="mb-1 block">Trigger keyword</span>
            <input
              value={triggerKeyword}
              onChange={(event) => setTriggerKeyword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Target provider</span>
            <select
              value={targetProvider}
              onChange={(event) =>
                setTargetProvider(event.target.value as "FANVUE" | "ONLYFANS" | "TELEGRAM")
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="FANVUE">Fanvue</option>
              <option value="ONLYFANS">OnlyFans</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Target label (optional)</span>
            <input
              value={targetLabel}
              onChange={(event) => setTargetLabel(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
            />
            Set as default fallback route
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Add funnel rule
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-3">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <p className="text-sm font-medium">
                &quot;{rule.triggerKeyword}&quot; -&gt; {rule.targetProvider}
                {rule.targetLabel ? ` (${rule.targetLabel})` : ""}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {rule.isDefault ? "Default route" : "Keyword route"} |{" "}
                {rule.isActive ? "Active" : "Inactive"}
              </p>
            </article>
          ))}
          {!rules.length && !loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              No funnel rules yet. Add one to route Telegram traffic.
            </p>
          ) : null}
        </div>
      </div>

      {notice ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
