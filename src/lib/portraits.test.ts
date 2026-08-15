import { describe, expect, it } from "vitest";
import { isAllowedPortraitSrc, isImageGenerationEnabled } from "./portraits";

describe("portrait guards", () => {
  it("can be switched off without deleting the route", () => {
    expect(isImageGenerationEnabled({})).toBe(true);
    expect(isImageGenerationEnabled({ DISABLE_IMAGE_GENERATION: "true" })).toBe(false);
    expect(isImageGenerationEnabled({ DISABLE_IMAGE_GENERATION: "off" })).toBe(false);
  });

  it("accepts OpenAI HTTPS URLs and bounded data URLs only", () => {
    expect(isAllowedPortraitSrc("https://files.oaiusercontent.com/img.png")).toBe(true);
    expect(isAllowedPortraitSrc("https://evil.example/x.png")).toBe(false);
    expect(isAllowedPortraitSrc("javascript:alert(1)")).toBe(false);
    expect(isAllowedPortraitSrc("data:image/png;base64,abc")).toBe(true);
    expect(isAllowedPortraitSrc(`data:image/png;base64,${"a".repeat(2_000_001)}`)).toBe(false);
  });
});
