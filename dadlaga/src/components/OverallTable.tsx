"use client";

import { useState, useMemo } from "react";
import { MN_NAME_BY_SLUG } from "@/lib/constants";

export default function OverallTable({
  dataMap,
  styledGeo,
}: {
  dataMap: Record<string, number | null>;
  styledGeo: any;
}) {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Өгөгдлийг боловсруулна
  const rows = useMemo(() => {
    const arr = Object.entries(dataMap).map(([slug, v]) => {
      const feature = styledGeo?.features.find(
        (f: any) => f.properties.slug === slug
      );

      const displayName =
        MN_NAME_BY_SLUG[slug] || feature?.properties?.name || slug;

      return { slug, name: displayName, value: v ?? 0 };
    });

    return arr.sort((a, b) =>
      sortOrder === "desc" ? b.value - a.value : a.value - b.value
    );
  }, [dataMap, styledGeo, sortOrder]);

  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white/80 text-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-gray-700 text-lg">
          Overall Viewership
        </div>
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
          }
          className="text-sm text-blue-600 hover:underline"
        >
          Sort: {sortOrder === "desc" ? "High → Low" : "Low → High"}
        </button>
      </div>

      <div className="overflow-x-auto text-gray-700">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left w-10">#</th>
              <th className="border px-2 py-1 text-left">Аймаг</th>
              <th className="border px-2 py-1 text-right">Үзэлт</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.slug} className="hover:bg-gray-50 transition-colors">
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">{row.name}</td>
                <td className="border px-2 py-1 text-right font-bold text-gray-700 ">
                  {row.value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
