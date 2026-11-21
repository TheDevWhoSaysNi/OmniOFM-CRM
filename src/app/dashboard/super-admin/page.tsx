"use client";

import { useEffect, useState } from "react";

type SuperAdminUser = {
  id: string;
  workspaceId: string;
  email: string;
  displayName?: string | null;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "PURGED";
  lastActiveAt?: string | null;
  scheduledPurgeAt?: string | null;
};

type SuperAdminWorkspace = {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  lastActivityAt?: string | null;
};

type NotificationEntry = {
  id: string;
  channel: string;
  type: string;
  message: string;
  createdAt: string;
};

export default function SuperAdminPage() {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [workspaces, setWorkspaces] = useState<SuperAdminWorkspace[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/super-admin/overview");
      const payload = (await response.json()) as {
        users?: SuperAdminUser[];
        workspaces?: SuperAdminWorkspace[];
        notifications?: NotificationEntry[];
        error?: string;
      };
      if (!response.ok) {
        setNotice(payload.error ?? "Unable to load super admin data.");
        return;
      }
      setUsers(payload.users ?? []);
      setWorkspaces(payload.workspaces ?? []);
      setNotifications(payload.notifications ?? []);
    } catch {
      setNotice("Network error while loading super admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function userAction(
    userId: string,
    action: "suspend" | "reactivate" | "deactivate" | "purge" | "hard_delete"
  ) {
    const response = await fetch(`/api/super-admin/users/${userId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reason: reason || undefined,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Failed to apply user action.");
      return;
    }
    setNotice(`User action completed: ${action}`);
    await load();
  }

  async function workspaceAction(
    workspaceId: string,
    action: "suspend" | "reactivate" | "deactivate"
  ) {
    const response = await fetch(`/api/super-admin/workspaces/${workspaceId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reason: reason || undefined,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Failed to apply workspace action.");
      return;
    }
    setNotice(`Workspace action completed: ${action}`);
    await load();
  }

  async function runLifecycle() {
    const response = await fetch("/api/super-admin/lifecycle/run", {
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      warningsLogged?: number;
      deactivatedUsers?: number;
      purgedUsers?: number;
    };
    if (!response.ok) {
      setNotice(payload.error ?? "Lifecycle run failed.");
      return;
    }
    setNotice(
      `Lifecycle complete. Warnings: ${payload.warningsLogged ?? 0}, deactivated: ${payload.deactivatedUsers ?? 0}, purged: ${payload.purgedUsers ?? 0}.`
    );
    await load();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Super Admin Control Center
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Emergency lockouts, inactivity lifecycle, and account governance.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => void runLifecycle()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Run inactivity lifecycle now
          </button>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Refresh data
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-200">
            Action reason (applies to next action)
          </span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Emergency lockout, compliance review, etc."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Workspaces</h2>
        <div className="mt-4 grid gap-4">
          {workspaces.map((workspace) => (
            <article
              key={workspace.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {workspace.name}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Status: {workspace.status} | Last activity:{" "}
                    {workspace.lastActivityAt
                      ? new Date(workspace.lastActivityAt).toLocaleString()
                      : "No data"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void workspaceAction(workspace.id, "suspend")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => void workspaceAction(workspace.id, "reactivate")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => void workspaceAction(workspace.id, "deactivate")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!workspaces.length && !loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">No workspaces found.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Users</h2>
        <div className="mt-4 grid gap-4">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {user.email} | {user.role} | {user.status}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Last active:{" "}
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Unknown"}
                    {user.scheduledPurgeAt
                      ? ` | Purge: ${new Date(user.scheduledPurgeAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void userAction(user.id, "suspend")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => void userAction(user.id, "reactivate")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => void userAction(user.id, "deactivate")}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => void userAction(user.id, "purge")}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:text-red-300"
                  >
                    Purge
                  </button>
                  <button
                    onClick={() => void userAction(user.id, "hard_delete")}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:text-red-300"
                  >
                    Hard delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!users.length && !loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">No users found.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Inactivity notifications
        </h2>
        <div className="mt-4 grid gap-3">
          {notifications.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-700"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {item.type} via {item.channel}
              </p>
              <p className="text-zinc-600 dark:text-zinc-300">{item.message}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
          {!notifications.length && !loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">No notification logs yet.</p>
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
