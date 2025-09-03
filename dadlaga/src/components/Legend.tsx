'use client';
import {RAMP} from '@/lib/constants';

export default function Legend({breaks}:{breaks: number[]|null}) {
  if (!breaks) return (
    <div className="p-4 border rounded">
      <div className="font-semibold mb-2">Legend</div>
      <div className="text-sm text-gray-500">—</div>
    </div>
  );

  return (
    <div className="p-4 border rounded">
      <div className="font-semibold mb-2">Legend</div>
      <div className="space-y-2">
        {RAMP.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="inline-block w-6 h-4 rounded" style={{background: c}} />
            <span className="text-sm">≤ {Math.round(breaks[i] ?? breaks[0])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
