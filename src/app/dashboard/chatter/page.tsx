"use client";

import { useEffect, useState } from "react";

type Assignment = {
  id: string;
  creator: { id: string; handle: string | null; displayName: string | null; externalUuid: string };
};

type FanvueChat = {
  uuid?: string;
  creatorUuid?: string;
  fanUuid?: string;
  preview?: string;
};

export default function ChatterFocusPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [chats, setChats] = useState<FanvueChat[]>([]);
  const [selected, setSelected] = useState<FanvueChat | null>(null);
  const [messages, setMessages] = useState<unknown[]>([]);
  const [draft, setDraft] = useState("");
  const [clockStatus, setClockStatus] = useState("");
  const [notice, setNotice] = useState("");

  async function loadAssignments() {
    const res = await fetch("/api/creators/assignments");
    if (res.ok) {
      const body = (await res.json()) as { assignments: Assignment[] };
      setAssignments(body.assignments);
    }
  }

  async function loadChats() {
    const res = await fetch("/api/fanvue/conversations");
    if (!res.ok) {
      return;
    }
    const body = (await res.json()) as { data?: FanvueChat[] };
    setChats(Array.isArray(body.data) ? body.data : []);
  }

  async function loadMessages(chat: FanvueChat) {
    if (!chat.creatorUuid || !chat.fanUuid) {
      return;
    }
    const params = new URLSearchParams({
      creatorUuid: chat.creatorUuid,
      fanUuid: chat.fanUuid,
    });
    const res = await fetch(`/api/fanvue/messages?${params.toString()}`);
    if (res.ok) {
      const body = (await res.json()) as { data?: unknown[] };
      setMessages(Array.isArray(body.data) ? body.data : []);
    }
  }

  async function clock(action: "in" | "out") {
    const res = await fetch("/api/activity/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = (await res.json()) as { error?: string };
    setClockStatus(res.ok ? (action === "in" ? "On shift." : "Shift ended.") : body.error ?? "Clock failed.");
  }

  async function sendMessage() {
    if (!selected?.creatorUuid || !selected.fanUuid || !draft.trim()) {
      return;
    }
    const res = await fetch("/api/fanvue/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorUuid: selected.creatorUuid,
        fanUuid: selected.fanUuid,
        text: draft.trim(),
      }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setNotice(body.error ?? "Send failed.");
      return;
    }
    setDraft("");
    await loadMessages(selected);
  }

  useEffect(() => {
    void loadAssignments();
    void loadChats();
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold">Chatter focus</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void clock("in")}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Clock in
          </button>
          <button
            type="button"
            onClick={() => void clock("out")}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-700"
          >
            Clock out
          </button>
        </div>
        {clockStatus ? <p className="text-xs text-zinc-600">{clockStatus}</p> : null}
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">Assigned creators</p>
          <ul className="mt-2 space-y-1 text-sm">
            {assignments.map((row) => (
              <li key={row.id}>
                @{row.creator.handle ?? row.creator.externalUuid.slice(0, 8)}
              </li>
            ))}
            {!assignments.length ? <li className="text-zinc-500">No assignments yet.</li> : null}
          </ul>
        </div>
      </aside>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500">Inbox queue</h2>
          <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto text-sm">
            {chats.map((chat) => (
              <li key={String(chat.uuid ?? `${chat.creatorUuid}-${chat.fanUuid}`)}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(chat);
                    void loadMessages(chat);
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <p className="font-medium">{chat.preview ?? "Conversation"}</p>
                </button>
              </li>
            ))}
            {!chats.length ? <li className="text-zinc-500">Connect Fanvue inbox to load chats.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500">Conversation</h2>
          <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto text-sm">
            {messages.map((msg, ni) => (
              <li key={ni} className="rounded border border-zinc-100 px-2 py-1 dark:border-zinc-800">
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(msg)}</pre>
              </li>
            ))}
            {!messages.length ? <li className="text-zinc-500">Select a conversation.</li> : null}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a reply..."
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Send
            </button>
          </div>
          {notice ? <p className="mt-2 text-xs text-red-600">{notice}</p> : null}
        </div>
      </div>
    </section>
  );
}