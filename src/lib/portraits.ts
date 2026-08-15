const DISABLED_FLAGS = new Set(["1", "true", "yes", "off"]);
const MAX_DATA_URL_CHARS = 2_000_000;
const ALLOWED_HOST_SUFFIXES = [
  ".blob.core.windows.net",
  ".oaistatic.com",
  ".openai.com",
  ".oaiusercontent.com",
] as const;

export function isImageGenerationEnabled(env: Record<string, string | undefined> = process.env) {
  const flag = env.DISABLE_IMAGE_GENERATION?.trim().toLowerCase();
  return !flag || !DISABLED_FLAGS.has(flag);
}

function hostAllowed(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix));
}

/** Accept only short-lived HTTPS portrait URLs or bounded data URLs. */
export function isAllowedPortraitSrc(value: string) {
  if (value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && hostAllowed(url.hostname);
    } catch {
      return false;
    }
  }

  if (
    value.startsWith("data:image/png;base64,")
    || value.startsWith("data:image/jpeg;base64,")
    || value.startsWith("data:image/webp;base64,")
  ) {
    return value.length <= MAX_DATA_URL_CHARS;
  }

  return false;
}
