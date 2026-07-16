"use client";

import { useEffect, useState } from "react";

interface ProviderRow {
  id: string;
  name: string;
  category: string;
  matchOn: string;
  mxPatterns: string[];
  nsPatterns: string[];
  priority: number;
  color: string;
  source: "seed" | "custom";
}

interface ApiKeyRow {
  id: string;
  label: string;
  preview: string;
  active: boolean;
  created_at: string;
  last_used: string | null;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    mxPatterns: "",
    nsPatterns: "",
    priority: "5",
    color: "#6d5efc",
  });

  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [keyLabel, setKeyLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/providers");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const j = await res.json();
    setAuthed(true);
    setDbConfigured(j.dbConfigured);
    setProviders(j.providers);
    const kr = await fetch("/api/admin/keys");
    if (kr.ok) setKeys((await kr.json()).keys || []);
  }

  async function createKey() {
    setNewKey(null);
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: keyLabel }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(j.error || "Could not create key.");
      return;
    }
    setNewKey(j.key);
    setKeyLabel("");
    refresh();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/admin/keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLoginError(j.error || "Login failed.");
      return;
    }
    setPassword("");
    refresh();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
  }

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/providers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(j.error || "Failed to add provider.");
      return;
    }
    setMsg(`Saved “${form.name}”.`);
    setForm({ name: "", category: "", mxPatterns: "", nsPatterns: "", priority: "5", color: "#6d5efc" });
    refresh();
  }

  async function del(id: string) {
    await fetch(`/api/admin/providers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    refresh();
  }

  const [seeding, setSeeding] = useState(false);
  async function syncSeed() {
    setSeeding(true);
    setMsg(null);
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setSeeding(false);
    if (!res.ok) {
      setMsg(j.error || "Sync failed.");
      return;
    }
    setMsg(`Synced ${j.seeded} built-in providers into the database — all editable now.`);
    refresh();
  }

  if (authed === null) {
    return <div className="p-10 text-center text-fg/40">Loading…</div>;
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
        <h1 className="mb-1 text-2xl font-bold">MailSift Admin</h1>
        <p className="mb-6 text-sm text-fg/40">Enter the admin password to manage providers.</p>
        <form onSubmit={login} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-lg border border-fg/15 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          {loginError && <p className="text-sm text-red-300 light:text-red-600">{loginError}</p>}
          <button className="w-full rounded-lg bg-brand-500 px-3 py-2.5 font-semibold hover:bg-brand-400">
            Sign in
          </button>
        </form>
        <a href="/" className="mt-6 text-center text-xs text-fg/40 hover:text-fg/70">
          ← Back to sorter
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MailSift Admin</h1>
          <p className="text-sm text-fg/40">Manage mail-provider matching rules.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="text-fg/50 hover:text-fg/80">
            View sorter
          </a>
          <button onClick={logout} className="text-fg/50 hover:text-fg/80">
            Log out
          </button>
        </div>
      </header>

      {!dbConfigured && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 light:text-amber-800">
          ⚠️ Supabase isn&rsquo;t configured, so you&rsquo;re viewing the built-in seed rules only.
          Set <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> to add or edit
          providers.
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-fg/10 bg-ink-800/60 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-fg/60">
          Add / update provider
        </h2>
        <form onSubmit={addProvider} className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Name (e.g. Namecheap Private Email)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-fg/15 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            placeholder="Category (e.g. Namecheap)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-fg/15 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            placeholder="MX patterns (comma or newline) e.g. privateemail.com"
            value={form.mxPatterns}
            onChange={(e) => setForm({ ...form, mxPatterns: e.target.value })}
            className="rounded-lg border border-fg/15 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            placeholder="NS patterns (comma or newline) e.g. registrar-servers.com"
            value={form.nsPatterns}
            onChange={(e) => setForm({ ...form, nsPatterns: e.target.value })}
            className="rounded-lg border border-fg/15 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-fg/40">Priority</label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-20 rounded-lg border border-fg/15 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <label className="text-xs text-fg/40">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 w-12 rounded border border-fg/15 bg-ink-900"
            />
          </div>
          <button
            disabled={!dbConfigured}
            className="rounded-lg bg-brand-500 px-3 py-2 font-semibold hover:bg-brand-400 disabled:opacity-40"
          >
            Save provider
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-fg/60">{msg}</p>}
      </section>

      <section className="rounded-2xl border border-fg/10 bg-ink-800/60 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">
            Active providers · {providers.length}
          </h2>
          {dbConfigured && (
            <button
              onClick={syncSeed}
              disabled={seeding}
              className="rounded-lg border border-fg/15 bg-fg/5 px-3 py-1.5 text-xs text-fg/80 hover:bg-fg/10 disabled:opacity-40"
              title="Copy all built-in providers into the database so they become editable"
            >
              {seeding ? "Syncing…" : "⬆ Sync built-ins to database"}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-2"
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg/90">{p.name}</span>
                  <span className="rounded bg-fg/10 px-1.5 py-0.5 text-[10px] uppercase text-fg/40">
                    {p.source}
                  </span>
                </div>
                <div className="truncate text-xs text-fg/40">
                  {p.matchOn.toUpperCase()} · {[...p.mxPatterns, ...p.nsPatterns].join(", ") || "—"}
                </div>
              </div>
              {p.source === "custom" && (
                <button
                  onClick={() => del(p.id)}
                  className="text-xs text-red-300 light:text-red-600/70 hover:text-red-300 light:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-fg/10 bg-ink-800/60 p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-fg/60">API keys</h2>
        <p className="mb-4 text-xs text-fg/40">
          Give a key to programmatic callers. They pass{" "}
          <code className="rounded bg-fg/10 px-1">Authorization: Bearer &lt;key&gt;</code> to{" "}
          <code className="rounded bg-fg/10 px-1">POST /api/sort</code> and skip the free rate limit.
        </p>

        {!dbConfigured && (
          <p className="mb-3 text-xs text-amber-300 light:text-amber-700">Requires Supabase (and the <code>api_keys</code> table).</p>
        )}

        {newKey && (
          <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm">
            <p className="mb-1 text-emerald-300 light:text-emerald-700">Copy this key now — it won&rsquo;t be shown again:</p>
            <code className="block break-all rounded bg-fg/[0.08] p-2 text-xs text-fg/90">{newKey}</code>
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <input
            value={keyLabel}
            onChange={(e) => setKeyLabel(e.target.value)}
            placeholder="Label (e.g. Zapier integration)"
            className="flex-1 rounded-lg border border-fg/15 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <button
            onClick={createKey}
            disabled={!dbConfigured}
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold hover:bg-brand-400 disabled:opacity-40"
          >
            Generate key
          </button>
        </div>

        <div className="space-y-2">
          {keys.length === 0 && <p className="text-xs text-fg/30">No API keys yet.</p>}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg/90">{k.label}</span>
                  {!k.active && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] uppercase text-red-300 light:text-red-600">revoked</span>}
                </div>
                <div className="truncate text-xs text-fg/40">
                  {k.preview} · created {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used ? ` · last used ${new Date(k.last_used).toLocaleDateString()}` : " · never used"}
                </div>
              </div>
              {k.active && (
                <button onClick={() => revokeKey(k.id)} className="text-xs text-red-300 light:text-red-600/70 hover:text-red-300 light:text-red-600">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
