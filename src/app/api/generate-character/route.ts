import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { safeJsonString } from "@/lib/safety";

export const runtime = "nodejs";
export const maxDuration = 60;

const IMAGE_MODEL = "gpt-image-2";
const REQUEST_TIMEOUT_MS = 45000;
const MAX_DESCRIPTION_LENGTH = 300;
const SECRET_PATTERN = /sk-[A-Za-z0-9_-]+/g;

function buildCharacterPrompt(description: string) {
  return `Create a fictional stylized stress monster / villain character portrait inspired by this user description:
"${safeJsonString(description)}"

The character should look like a darkly funny mobile game enemy card.
Make it exaggerated, expressive, memorable, and clearly fictional.
Focus on facial expression, personality, emotional symbolism, and visual impact.
Style: colorful cartoon-realistic game art, bold shapes, clean background, high contrast, humorous but not scary-gory.
Do not depict a real identifiable person. Make it clearly fictional.
Do not include text, logos, watermarks, or UI labels in the image.
Square portrait composition.`;
}

function sanitizeDescription(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}

function safeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: "Unknown image generation error" };
  }

  const maybeError = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
    type?: unknown;
  };

  const safeString = (value: unknown) =>
    typeof value === "string"
      ? value.replace(SECRET_PATTERN, "[redacted_key]").slice(0, 500)
      : undefined;

  return {
    name: safeString(maybeError.name),
    message: safeString(maybeError.message),
    status: typeof maybeError.status === "number" ? maybeError.status : undefined,
    code: safeString(maybeError.code),
    type: safeString(maybeError.type),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const description = sanitizeDescription(body?.description);

    if (!description) {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 },
      );
    }

    if (typeof body?.description === "string" && body.description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("[generate-character] OPENAI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Image generation is not configured yet." },
        { status: 500 },
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const result = await client.images.generate({
      model: IMAGE_MODEL,
      prompt: buildCharacterPrompt(description),
      size: "1024x1024",
      quality: "low",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("OpenAI image response did not include base64 data.");
    }

    return NextResponse.json({ image: `data:image/png;base64,${imageBase64}` });
  } catch (error) {
    console.error("[generate-character] OpenAI image generation failed:", safeErrorDetails(error));
    return NextResponse.json(
      { error: "Could not generate the character image. Please try again." },
      { status: 500 },
    );
  }
}
