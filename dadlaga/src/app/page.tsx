"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchViewership } from "@/lib/api";
import MapView from "@/components/MapView";
import Legend from "@/components/Legend";
import { RAMP } from "@/lib/constants";
import TopFive from "@/components/TopFive";
import OverallTable from "@/components/OverallTable";

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
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 p-6 bg-gray-50">
      {/* Map Section */}
      <div className="h-[80vh] rounded-xl shadow-md border bg-white overflow-hidden">
        <MapView geo={geo} mode={mode} normalized={normalized} view={view} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Date filter */}
        <div className="bg-white shadow-sm rounded-xl p-4 text-gray-700 border">
          <div className="text-base font-semibold mb-2">📅 Date</div>
          <input
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            type="month"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={normalized}
              onChange={(e) => setNormalized(e.target.checked)}
            />
            <span>Normalize (per 1,000 households)</span>
          </label>
        </div>

        {/* Mode toggle */}
        <div className="bg-white shadow-sm rounded-xl p-4 text-gray-700 border">
          <div className="text-base font-semibold mb-3">🗺️ Display Mode</div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "choropleth"}
                onChange={() => setMode("choropleth")}
              />
              <span>Choropleth (үзэлтээр)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
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

        {/* Legend */}
        <Legend breaks={breaks} />

        {/* Top 5 */}
        <TopFive dataMap={dataMap} />

        {/* Overall Table */}
        <OverallTable dataMap={dataMap} styledGeo={geo} />
      </div>
    </main>
  );
}
