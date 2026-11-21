"use client";

import { useEffect, useState } from "react";

type TeamUser = {
  id: string;
  email: string;
  displayName?: string | null;
  role: "ADMIN" | "MANAGER" | "CHATTER";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "PURGED";
  lastActiveAt?: string | null;
  scheduledPurgeAt?: string | null;
};

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"CHATTER" | "MANAGER" | "ADMIN">("CHATTER");

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        setNotice("Unable to load users.");
        return;
      }
      const payload = (await response.json()) as { users: TeamUser[] };
      setUsers(payload.users);
    } catch {
      setNotice("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName: displayName || undefined,
        role,
        sendInvite: true,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      temporaryPassword?: string;
      invite?: { token?: string };
    };

    if (!response.ok) {
      setNotice(payload.error ?? "Unable to create user.");
      return;
    }

    setEmail("");
    setDisplayName("");
    setRole("CHATTER");
    setNotice(
      payload.invite?.token
        ? `User created. Dev invite token: ${payload.invite.token}`
        : payload.temporaryPassword
          ? `User created. Dev temporary password: ${payload.temporaryPassword}`
          : "User created."
    );
    await loadUsers();
  }

  async function updateRole(userId: string, nextRole: TeamUser["role"]) {
    setNotice("");
    const response = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Unable to update role.");
      return;
    }
    setNotice("Role updated.");
    await loadUsers();
  }

  async function userAction(
    userId: string,
    action: "deactivate" | "reactivate" | "resend_invite"
  ) {
    setNotice("");
    const response = await fetch(`/api/users/${userId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = (await response.json()) as { error?: string; inviteToken?: string };
    if (!response.ok) {
      setNotice(payload.error ?? "Unable to run action.");
      return;
    }

    if (action === "resend_invite" && payload.inviteToken) {
      setNotice(`Invite regenerated. Dev token: ${payload.inviteToken}`);
    } else {
      setNotice(`Action completed: ${action}.`);
    }
    await loadUsers();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Team Management
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Create chatter accounts, invite new staff, and manage roles.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create user</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createUser}>
          <label className="block text-sm">
            <span className="mb-1 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Display name (optional)</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Role</span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "CHATTER" | "MANAGER" | "ADMIN")
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="CHATTER">Chatter</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="self-end">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create and invite
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Current team</h2>
        <div className="mt-4 grid gap-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">{user.email}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Status: {user.status}
                {user.scheduledPurgeAt
                  ? ` | Purge date: ${new Date(user.scheduledPurgeAt).toLocaleDateString()}`
                  : ""}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Last active:{" "}
                {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Unknown"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-300">Role:</span>
                <select
                  value={user.role}
                  onChange={(event) =>
                    void updateRole(user.id, event.target.value as TeamUser["role"])
                  }
                  className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="CHATTER">CHATTER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => void userAction(user.id, "deactivate")}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => void userAction(user.id, "reactivate")}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  Reactivate
                </button>
                <button
                  onClick={() => void userAction(user.id, "resend_invite")}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  Resend invite
                </button>
              </div>
            </article>
          ))}
          {!users.length && !loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">No users found.</p>
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
