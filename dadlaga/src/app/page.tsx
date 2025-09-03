"use client";

import { useEffect, useMemo, useState } from "react";
import Map, { Source, Layer, MapLayerMouseEvent, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { fetchViewership } from "../lib/api"; // ⬅️ alias хэрэглэхгүй, энгийн relative

import mapboxgl from "mapbox-gl";

const RAMP = [
  "#e8f0ff",
  "#cfe0ff",
  "#b7d0ff",
  "#9fc0ff",
  "#86afff",
  "#6f9fff",
  "#5186ff",
];

const QUAL = [
  "#8dd3c7",
  "#ffffb3",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
];

type Mode = "choropleth" | "distinct";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
// ГАДМ-ий нэрээс slug гаргах туслагч
function makeSlug(s: string) {
  return s
    ?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

// Зарим түгээмэл зөрүүг засах mapping
const SLUG_FIX: Record<string, string> = {
  "bayan-olgii": "bayan-ulgii",
  "govi-altay": "govi-altai",
  hovsgol: "khuvsgul",
  uvurhangai: "uvurkhangai",
  suhbaatar: "sukhbaatar",
  "darhan-uul": "darkhan-uul",
  "tuv-aimag": "tuv",
  bayanhongor: "bayankhongor",
  "orkhon-aimag": "orkhon",
  "ulaanbaatar-hot": "ulaanbaatar",
  arhangay: "arkhangai",
  dzavhan: "zavkhan",
  hentiy: "khentii",
  omnogovi: "umnugovi",
  ovorhangay: "uvurkhangai",
  tov: "tuv",
  "bayan-olgiy": "bayan-ulgii",
  hovd: "khovd",
};

const MN_NAME_BY_SLUG: Record<string, string> = {
  arkhangai: "Архангай",
  "bayan-ulgii": "Баян-Өлгий",
  bayankhongor: "Баянхонгор",
  bulgan: "Булган",
  "darkhan-uul": "Дархан-Уул",
  dornogovi: "Дорноговь",
  dornod: "Дорнод",
  dundgovi: "Дундговь",
  "govi-altai": "Говь-Алтай",
  govisumber: "Говьсүмбэр",
  khentii: "Хэнтий",
  khovd: "Ховд",
  khuvsgul: "Хөвсгөл",
  orkhon: "Орхон",
  umnugovi: "Өмнөговь",
  uvurkhangai: "Өвөрхангай",
  selenge: "Сэлэнгэ",
  sukhbaatar: "Сүхбаатар",
  tuv: "Төв",
  ulaanbaatar: "Улаанбаатар",
  uvs: "Увс",
  zavkhan: "Завхан",
};

export default function Page() {
  const [geo, setGeo] = useState<any>(null);
  const [normalized, setNormalized] = useState(false);
  const [activeDate, setActiveDate] = useState<string>("2025-08");
  const metricKey = normalized ? "per_1000" : "views";
  const [mode, setMode] = useState<"choropleth" | "distinct">("choropleth");
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

  const dataMap = useMemo(() => {
    const m: Record<string, number | null> = {};
    // view нь {data: [...]} эсвэл шууд [...] байж болно
    const items = Array.isArray(view)
      ? view
      : Array.isArray(view?.data)
      ? view.data
      : [];
    items.forEach((it: any) => {
      const v = normalized ? it.per_1000 ?? null : it.views ?? null;
      m[it.aimag_slug] = v;
    });
    return m;
  }, [view, normalized]);

  const styledGeo = useMemo(() => {
    if (!geo) return null;

    const fixedFeatures = geo.features.map((f: any) => {
      const p = f.properties || {};
      // GADM-д ихэвчлэн NL_NAME_1 (орон нутгийн нэр) эсвэл NAME_1 (англи нэр) байдаг
      const baseName: string =
        p.name || p.NL_NAME_1 || p.NAME_1 || p.NAME || "N/A";
      const rawSlug = p.slug || makeSlug(baseName);
      const slug = SLUG_FIX[rawSlug] ?? rawSlug;

      const displayName =
        MN_NAME_BY_SLUG[slug] || (p.NL_NAME_1 && p.NL_NAME_1 !== "NA")
          ? p.NL_NAME_1
          : p.NAME_1 || p.NAME || "N/A";

      const value = dataMap[slug] ?? null;

      return {
        ...f,
        properties: {
          ...p,
          name: displayName, // фронт Popup/Label энэ name-г ашиглана
          slug, // фронт dataMap lookup энэ slug-г ашиглана
          value, // будахад ашиглана
        },
      };
    });

    return { ...geo, features: fixedFeatures };
  }, [geo, dataMap]);

  const stats = useMemo(() => {
    const vals = Object.values(dataMap).filter(
      (v): v is number => typeof v === "number"
    );
    if (!vals.length) return null;
    const min = Math.min(...vals),
      max = Math.max(...vals);
    const n = RAMP.length;
    // n өнгө -> (n-1) break
    const breaks = Array.from(
      { length: n - 1 },
      (_, i) => min + ((i + 1) * (max - min)) / n
    );
    return { min, max, breaks };
  }, [dataMap]);

  const fillLayer: any = useMemo(() => {
    if (!stats) return null;
    const { breaks } = stats; // breaks урт = RAMP.length - 1

    // (stop, color) дарааллаар
    const stepExpr: any[] = ["step", ["get", "value"], RAMP[0]];
    breaks.forEach((b, i) => stepExpr.push(b, RAMP[i + 1]));

    // value байхгүй (null/undefined) үед саарал
    const colorExpr: any[] = [
      "case",
      ["==", ["coalesce", ["get", "value"], -1], -1],
      "#F2F4F7",
      stepExpr,
    ];

    return {
      id: "fill-choropleth",
      type: "fill",
      paint: { "fill-color": colorExpr, "fill-opacity": 0.85 },
    };
  }, [stats]);

  const distinctFillLayer: any = useMemo(() => {
    if (!styledGeo) return null;
    const slugs: string[] = styledGeo.features.map(
      (f: any) => f.properties.slug
    );

    // ['match', ['get','slug'], slug1, color1, slug2, color2, ..., default]
    const expr: any[] = ["match", ["get", "slug"]];
    slugs.forEach((slug, i) => expr.push(slug, QUAL[i % QUAL.length]));
    expr.push("#E5E7EB"); // default

    return {
      id: "fill-distinct",
      type: "fill",
      paint: { "fill-color": expr, "fill-opacity": 0.9 },
    };
  }, [styledGeo]);

  // const outlineLayer: any = {
  //   id: "outline",
  //   type: "line",
  //   paint: { "line-color": "#fff", "line-width": 0.8 },
  // };

  const outlineHalo: any = {
    id: "outline-halo",
    type: "line",
    paint: { "line-color": "#FFFFFF", "line-width": 2.5, "line-opacity": 0.9 },
  };
  const outlineDark: any = {
    id: "outline-dark",
    type: "line",
    paint: { "line-color": "#111827", "line-width": 1.2, "line-opacity": 0.8 },
  };

  // Tooltip state
  const [tip, setTip] = useState<{
    lng: number;
    lat: number;
    name: string;
    value: number | null;
  } | null>(null);

  function onMove(e: MapLayerMouseEvent) {
    const f = e.features?.[0];
    if (!f) return setTip(null);
    // @ts-ignore
    const slug = f.properties.slug as string;
    // @ts-ignore
    const name = f.properties.name as string;
    const value = dataMap[slug] ?? null; // dataMap-аас баталгаажуулж уншина
    setTip({ lng: e.lngLat.lng, lat: e.lngLat.lat, name, value });
  }

  useEffect(() => {
    if (!styledGeo || !view?.data) return;
    const geoSlugs = new Set(
      styledGeo.features.map((f: any) => f.properties.slug)
    );
    const apiSlugs = new Set(view.data.map((x: any) => x.aimag_slug));
    const miss = [...geoSlugs].filter((s) => !apiSlugs.has(s));
    if (miss.length) {
      console.warn("Slug not found in API:", miss);
    } else {
      console.log("All slugs matched ✔️");
    }
  }, [styledGeo, view]);

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 p-4">
      {/* Map wrapper must be relative to position tooltip absolutely */}
      <div className="h-[80vh] relative rounded overflow-hidden border">
        {styledGeo && fillLayer ? (
          <Map
            mapLib={mapboxgl}
            initialViewState={{ longitude: 103.8, latitude: 46.8, zoom: 3.2 }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            interactiveLayerIds={[
              mode === "choropleth" ? "fill-choropleth" : "fill-distinct",
            ]}
            onMouseMove={onMove}
            onMouseLeave={() => setTip(null)}
          >
            <Source id="aimags" type="geojson" data={styledGeo}>
              {mode === "choropleth" ? (
                fillLayer ? (
                  <Layer {...fillLayer} />
                ) : (
                  <Layer
                    id="fill-fallback"
                    type="fill"
                    paint={{ "fill-color": "#E5E7EB", "fill-opacity": 0.5 }}
                  />
                )
              ) : distinctFillLayer ? (
                <Layer {...distinctFillLayer} />
              ) : null}
              <Layer {...outlineHalo} />
              <Layer {...outlineDark} />
            </Source>

            {tip && (
              <Popup
                longitude={tip.lng}
                latitude={tip.lat}
                closeButton={false}
                closeOnClick={false}
                anchor="top"
                offset={12}
              >
                <div className="px-3 py-2 text-sm rounded-md border bg-white/95 shadow-lg min-w-[140px]">
                  <div className="font-semibold text-purple-600 text-base">
                    {tip.name}
                  </div>
                  <div className="font-large text-gray-800">
                    {normalized ? "per 1k: " : "Үзэлт: "}
                    {typeof tip.value === "number"
                      ? tip.value.toLocaleString()
                      : "—"}
                  </div>
                </div>
              </Popup>
            )}

            {/* Tooltip overlay — энэ хэсэг заавал КОМПОНЕНТЫН ДОТОР байх ёстой */}
            {/* {tip && (
              <div
                style={{
                  position: "absolute",
                  left: tip.x + 10,
                  top: tip.y + 10,
                }}
                className="pointer-events-none bg-white/90 backdrop-blur px-2 py-1 rounded text-xs shadow"
              >
                <div className="font-medium">{tip.name}</div>
                <div>
                  {metricKey === "per_1000" ? "per 1k: " : ""}
                  {tip.value?.toLocaleString?.() ?? "—"}
                </div>
              </div>
            )} */}
          </Map>
        ) : (
          <div className="h-full grid place-items-center text-gray-500">
            Loading map…
          </div>
        )}
      </div>

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

        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">Legend</div>
          {stats ? (
            <div className="space-y-2">
              {RAMP.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="inline-block w-6 h-4 rounded"
                    style={{ background: c }}
                  />
                  <span className="text-sm">
                    ≤ {Math.round(stats.breaks[i] || stats.min)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">—</div>
          )}
        </div>

        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">Top 5</div>
          <ol className="space-y-1">
            {Object.entries(dataMap)
              .filter(([, v]) => typeof v === "number")
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 5)
              .map(([slug, v]) => {
                // slug-аар нэр хайна
                const feature = styledGeo?.features.find(
                  (f: any) => f.properties.slug === slug
                );
                const displayName = feature?.properties?.name || slug;

                return (
                  <li key={slug} className="flex justify-between text-sm">
                    <span className="font-medium ">
                      {displayName}
                    </span>
                    <span className="font-semibold ">
                      {(v as number).toLocaleString()}
                    </span>
                  </li>
                );
              })}
          </ol>
        </div>
      </div>
    </main>
  );
}
