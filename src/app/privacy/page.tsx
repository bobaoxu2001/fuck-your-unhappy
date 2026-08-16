import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Unhappy Buster",
  description: "What Unhappy Buster stores, what it sends to AI, and what it never keeps.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#FFE4F3_0,#FAF5FF_34%,#E0F2FE_100%)] px-4 py-8 text-gray-950">
      <article className="mx-auto w-full max-w-2xl rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5 md:p-8">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-brand-yellow ring-2 ring-white">
            <Image src="/stress-goblin.webp" alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-purple">Unhappy Buster</p>
            <h1 className="font-display text-4xl leading-none tracking-wide">Privacy</h1>
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold leading-relaxed text-gray-600">
          This is a private stress arcade, not an account product. The short version: your raw vent stays off the victory card, off the challenge link, and off this device&apos;s saved history.
        </p>

        <section className="mt-6 space-y-4 text-sm font-semibold leading-relaxed text-gray-700">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-purple">What stays on this device</h2>
            <p className="mt-1">
              Streak counts, fictional monster labels, bounded play stats, unlocks, a voice preference, allowlisted aggregate event counters, and two random anonymous identifiers (an installation ID and a per-tab session ID). These live in your browser&apos;s local or session storage. They are not synced to an Unhappy Buster account, because there is no account.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-purple">What is never stored</h2>
            <p className="mt-1">
              Raw vent text is not written to local storage, share cards, challenge URLs, or analytics payloads. Clearing the Field Guide deletes the device-side counters, streaks, voice preference, and collection.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-purple">What is sent to generate a boss</h2>
            <p className="mt-1">
              If an API key is configured on the server, a redacted, fictionalized description of the situation is sent to OpenAI to write monster copy and, optionally, a cartoon portrait. Names, emails, and phone-like strings are stripped first. Sensitive inputs are blocked and never sent. If no key is configured, a curated offline monster is used instead.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-purple">Anonymous product analytics (production only)</h2>
            <p className="mt-1">
              Only when the deployed app has analytics enabled, Unhappy Buster sends a small set of anonymous product events to its own storage (our Upstash Redis instance — no third-party analytics provider, no advertising network). Each event carries the random installation and session IDs above, a timestamp, the event name, and at most a few bounded labels. The event names are: visit, start, boss revealed, arena started, arena completed (with outcome, duration bucket, and boss source), and share. The bounded labels are: boss source (daily / custom / challenge / scenario), live-AI vs curated-fallback generation, and UTM campaign labels when a link included them.
            </p>
            <p className="mt-1">
              Analytics never receives your vent text, redacted vent text, boss-generation prompts, names, emails, phone numbers, boss descriptions derived from your vent, share-card text, or AI responses. There are no cookies, no fingerprinting, and no profiles. Counters are kept for about 95 days. The &quot;Clear data&quot; control in the Field Guide resets your local anonymous identifiers; previously sent counters simply remain as aggregate counts.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-purple">Sharing</h2>
            <p className="mt-1">
              Optional share cards and challenge links contain only a public fictional boss and, sometimes, a 1–300 second benchmark. They cannot carry your vent or identity.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-purple">This is not therapy</h2>
            <p className="mt-1">
              Unhappy Buster is a short comedy reset. It is not medical care, crisis support, or a record of your mental health. If you are in danger or thinking about harming yourself, contact local emergency services or a crisis line such as 988 in the US and Canada.
            </p>
          </div>
        </section>

        <Link
          href="/"
          className="generate-btn mt-7 inline-flex min-h-12 items-center rounded-full px-5 text-sm font-black uppercase tracking-wide text-black shadow"
        >
          Back to the arena
        </Link>
      </article>
    </main>
  );
}
