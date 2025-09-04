"use client";
import { RAMP } from "@/lib/constants";

export default function Legend({ breaks }: { breaks: number[] | null }) {
  if (!breaks) {
    return (
      <div className="p-4 border rounded-xl shadow-sm bg-white/80">
        <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
          Legend
        </div>
        <div className="text-sm text-gray-400">No data</div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white/80 text-gray-700">
      <div className="flex items-center gap-2 font-semibold  mb-3">Legend</div>
      <div className="space-y-1.5">
        {RAMP.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-sm mx-5"
          >
            <span
              className="inline-block w-8 h-4 rounded-md border border-gray-200 shadow-sm"
              style={{ background: c }}
            />
            <span className="text-blue-600 font-bold">
              ≤ {Math.round(breaks[i] ?? breaks[0])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
