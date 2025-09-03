"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchViewership } from "@/lib/api";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import { RAMP } from "@/lib/constants";

type Mode = "choropleth" | "distinct";

export default function Page() {
  const [geo, setGeo] = useState<any>(null);
  const [normalized, setNormalized] = useState(false);
  const [activeDate, setActiveDate] = useState<string>("2025-08");
  const [mode, setMode] = useState<Mode>("choropleth");

  useEffect(() => {
    fetch("/mongolia_aimags.json")
      .then((r) => r.json())
      .then(setGeo);
  }, []);

  const { data: view } = useQuery({
    queryKey: ["view", activeDate, normalized],
    queryFn: () => fetchViewership({ date: activeDate, normalized }),
    enabled: !!activeDate,
  });

  // stats for Legend
  const dataMap = useMemo(() => {
    const m: Record<string, number | null> = {};
    const items = Array.isArray(view)
      ? view
      : Array.isArray(view?.data)
      ? view.data
      : [];
    items.forEach((it: any) => {
      m[it.aimag_slug] = normalized ? it.per_1000 ?? null : it.views ?? null;
    });
    return m;
  }, [view, normalized]);

  const breaks = useMemo(() => {
    const vals = Object.values(dataMap).filter(
      (v): v is number => typeof v === "number"
    );
    if (!vals.length) return null;
    const min = Math.min(...vals),
      max = Math.max(...vals);
    const n = RAMP.length;
    return Array.from(
      { length: n - 1 },
      (_, i) => min + ((i + 1) * (max - min)) / n
    );
  }, [dataMap]);

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 p-4">
      <MapView geo={geo} mode={mode} normalized={normalized} view={view} />

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Date</div>
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            type="month"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
          />
          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={normalized}
              onChange={(e) => setNormalized(e.target.checked)}
            />
            <span>Normalize (per 1,000 households)</span>
          </label>
        </div>

        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">Display mode</div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "choropleth"}
                onChange={() => setMode("choropleth")}
              />
              <span>Choropleth (үзэлтээр)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "distinct"}
                onChange={() => setMode("distinct")}
              />
              <span>Distinct provinces</span>
            </label>
          </div>
        </div>

        <Legend breaks={breaks} />

        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">Top 5</div>
          <ol className="space-y-1">
            {Object.entries(dataMap)
              .filter(([, v]) => typeof v === "number")
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 5)
              .map(([slug, v], i) => (
                <li key={slug} className="flex justify-between text-sm">
                  <span className="font-medium">
                    {i + 1}. {slug}
                  </span>
                  <span className="font-semibold">
                    {(v as number).toLocaleString()}
                  </span>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
