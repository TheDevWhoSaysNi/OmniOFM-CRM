"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RegisterResponse = {
  error?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceKind, setWorkspaceKind] = useState<"AGENCY" | "CREATOR">("AGENCY");
  const [useQcBridge, setUseQcBridge] = useState(true);
  const [qcAgencyUuid, setQcAgencyUuid] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName,
          workspaceKind,
          useQcDataBridge: workspaceKind === "AGENCY" ? useQcBridge : false,
          qcAgencyUuid: qcAgencyUuid || undefined,
          displayName: displayName || undefined,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as RegisterResponse;
        setError(payload.error ?? "Unable to create account.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while creating account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Create workspace
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Start with an admin account and invite chatters later.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-200">Workspace type</span>
            <select
              value={workspaceKind}
              onChange={(event) => setWorkspaceKind(event.target.value as "AGENCY" | "CREATOR")}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="AGENCY">Agency (multi-creator)</option>
              <option value="CREATOR">Solo creator</option>
            </select>
          </label>

          {workspaceKind === "AGENCY" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useQcBridge}
                onChange={(event) => setUseQcBridge(event.target.checked)}
              />
              Use Omni Fanvue QC data bridge (recommended for Omni)
            </label>
          ) : null}

          {workspaceKind === "AGENCY" && useQcBridge ? (
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-700 dark:text-zinc-200">
                QC agency UUID (optional)
              </span>
              <input
                value={qcAgencyUuid}
                onChange={(event) => setQcAgencyUuid(event.target.value)}
                placeholder="Fanvue agency uuid for filtered bridge"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-200">Workspace name</span>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              required
              minLength={2}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-200">
              Your display name (optional)
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700 dark:text-zinc-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              required
              minLength={8}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Creating..." : "Create workspace"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
