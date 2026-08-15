"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LocalProgress } from "@/lib/localProgress";
import { DailyBoss } from "@/lib/dailyBoss";
import { CollectionSnapshot } from "@/lib/localCollection";
import { LocalAnalyticsSnapshot } from "@/lib/localAnalytics";
import DailyBossCard from "@/components/DailyBossCard";
import ProgressHub from "@/components/ProgressHub";
import {
  MAX_INPUT_LENGTH,
  MIN_INPUT_LENGTH,
  SafetyReason,
  sanitizeInput,
} from "@/lib/safety";

interface VentInputProps {
  onSubmit: (text: string) => void;
  onQuickSubmit?: (text: string) => void;
  loading?: boolean;
  error?: string;
  progress?: LocalProgress | null;
  dailyBoss: DailyBoss;
  challengeBoss?: DailyBoss | null;
  collection: CollectionSnapshot;
  analytics: LocalAnalyticsSnapshot;
  onPlayPublicBoss: (boss: DailyBoss) => void;
  onOpenCollection: () => void;
  onInputStarted?: () => void;
}

const LOADING_LINES = [
  "Naming the nonsense…",
  "Filing the bad vibes…",
  "Adding tiny villain shoes…",
  "Checking their emotional résumé…",
  "Opening the cartoon portal…",
];

const EXAMPLE_PROMPTS = [
  { label: "Meeting overload", prompt: "That meeting that should have been an email", icon: "💼" },
  { label: "Deadline panic", prompt: "Deadline panic and too many unfinished tasks", icon: "⏰" },
  { label: "Group chat drama", prompt: "Group chat drama that is taking up too much space", icon: "💬" },
  { label: "Random boss", prompt: "A completely random annoying everyday bad vibe", icon: "🎲" },
];

const SAFETY_COPY: Record<SafetyReason, {
  title: string;
  body: string;
  links?: ReadonlyArray<{ href: string; label: string }>;
}> = {
  self_harm: {
    title: "This needs real support, not a cartoon boss.",
    body: "The arena is pausing. If you may act on these thoughts, contact local emergency services now or stay with someone you trust. In the US and Canada, call or text 988. Edit the vent to describe the stress without self-harm details.",
    links: [
      { href: "tel:988", label: "Call or text 988" },
      { href: "https://www.iasp.info/suicidalthoughts/", label: "Find local resources" },
    ],
  },
  violence: {
    title: "The arena cannot turn a threat into a target.",
    body: "Pause and put distance between you and the situation. If anyone may be in immediate danger, contact local emergency services. You can edit this into the feeling or behavior pattern instead.",
  },
  hate: {
    title: "Aim at the bad pattern, never an identity.",
    body: "Rewrite this around the frustrating behavior or situation without targeting a protected group.",
  },
  sexual: {
    title: "Keep this round non-explicit.",
    body: "Describe the stress or boundary that was crossed without explicit sexual details.",
  },
};

export default function VentInput({
  onSubmit,
  onQuickSubmit,
  loading,
  error,
  progress,
  dailyBoss,
  challengeBoss,
  collection,
  analytics,
  onPlayPublicBoss,
  onOpenCollection,
  onInputStarted,
}: VentInputProps) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const [loadingLineIndex, setLoadingLineIndex] = useState(0);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [inputStarted, setInputStarted] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const trimmed = text.trim();
  const inputAnalysis = sanitizeInput(trimmed);
  const tooShort = touched && trimmed.length < MIN_INPUT_LENGTH;
  const safetyCopy = inputAnalysis?.safetyReason
    ? SAFETY_COPY[inputAnalysis.safetyReason]
    : null;
  const showCustom = customOpen || Boolean(error) || Boolean(safetyCopy) || inputStarted;

  useEffect(() => {
    if (!loading) return;
    const interval = window.setInterval(
      () => setLoadingLineIndex((index) => (index + 1) % LOADING_LINES.length),
      1_300,
    );
    return () => window.clearInterval(interval);
  }, [loading]);

  const handleSubmit = () => {
    setTouched(true);
    if (
      trimmed.length >= MIN_INPUT_LENGTH &&
      !loading &&
      !inputAnalysis?.isSensitive
    ) {
      onSubmit(trimmed);
    }
  };

  const chooseExample = (example: string) => {
    if (loading) return;
    setText(example);
    setTouched(false);
    (onQuickSubmit ?? onSubmit)(example);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto grid w-full max-w-5xl gap-4 px-1 md:grid-cols-[1.08fr_0.92fr] md:items-center md:gap-6"
    >
      <section
        aria-busy={loading}
        className="ink-card flex min-w-0 flex-col gap-3 rounded-[2rem] p-4 backdrop-blur md:gap-4 md:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="ink-stamp bg-brand-ink text-brand-yellow">
            30-second arcade
          </div>
          {progress && progress.totalReleases > 0 && (
            <div className="rounded-full bg-brand-yellow px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-brand-ink">
              {progress.totalReleases} released · {progress.streakDays}d streak
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_96px] items-center gap-2 sm:grid-cols-[1fr_120px] md:block">
          <div>
            <h2 className="font-display text-[2.85rem] leading-[0.86] tracking-wide text-brand-ink sm:text-6xl md:text-7xl">
              Bonk the bad vibe. Laugh. Leave.
            </h2>
            <p className="mt-2 max-w-xl text-sm font-bold leading-relaxed text-neutral-700 md:mt-3 md:text-base">
              Skip the journal. Fight today&apos;s public boss, or name a situation — never a person — and we turn it into a cartoon.
            </p>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border-2 border-brand-ink bg-brand-yellow shadow-[4px_4px_0_#17140f] md:hidden">
            <Image
              src="/stress-goblin.webp"
              alt="A fuzzy purple stress monster with a tiny necktie"
              fill
              priority
              sizes="120px"
              className="object-cover"
            />
          </div>
        </div>

        <DailyBossCard
          boss={challengeBoss ?? dailyBoss}
          challenge={Boolean(challengeBoss)}
          onPlay={() => onPlayPublicBoss(challengeBoss ?? dailyBoss)}
        />

        <div className="grid grid-cols-2 gap-2" aria-label="One-tap bad vibe scenarios">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => chooseExample(example.prompt)}
              disabled={loading}
              className="min-h-12 rounded-2xl border-2 border-brand-ink bg-white px-3 py-2 text-left text-xs font-black text-brand-ink shadow-[3px_3px_0_#17140f] transition-transform hover:bg-brand-yellow active:translate-x-px active:translate-y-px disabled:opacity-40"
            >
              <span className="mr-1.5 text-base" aria-hidden>{example.icon}</span>
              {example.label}
            </button>
          ))}
        </div>

        <ProgressHub
          collection={collection}
          analytics={analytics}
          open={collectionOpen}
          onToggle={() => {
            const next = !collectionOpen;
            setCollectionOpen(next);
            if (next) onOpenCollection();
          }}
        />

        <button
          type="button"
          onClick={() => setCustomOpen((open) => !open)}
          aria-expanded={showCustom}
          className="min-h-11 rounded-2xl border-2 border-dashed border-brand-ink/40 px-3 text-left text-[11px] font-black uppercase tracking-wide text-neutral-600"
        >
          {showCustom ? "Hide custom vent" : "Or name your own bad vibe →"}
        </button>

        {showCustom && (
        <div className="flex w-full flex-col gap-2 rounded-[1.5rem] border-2 border-brand-ink bg-white p-3">
          <label htmlFor="vent-text" className="text-xs font-black uppercase tracking-wider text-gray-700">
            What&apos;s taking up too much space?
          </label>
          <textarea
            id="vent-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (touched) setTouched(false);
              if (!inputStarted && event.target.value.length > 0) {
                setInputStarted(true);
                onInputStarted?.();
              }
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") handleSubmit();
            }}
            placeholder="The meeting that should've been an email…"
            maxLength={MAX_INPUT_LENGTH}
            rows={3}
            aria-invalid={tooShort || Boolean(error) || Boolean(safetyCopy)}
            aria-describedby="vent-helper vent-feedback"
            disabled={loading}
            className="min-h-20 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-semibold leading-relaxed placeholder:text-gray-400 transition-colors focus:border-brand-purple focus:bg-white focus:outline-none disabled:opacity-70"
          />
          <div className="flex items-start justify-between gap-3 px-1">
            <p id="vent-helper" className="max-w-md text-[11px] font-semibold leading-snug text-gray-500">
              Private by design: this vent is used for this round, not placed on the victory card. Skip names and identifying details.{" "}
              <Link href="/privacy" className="underline decoration-brand-purple/40 underline-offset-2">
                Privacy
              </Link>
            </p>
            <span className="shrink-0 text-[10px] font-bold text-gray-400">
              {text.length}/{MAX_INPUT_LENGTH}
            </span>
          </div>
        </div>
        )}

        <div id="vent-feedback" aria-live="polite">
          {safetyCopy ? (
            <div role="alert" className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-left">
              <p className="text-sm font-black text-orange-950">{safetyCopy.title}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-orange-900">{safetyCopy.body}</p>
              {safetyCopy.links && safetyCopy.links.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {safetyCopy.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex min-h-9 items-center rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-wide text-orange-950 ring-1 ring-orange-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : inputAnalysis?.hasPII ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Identifying details detected. We&apos;ll replace them before generation; removing them yourself is even safer.
            </p>
          ) : inputAnalysis?.looksLikeRealPerson ? (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">
              We&apos;ll fictionalize the behavior pattern—not depict the person.
            </p>
          ) : tooShort ? (
            <p className="text-xs font-bold text-brand-red">Give the monster portal at least {MIN_INPUT_LENGTH} characters.</p>
          ) : error ? (
            <p role="alert" className="text-xs font-bold text-brand-red">{error}</p>
          ) : null}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={
            trimmed.length < MIN_INPUT_LENGTH ||
            loading ||
            Boolean(inputAnalysis?.isSensitive)
          }
          className="generate-btn w-full rounded-full py-4 text-base font-black uppercase tracking-wide text-black shadow-[0_5px_0_0_rgba(0,0,0,0.12)] transition-all disabled:cursor-not-allowed disabled:opacity-45 sm:text-lg"
        >
          {loading ? LOADING_LINES[loadingLineIndex] : "Turn it into a boss →"}
        </motion.button>

      </section>

      <section className="relative hidden min-w-0 md:block" aria-label="Unhappy Buster mascot">
        <div className="absolute -left-6 top-10 z-10 rotate-[-6deg] rounded-lg border-2 border-black/10 bg-brand-red px-4 py-2 text-sm font-black text-white shadow-[5px_6px_0_rgba(0,0,0,0.14)]">
          TOO MANY TABS!
        </div>
        <div className="absolute -right-4 bottom-14 z-10 rotate-[5deg] rounded-lg border-2 border-black/10 bg-brand-yellow px-4 py-2 text-sm font-black text-black shadow-[5px_6px_0_rgba(0,0,0,0.14)]">
          NOT TODAY!
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-3 shadow-2xl ring-1 ring-black/5">
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100">
            <Image
              src="/stress-goblin.webp"
              alt="A fuzzy purple stress monster surrounded by an alarm clock, notifications, and coffee"
              fill
              priority
              sizes="(min-width: 768px) 440px, 120px"
              className="object-cover"
            />
          </div>
        </div>
        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-gray-700 shadow-md ring-1 ring-black/5">
          <span aria-hidden>🔒</span> No account · no public feed · no revenge fantasies
        </div>
      </section>
    </motion.div>
  );
}
