export const MIN_INPUT_LENGTH = 3;
export const MAX_INPUT_LENGTH = 280;

export type SafetyReason = "self_harm" | "violence" | "hate" | "sexual";

const SAFETY_PATTERNS: ReadonlyArray<{
  reason: SafetyReason;
  patterns: readonly RegExp[];
}> = [
  {
    reason: "self_harm",
    patterns: [
      /\bsuicid(?:e|al)\b/i,
      /\b(?:kill|hurt|harm)\s+(?:myself|me)\b/i,
      /\bself[-\s]?harm\b/i,
      /\bdon['’]?t want to (?:be here|live)\b/i,
      /\b(?:want|wanna|going)\s+to die\b/i,
      /\bunalive\b/i,
      /\bkms\b/i,
    ],
  },
  {
    reason: "violence",
    patterns: [
      /\b(?:kill|murder|shoot|stab|bomb)\s+(?:him|her|them|you|my|the|that|this)\b/i,
      /\b(?:i(?:'m| am| will|'ll| want to| wanna| might)?\s+)?(?:attack|hurt)\s+(?:him|her|them|you|my|the)\b/i,
      /\b(?:bring|use)\s+(?:a\s+)?(?:gun|knife|weapon)\b/i,
    ],
  },
  {
    reason: "hate",
    patterns: [
      /\bracial hatred\b/i,
      /\bhate crime\b/i,
      /\b(?:nazi|white supremacist)\b/i,
      /\b(?:exterminate|eradicate)\s+(?:all\s+)?(?:people|men|women|immigrants|jews|muslims|christians)\b/i,
    ],
  },
  {
    reason: "sexual",
    patterns: [
      /\b(?:porn|nudes?|explicit sex|sexual assault|rape)\b/i,
    ],
  },
];

const REAL_PERSON_HINTS = [
  /\bmy (?:boss|manager|coworker|teacher|professor|ex|friend|mom|dad|parent|roommate|partner)\b/i,
  /\b(?:mr|mrs|ms|miss|dr|prof)\.?\s+[A-Z][a-z]+\b/,
  /(?:我的|我)(?:老板|经理|同事|老师|教授|前任|朋友|妈妈|爸爸|父母|室友|伴侣)/,
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g;
const FULL_NAME_PATTERN = /\b[A-Z][a-z]{1,30}(?:[-'][A-Z]?[a-z]+)?\s+[A-Z][a-z]{1,30}(?:[-'][A-Z]?[a-z]+)?\b/g;
const TITLED_OR_RELATION_NAME_PATTERN = /\b(?:(?:my\s+)?(?:boss|manager|coworker|teacher|professor|ex|friend|mom|dad|parent|roommate|partner)|(?:mr|mrs|ms|miss|dr|prof)\.?)\s+([A-Z][a-z]{1,30}(?:[-'][A-Z]?[a-z]+)?)/gi;
const COMMON_CJK_SURNAMES = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜谢邹喻苏潘葛范彭鲁韦马苗方俞任袁柳唐罗薛伍余姚孟顾尹江钟徐邱骆高夏蔡田樊胡霍万卢莫房裘陆荣翁于惠甄曲封储靳段巫焦侯全班秋仲宫宁仇栾甘厉祖武刘景龙叶黎白蒲鄂索赖卓屠池乔谭申冉牛温庄柴瞿阎连习艾容向古易廖曾关查游权";
const CJK_NAME_SOURCE = `[${COMMON_CJK_SURNAMES}][\\p{Script=Han}]{1,2}`;
const CJK_RELATION_NAME_PATTERN = new RegExp(
  `((?:我的|我)?(?:老板|经理|同事|老师|教授|前任|朋友|妈妈|爸爸|父母|室友|伴侣)(?:叫|是|名叫)?)[\\s:：]*(${CJK_NAME_SOURCE})(?=(?:让我|叫我|害我|逼我|总是|一直|又|把我|说我|，|。|、|\\s|$))`,
  "gu",
);
const CJK_LEADING_NAME_PATTERN = new RegExp(
  `^(${CJK_NAME_SOURCE})(?=(?:让我|叫我|害我|逼我|总是|一直|又|把我|说我))`,
  "u",
);

export interface SafeInput {
  cleaned: string;
  redacted: string;
  symbolicTarget: string;
  isSensitive: boolean;
  safetyReason?: SafetyReason;
  hasPII: boolean;
  looksLikeRealPerson: boolean;
}

function hasMatch(value: string, pattern: RegExp) {
  pattern.lastIndex = 0;
  const result = pattern.test(value);
  pattern.lastIndex = 0;
  return result;
}

export function redactIdentifiers(value: string) {
  return value
    .replace(EMAIL_PATTERN, "[email]")
    .replace(PHONE_PATTERN, "[phone]")
    .replace(FULL_NAME_PATTERN, "[person]")
    .replace(TITLED_OR_RELATION_NAME_PATTERN, (match, name: string) => match.replace(name, "[person]"))
    .replace(CJK_RELATION_NAME_PATTERN, "$1[person]")
    .replace(CJK_LEADING_NAME_PATTERN, "[person]");
}

function collectMatches(value: string, pattern: RegExp, group = 0) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return [...value.matchAll(new RegExp(pattern.source, flags))]
    .map((match) => match[group])
    .filter((match): match is string => Boolean(match));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Removes only identifiers observed in the source input, preserving fictional generated names. */
export function redactKnownIdentifiers(value: string, source: string) {
  const identifiers = new Set([
    ...collectMatches(source, EMAIL_PATTERN),
    ...collectMatches(source, PHONE_PATTERN),
    ...collectMatches(source, FULL_NAME_PATTERN),
    ...collectMatches(source, TITLED_OR_RELATION_NAME_PATTERN, 1),
    ...collectMatches(source, CJK_RELATION_NAME_PATTERN, 2),
    ...collectMatches(source, CJK_LEADING_NAME_PATTERN, 1),
  ]);

  return [...identifiers]
    .sort((left, right) => right.length - left.length)
    .reduce(
      (output, identifier) => output.replace(
        new RegExp(escapeRegExp(identifier), /[A-Za-z]/.test(identifier) ? "gi" : "g"),
        "[person]",
      ),
      value,
    );
}

export function findSafetyReason(value: string): SafetyReason | undefined {
  return SAFETY_PATTERNS.find(({ patterns }) =>
    patterns.some((pattern) => {
      pattern.lastIndex = 0;
      const matched = pattern.test(value);
      pattern.lastIndex = 0;
      return matched;
    }),
  )?.reason;
}

/** Scan generated copy so a model cannot sneak blocked categories into the arena. */
export function findUnsafeGeneratedText(values: readonly unknown[]): SafetyReason | undefined {
  for (const value of values) {
    if (typeof value !== "string" || !value) continue;
    const reason = findSafetyReason(value);
    if (reason) return reason;
  }
  return undefined;
}

export function sanitizeInput(value: unknown): SafeInput | null {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);

  if (!cleaned) return null;

  const safetyReason = findSafetyReason(cleaned);
  const hasPII =
    hasMatch(cleaned, EMAIL_PATTERN) ||
    hasMatch(cleaned, PHONE_PATTERN) ||
    hasMatch(cleaned, FULL_NAME_PATTERN) ||
    hasMatch(cleaned, TITLED_OR_RELATION_NAME_PATTERN) ||
    hasMatch(cleaned, CJK_RELATION_NAME_PATTERN) ||
    hasMatch(cleaned, CJK_LEADING_NAME_PATTERN);
  const looksLikeRealPerson =
    hasPII || REAL_PERSON_HINTS.some((pattern) => pattern.test(cleaned));
  const redacted = redactIdentifiers(cleaned);
  const symbolicTarget = looksLikeRealPerson
    ? `a fictional stress pattern inspired by this anonymized situation: ${redacted}`
    : redacted;

  return {
    cleaned,
    redacted,
    symbolicTarget,
    isSensitive: Boolean(safetyReason),
    safetyReason,
    hasPII,
    looksLikeRealPerson,
  };
}

export function safeJsonString(value: string) {
  return JSON.stringify(value).slice(1, -1);
}
