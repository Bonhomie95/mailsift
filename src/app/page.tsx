import SorterTabs from "@/components/SorterTabs";
import AdsterraBanner from "@/components/AdsterraBanner";
import AdsterraPopup from "@/components/AdsterraPopup";
import ThemeToggle from "@/components/ThemeToggle";

// Adsterra ad-unit keys (public — they ship in client HTML on every Adsterra
// site). Env vars override these if set.
const BANNER_728 = process.env.NEXT_PUBLIC_ADSTERRA_BANNER1_KEY || "b0987eb7f856c1f57e2167916a7b28dd";
const BANNER_300 = process.env.NEXT_PUBLIC_ADSTERRA_BANNER2_KEY || "703b5756d57b1d7a3802ab0555224184";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-5 sm:py-10">
      <header className="mb-6 flex items-center justify-between sm:mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 text-lg shadow-lg shadow-brand-500/30">
            📬
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">MailSift</h1>
            <p className="text-xs text-fg/40">Sort domains by mail provider &amp; country</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300 light:text-emerald-700 sm:inline">
            Free · 20k / 6 hours
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mb-6 animate-fade-up sm:mb-8">
        <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-4xl">
          Drop in <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">thousands of leads</span>.
          Sort them by mail provider or by country in seconds.
        </h2>
        <p className="mt-3 max-w-2xl text-fg/50">
          MailSift reads live <strong className="text-fg/70">MX</strong> and{" "}
          <strong className="text-fg/70">NS</strong> records to figure out who hosts each
          domain&rsquo;s email — Google Workspace, Microsoft 365, Zoho and more — or which{" "}
          <strong className="text-fg/70">country</strong> a lead is in, so you know the local time
          and the best moment to reach them. Paste a list or upload CSV / TXT / XLSX.
        </p>
      </section>

      {/* Banner #1 — leaderboard above the tool. Hidden on phones: 728px would
          overflow, and the 300×250 below covers mobile inventory. */}
      <div className="mb-6 hidden justify-center md:flex">
        <AdsterraBanner adKey={BANNER_728} width={728} height={90} label="Ad slot · leaderboard 728×90" />
      </div>

      <SorterTabs />

      {/* Banner #2 — rectangle below the tool */}
      <div className="mt-8 flex justify-center">
        <AdsterraBanner adKey={BANNER_300} width={300} height={250} label="Ad slot · rectangle 300×250" />
      </div>

      <footer className="mt-16 border-t border-fg/10 pt-6 text-center text-xs text-fg/30">
        MailSift · Free tier: 20,000 domains per rolling 6 hours, one tab at a time. Paid plans coming soon.
      </footer>

      {/* Popunder, capped to once / 30 min */}
      <AdsterraPopup />
    </main>
  );
}
