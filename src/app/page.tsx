import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            OmniOFM CRM
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Creator agency operations</h1>
          <p className="mt-3 max-w-3xl text-zinc-600 dark:text-zinc-300">
            Stable web CRM for agencies and solo creators: Fanvue metrics, chatter focus mode, QC
            reporting, and holdco-friendly aggregates. Built for Omni first, multi-tenant ready.
          </p>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create workspace
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Open dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}