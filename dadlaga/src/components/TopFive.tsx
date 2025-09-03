'use client';

import {MN_NAME_BY_SLUG} from '@/lib/constants';

export default function TopFive({dataMap}:{dataMap: Record<string, number|null>}) {
  const items = Object.entries(dataMap)
    .filter(([,v]) => typeof v === 'number')
    .sort((a,b)=> (b[1] as number) - (a[1] as number))
    .slice(0,5);

  return (
    <div className="p-4 border rounded">
      <div className="font-semibold mb-2">Top 5</div>
      <ol className="space-y-1">
        {items.map(([slug, v], idx) => {
          const displayName = MN_NAME_BY_SLUG[slug] || slug;
          return (
            <li key={slug} className="flex justify-between text-sm">
              <span className="font-medium">{idx+1}. {displayName}</span>
              <span className="font-semibold">{(v as number).toLocaleString()}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
