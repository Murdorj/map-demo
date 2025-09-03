'use client';

import {useEffect, useMemo, useState} from 'react';
import Map, {Source, Layer, MapLayerMouseEvent, Popup} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

import {RAMP, QUAL, SLUG_FIX, MN_NAME_BY_SLUG} from '@/lib/constants';
import {makeSlug} from '@/lib/slug';
import {ViewershipResponse} from '@/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Props = {
  geo: any | null;
  mode: 'choropleth' | 'distinct';
  normalized: boolean;
  view?: ViewershipResponse | any; // аль хэлбэр ирлээ ч даадаг байя
};

export default function MapView({geo, mode, normalized, view}: Props) {
  const dataMap = useMemo(() => {
    const m: Record<string, number|null> = {};
    const items = Array.isArray(view) ? view : Array.isArray(view?.data) ? view.data : [];
    items.forEach((it: any) => {
      const v = normalized ? it.per_1000 ?? null : it.views ?? null;
      m[it.aimag_slug] = v;
    });
    return m;
  }, [view, normalized]);

  const styledGeo = useMemo(() => {
    if (!geo) return null;
    const fixed = geo.features.map((f: any) => {
      const p = f.properties || {};
      const baseName: string = p.name || p.NL_NAME_1 || p.NAME_1 || p.NAME || 'N/A';
      const rawSlug = (p.slug || makeSlug(baseName) || '').toLowerCase().trim();
      const slug = SLUG_FIX[rawSlug] ?? rawSlug;

      const displayName =
        MN_NAME_BY_SLUG[slug] ||
        (p.NL_NAME_1 && p.NL_NAME_1 !== 'NA' ? p.NL_NAME_1 : p.NAME_1 || p.NAME || 'N/A');

      const value = dataMap[slug] ?? null;

      return {
        ...f,
        properties: {...p, name: displayName, slug, value},
      };
    });

    return {...geo, features: fixed};
  }, [geo, dataMap]);

  const stats = useMemo(() => {
    const vals = Object.values(dataMap).filter((v): v is number => typeof v === 'number');
    if (!vals.length) return null;
    const min = Math.min(...vals), max = Math.max(...vals);
    const n = RAMP.length;
    const breaks = Array.from({length: n - 1}, (_, i) => min + ((i + 1) * (max - min)) / n);
    return {min, max, breaks};
  }, [dataMap]);

  const fillLayer: any = useMemo(() => {
    if (!stats) return null;
    const stepExpr: any[] = ['step', ['get', 'value'], RAMP[0]];
    stats.breaks.forEach((b, i) => stepExpr.push(b, RAMP[i + 1]));
    const colorExpr: any[] = ['case', ['==', ['coalesce', ['get','value'], -1], -1], '#F2F4F7', stepExpr];
    return {id: 'fill-choropleth', type: 'fill', paint: {'fill-color': colorExpr, 'fill-opacity': 0.85}};
  }, [stats]);

  const distinctFillLayer: any = useMemo(() => {
    if (!styledGeo) return null;
    const slugs: string[] = styledGeo.features.map((f: any) => f.properties.slug);
    const expr: any[] = ['match', ['get', 'slug']];
    slugs.forEach((slug, i) => expr.push(slug, QUAL[i % QUAL.length]));
    expr.push('#E5E7EB');
    return {id: 'fill-distinct', type: 'fill', paint: {'fill-color': expr, 'fill-opacity': 0.9}};
  }, [styledGeo]);

  const outlineHalo: any = {id: 'outline-halo', type: 'line', paint: {'line-color': '#FFFFFF','line-width': 2.5,'line-opacity': 0.9}};
  const outlineDark: any = {id: 'outline-dark', type: 'line', paint: {'line-color': '#111827','line-width': 1.2,'line-opacity': 0.8}};

  const [tip, setTip] = useState<{lng:number; lat:number; name:string; value:number|null}|null>(null);
  function onMove(e: MapLayerMouseEvent) {
    const f = e.features?.[0];
    if (!f) return setTip(null);
    // @ts-ignore
    const slug = f.properties.slug as string;
    // @ts-ignore
    const name = f.properties.name as string;
    const value = dataMap[slug] ?? null;
    setTip({lng: e.lngLat.lng, lat: e.lngLat.lat, name, value});
  }

  useEffect(() => {
    if (!styledGeo || !view?.data) return;
    const geoSlugs = new Set(styledGeo.features.map((f: any) => f.properties.slug));
    const apiSlugs = new Set(view.data.map((x: any) => x.aimag_slug));
    const miss = [...geoSlugs].filter(s => !apiSlugs.has(s));
    if (miss.length) console.warn('Slug not found in API:', miss);
  }, [styledGeo, view]);

  if (!styledGeo) {
    return <div className="h-[80vh] grid place-items-center text-gray-500 border rounded">Loading map…</div>;
  }

  return (
    <div className="h-[80vh] relative rounded overflow-hidden border">
      <Map
        mapLib={mapboxgl}
        initialViewState={{ longitude: 103.8, latitude: 46.8, zoom: 3.2 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['fill-choropleth','fill-distinct']}
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
      >
        <Source id="aimags" type="geojson" data={styledGeo}>
          {mode === 'choropleth'
            ? (fillLayer ? <Layer {...fillLayer} /> : <Layer id="fill-fallback" type="fill" paint={{'fill-color':'#E5E7EB','fill-opacity':0.5}} />)
            : (distinctFillLayer ? <Layer {...distinctFillLayer} /> : null)}
          <Layer {...outlineHalo} />
          <Layer {...outlineDark} />
        </Source>

        {tip && (
          <Popup longitude={tip.lng} latitude={tip.lat} closeButton={false} closeOnClick={false} anchor="top" offset={12}>
            <div className="px-3 py-2 text-sm rounded-md border bg-white/95 shadow-lg min-w-[140px]">
              <div className="font-semibold text-purple-600 text-base">{tip.name}</div>
              <div className="font-medium text-gray-800">
                {normalized ? 'per 1k: ' : 'Үзэлт: '}
                {typeof tip.value === 'number' ? tip.value.toLocaleString() : '—'}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
