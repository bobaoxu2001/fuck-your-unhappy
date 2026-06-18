"use client";

interface StressSliderProps {
  value: number;
  onChange: (v: number) => void;
  ariaLabel?: string;
}

function stressColor(value: number) {
  if (value > 66) return "#EF4444";
  if (value > 33) return "#F97316";
  return "#22C55E";
}

export default function StressSlider({ value, onChange, ariaLabel }: StressSliderProps) {
  const color = stressColor(value);
  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel ?? "Stress level"}
        aria-valuetext={`${value} percent`}
        className="fyu-range w-full"
        style={{ accentColor: color, color }}
      />
      <div className="mt-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>😌 Chill</span>
        <span className="text-sm tabular-nums" style={{ color }}>
          {value}%
        </span>
        <span>Max stress 🤯</span>
      </div>
    </div>
  );
}
