import { describe, expect, it } from "vitest";
import {
  findSafetyReason,
  findUnsafeGeneratedText,
  redactIdentifiers,
  redactKnownIdentifiers,
  sanitizeInput,
} from "./safety";

describe("sanitizeInput", () => {
  it("returns null for non-strings and blank text", () => {
    expect(sanitizeInput(null)).toBeNull();
    expect(sanitizeInput("   ")).toBeNull();
  });

  it("allows an ordinary workplace vent", () => {
    const result = sanitizeInput("That meeting should have been an email");
    expect(result?.isSensitive).toBe(false);
    expect(result?.cleaned).toContain("meeting");
  });

  it("blocks self-harm and common evasions", () => {
    expect(sanitizeInput("I want to kill myself")?.safetyReason).toBe("self_harm");
    expect(sanitizeInput("I don't want to be here")?.safetyReason).toBe("self_harm");
    expect(sanitizeInput("I want to die")?.safetyReason).toBe("self_harm");
    expect(sanitizeInput("going to unalive tonight")?.safetyReason).toBe("self_harm");
    expect(sanitizeInput("kms after this meeting")?.safetyReason).toBe("self_harm");
  });

  it("blocks violence, hate, and explicit sexual input", () => {
    expect(sanitizeInput("I will kill him tomorrow")?.safetyReason).toBe("violence");
    expect(sanitizeInput("this is a hate crime")?.safetyReason).toBe("hate");
    expect(sanitizeInput("send nudes in the arena")?.safetyReason).toBe("sexual");
  });

  it("redacts emails, phones, and names before generation", () => {
    const result = sanitizeInput("Jordan Blake emailed me at boss@example.com or +1 555 123 4567");
    expect(result?.hasPII).toBe(true);
    expect(result?.redacted).not.toMatch(/boss@example.com/i);
    expect(result?.redacted).not.toMatch(/555/);
    expect(result?.redacted).toContain("[email]");
    expect(result?.redacted).toContain("[phone]");
    expect(result?.redacted).toContain("[person]");
  });

  it("turns relationship-qualified names into a symbolic target", () => {
    const result = sanitizeInput("My boss Dana keeps adding last-minute meetings");
    expect(result?.looksLikeRealPerson).toBe(true);
    expect(result?.symbolicTarget).toMatch(/fictional stress pattern/i);
    expect(result?.redacted).toContain("[person]");
  });
});

describe("output safety", () => {
  it("classifies blocked phrases in generated copy", () => {
    expect(findSafetyReason("I will kill them")).toBe("violence");
    expect(findUnsafeGeneratedText(["funny roast", "kill myself"])).toBe("self_harm");
    expect(findUnsafeGeneratedText(["weaponized calendar invites"])).toBeUndefined();
  });
});

describe("identifier redaction", () => {
  it("only strips identifiers observed in the source vent", () => {
    const source = "Alex Rivera sent another last-minute meeting";
    const generated = "Calendar Clive roasted Alex Rivera with a tiny violin";
    expect(redactKnownIdentifiers(generated, source)).toBe(
      "Calendar Clive roasted [person] with a tiny violin",
    );
  });

  it("redacts contact details in free text", () => {
    expect(redactIdentifiers("ping me at a@b.co")).toContain("[email]");
  });
});
