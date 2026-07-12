import Sorter from "@/components/Sorter";
import AdsterraBanner from "@/components/AdsterraBanner";
import AdsterraPopup from "@/components/AdsterraPopup";

// Adsterra ad-unit keys (public — they ship in client HTML on every Adsterra
// site). Env vars override these if set.
const BANNER_728 = process.env.NEXT_PUBLIC_ADSTERRA_BANNER1_KEY || "b0987eb7f856c1f57e2167916a7b28dd";
const BANNER_300 = process.env.NEXT_PUBLIC_ADSTERRA_BANNER2_KEY || "703b5756d57b1d7a3802ab0555224184";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 text-lg shadow-lg shadow-brand-500/30">
            📬
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MailSift</h1>
            <p className="text-xs text-white/40">Sort domains by mail provider</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300 sm:inline">
            Free · 20k / 6 hours
          </span>
          <a href="/admin" className="text-white/50 hover:text-white/80">
            Admin
          </a>
        </div>
      </header>

      <section className="mb-8 animate-fade-up">
        <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Drop in <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">thousands of domains</span>.
          Get them sorted by mail provider in seconds.
        </h2>
        <p className="mt-3 max-w-2xl text-white/50">
          MailSift reads live <strong className="text-white/70">MX</strong> and{" "}
          <strong className="text-white/70">NS</strong> records to figure out who really hosts each
          domain&rsquo;s email — Google Workspace, Microsoft 365, Zoho, Namecheap Private Email and
          more — then buckets them for you. Paste a list or upload CSV / TXT / XLSX.
        </p>
      </section>

      {/* Banner #1 — leaderboard above the tool */}
      <div className="mb-6 flex justify-center">
        <AdsterraBanner adKey={BANNER_728} width={728} height={90} label="Ad slot · leaderboard 728×90" />
      </div>

      <Sorter />

      {/* Banner #2 — rectangle below the tool */}
      <div className="mt-8 flex justify-center">
        <AdsterraBanner adKey={BANNER_300} width={300} height={250} label="Ad slot · rectangle 300×250" />
      </div>

      <footer className="mt-16 border-t border-white/10 pt-6 text-center text-xs text-white/30">
        MailSift · Free tier: 20,000 domains per rolling 6 hours, one tab at a time. Paid plans coming soon.
      </footer>

      {/* Popunder, capped to once / 30 min */}
      <AdsterraPopup />
    </main>
  );
}
