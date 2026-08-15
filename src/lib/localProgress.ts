import { ReleaseOutcome } from "./types";

const STORAGE_KEY = "unhappy-buster-progress-v1";

export interface LocalProgress {
  totalReleases: number;
  streakDays: number;
  lastReleaseDate?: string;
  lastOutcome?: ReleaseOutcome;
}

const EMPTY_PROGRESS: LocalProgress = {
  totalReleases: 0,
  streakDays: 0,
};

function localDay(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayBefore(day: string) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return localDay(date);
}

export function readLocalProgress(): LocalProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<LocalProgress> | null;
    if (!parsed) return EMPTY_PROGRESS;
    return {
      totalReleases: Number.isFinite(parsed.totalReleases) ? Math.max(0, parsed.totalReleases ?? 0) : 0,
      streakDays: Number.isFinite(parsed.streakDays) ? Math.max(0, parsed.streakDays ?? 0) : 0,
      lastReleaseDate: typeof parsed.lastReleaseDate === "string" ? parsed.lastReleaseDate : undefined,
      lastOutcome: parsed.lastOutcome,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function clearLocalProgress(): LocalProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private browsing.
  }
  return EMPTY_PROGRESS;
}

export function recordLocalRelease(outcome: ReleaseOutcome, date = new Date()): LocalProgress {
  const current = readLocalProgress();
  const today = localDay(date);
  const isSameDay = current.lastReleaseDate === today;
  const continuesStreak = current.lastReleaseDate === dayBefore(today);
  const next: LocalProgress = {
    totalReleases: current.totalReleases + 1,
    streakDays: isSameDay
      ? Math.max(1, current.streakDays)
      : continuesStreak
        ? current.streakDays + 1
        : 1,
    lastReleaseDate: today,
    lastOutcome: outcome,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The reset still works when private browsing blocks storage.
  }
  return next;
}
