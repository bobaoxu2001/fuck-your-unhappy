"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MAX_DESCRIPTION_LENGTH = 300;

export default function CharacterGenerator() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmed = description.trim();

  const handleGenerate = async () => {
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setImage("");

    try {
      const response = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed.");
      }

      if (!data.image || typeof data.image !== "string") {
        throw new Error("Image generation returned an empty image.");
      }

      setImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-start">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] bg-white/90 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur md:p-7"
      >
        <div className="inline-flex rounded-full bg-brand-purple-dark px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
          AI enemy portrait
        </div>

        <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-wide text-black md:text-6xl">
          Generate a fictional stress villain.
        </h1>

        <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-600">
          Describe the frustrating person or vibe. The app turns it into a fictional, game-style enemy portrait.
        </p>

        <label className="mt-5 block text-xs font-black uppercase tracking-widest text-gray-500">
          Character inspiration
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Example: a passive-aggressive manager who says everything is urgent..."
          className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold leading-relaxed text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-purple focus:bg-white"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="min-h-5 text-xs font-bold text-brand-red">{error}</p>
          <span className="text-[11px] font-black text-gray-300">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleGenerate}
          disabled={!trimmed || loading}
          className="mt-3 w-full rounded-full generate-btn py-4 text-lg font-black uppercase tracking-wide text-black shadow-[0_5px_0_0_rgba(0,0,0,0.12)] transition-all disabled:opacity-40"
        >
          {loading ? "Generating..." : "Generate Character"}
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] bg-white/80 p-4 shadow-2xl ring-1 ring-black/5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#FFD60033,transparent_34%),radial-gradient(circle_at_bottom_left,#FF149322,transparent_38%)]" />

        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Generated fictional villain character portrait"
            className="relative z-10 aspect-square w-full max-w-[512px] rounded-[1.5rem] object-cover shadow-2xl ring-4 ring-white"
          />
        ) : (
          <div className="relative z-10 max-w-sm text-center">
            <div className="text-8xl">🎭</div>
            <p className="mt-4 font-display text-4xl tracking-wide text-black">
              Your enemy card appears here.
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-500">
              Keep it fictional, exaggerated, and funny. No real-person portrait matching.
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
