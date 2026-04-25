export const MAX_INPUT_LENGTH = 180;

const BLOCKED_PATTERNS = [
  /suicide|kill myself|self[-\s]?harm|hurt myself/i,
  /\bkill\b|\bmurder\b|\bshoot\b|\bstab\b|\bbomb\b/i,
  /\bnazi\b|terrorist|extremist/i,
  /\bslur\b|racial hatred|hate crime/i,
  /\bsex\b|porn|nude|explicit/i,
];

const REAL_PERSON_HINTS = [
  /\bmy (boss|manager|coworker|teacher|professor|ex|friend|mom|dad|parent|roommate)\b/i,
  /\b[A-Z][a-z]+ [A-Z][a-z]+\b/,
];

export interface SafeInput {
  cleaned: string;
  symbolicTarget: string;
  isSensitive: boolean;
  looksLikeRealPerson: boolean;
}

export function sanitizeInput(value: unknown): SafeInput | null {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);

  if (!cleaned) return null;

  const isSensitive = BLOCKED_PATTERNS.some((pattern) => pattern.test(cleaned));
  const looksLikeRealPerson = REAL_PERSON_HINTS.some((pattern) => pattern.test(cleaned));
  const symbolicTarget = looksLikeRealPerson
    ? `the stressful pattern behind this situation: ${cleaned}`
    : cleaned;

  return { cleaned, symbolicTarget, isSensitive, looksLikeRealPerson };
}

export function safeJsonString(value: string) {
  return JSON.stringify(value).slice(1, -1);
}
