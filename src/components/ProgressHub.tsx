"use client";

import { useState } from "react";
import {
  clearCollection,
  CollectionSnapshot,
  type CollectionEncounter,
} from "@/lib/localCollection";
import {
  clearLocalAnalytics,
  LocalAnalyticsSnapshot,
  type FunnelMilestone,
} from "@/lib/localAnalytics";
import { clearLocalProgress } from "@/lib/localProgress";

interface ProgressHubProps {
  collection: CollectionSnapshot;
  analytics: LocalAnalyticsSnapshot;
  open: boolean;
  onToggle: () => void;
}

const FUNNEL_LABELS: Record<FunnelMilestone, string> = {
  app_opened: "App opens",
  generation_started: "Boss builds",
  monster_revealed: "Boss reveals",
  battle_started: "Arena starts",
  first_attack: "First attacks",
  summary_viewed: "Results seen",
  share_completed: "Shares sent",
  replay_started: "Replays",
};

function prettyLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function latestUniqueEncounters(encounters: readonly CollectionEncounter[]) {
  const seen = new Set<string>();
  return [...encounters].reverse().filter((encounter) => {
    const key = `${encounter.name.toLowerCase()}::${encounter.archetype}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}

export default function ProgressHub({ collection, analytics, open, onToggle }: ProgressHubProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const unlocked = collection.unlocks.filter(({ unlocked: value }) => value);
  const nextUnlock = collection.unlocks.find(({ unlocked: value }) => !value);
  const recentDiscoveries = latestUniqueEncounters(collection.encounters);

  const clearDeviceData = () => {
    clearCollection();
    clearLocalAnalytics();
    clearLocalProgress();
    try {
      localStorage.removeItem("fyu-tts-enabled");
    } catch {
      // Storage may be unavailable; the rest already cleared.
    }
    window.location.reload();
  };

  return (
    <section className="rounded-[1.5rem] bg-white/90 p-3 text-left shadow-md ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => {
          setConfirmClear(false);
          onToggle();
        }}
        aria-expanded={open}
        aria-controls="private-field-guide"
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-brand-purple">Private field guide</span>
          <span className="block text-sm font-black text-gray-900">
            {collection.stats.uniqueArchetypes} types · {unlocked.length} unlocks
          </span>
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">{open ? "Close" : "Open"}</span>
      </button>

      {open && (
        <div id="private-field-guide" className="mt-3 space-y-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              [collection.stats.encounters, "Rounds"],
              [collection.stats.defeated, "Cleared"],
              [collection.stats.uniqueArchetypes, "Types"],
              [collection.stats.bestCombo, "Best combo"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-gray-50 px-1 py-2">
                <p className="text-lg font-black leading-none text-brand-purple">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <section aria-labelledby="monster-field-guide-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 id="monster-field-guide-title" className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Monster field guide
                </h3>
                <p className="text-xs font-bold text-gray-800">Fictional bosses discovered on this device</p>
              </div>
              <span className="shrink-0 text-[10px] font-black text-brand-purple">
                {collection.archetypes.length} / ∞
              </span>
            </div>

            {recentDiscoveries.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {recentDiscoveries.map((encounter) => (
                  <article key={`${encounter.dateKey}-${encounter.name}-${encounter.archetype}`} className="min-w-0 rounded-xl bg-brand-purple/5 p-2.5 ring-1 ring-brand-purple/10">
                    <p className="truncate text-xs font-black text-gray-900" title={encounter.name}>{encounter.name}</p>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-brand-purple" title={encounter.archetype}>
                      {prettyLabel(encounter.archetype)}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-gray-500">
                      {prettyLabel(encounter.vibe)} · {prettyLabel(encounter.outcome)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs font-bold leading-relaxed text-gray-500">
                No monsters catalogued yet. Finish a round to pin its fictional type and vibe here.
              </p>
            )}

            {(collection.archetypes.length > 0 || collection.vibes.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Discovered monster types and vibes">
                {collection.archetypes.map((archetype) => (
                  <span key={`type-${archetype}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-700">
                    Type: {prettyLabel(archetype)}
                  </span>
                ))}
                {collection.vibes.map((vibe) => (
                  <span key={`vibe-${vibe}`} className="rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-black text-pink-700">
                    Vibe: {prettyLabel(vibe)}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="unlock-title">
            <h3 id="unlock-title" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Unlocked gear</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {unlocked.map((item) => (
                <span key={item.id} className="rounded-full bg-brand-yellow-light px-2.5 py-1 text-[10px] font-black text-amber-950">
                  {item.emoji} {item.label}
                </span>
              ))}
            </div>
          </section>

          {nextUnlock && (
            <section aria-labelledby="next-unlock-title" className="rounded-xl bg-brand-purple/5 px-3 py-2.5">
              <h3 id="next-unlock-title" className="text-[10px] font-black uppercase tracking-widest text-brand-purple">Next unlock</h3>
              <p className="text-xs font-black text-gray-800">{nextUnlock.emoji} {nextUnlock.label} · {nextUnlock.requirement}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200" aria-hidden>
                <div className="h-full rounded-full bg-brand-purple" style={{ width: `${Math.min(100, nextUnlock.target === 0 ? 100 : (nextUnlock.current / nextUnlock.target) * 100)}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-bold text-gray-500">{nextUnlock.current} of {nextUnlock.target}</p>
            </section>
          )}

          <section aria-labelledby="local-funnel-title" className="rounded-2xl border border-gray-100 p-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 id="local-funnel-title" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your local journey</h3>
                <p className="text-xs font-bold text-gray-800">Readable activity counts, never a hidden profile</p>
              </div>
              <span className="shrink-0 text-xs font-black text-brand-purple">{analytics.totalEvents} events</span>
            </div>
            <ol className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {analytics.funnel.map((step) => (
                <li key={step.event} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
                  <span className="truncate text-[10px] font-bold text-gray-600">{FUNNEL_LABELS[step.event]}</span>
                  <span className="min-w-5 text-right text-xs font-black text-gray-900">{step.count}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[10px] font-semibold leading-relaxed text-gray-500">
              Counts stay in this browser. They contain no vent text, identity, session ID, or event payload and are never sent anywhere by this app.
            </p>
          </section>

          <section aria-labelledby="local-data-title" className="rounded-xl bg-gray-50 px-3 py-2.5">
            <h3 id="local-data-title" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Local data controls</h3>
            {!confirmClear ? (
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold leading-relaxed text-gray-500">Erase this device&apos;s field guide, unlock progress, streaks, voice preference, and activity counts.</p>
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="min-h-10 shrink-0 rounded-full bg-white px-3 text-[10px] font-black text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  Clear data
                </button>
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2.5">
                <p className="text-[10px] font-bold leading-relaxed text-red-900">This cannot be undone. The app will reload after clearing this browser&apos;s saved progress.</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="min-h-10 rounded-full bg-white px-3 text-[10px] font-black text-gray-700 ring-1 ring-gray-200"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={clearDeviceData}
                    className="min-h-10 rounded-full bg-red-600 px-3 text-[10px] font-black text-white"
                  >
                    Clear &amp; reload
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
