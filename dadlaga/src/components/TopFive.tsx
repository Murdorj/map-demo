'use client';

import { MN_NAME_BY_SLUG } from '@/lib/constants';

export default function TopFive({ dataMap }: { dataMap: Record<string, number | null> }) {
  const items = Object.entries(dataMap)
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white/80 text-gray-700">
      <div className="font-semibold mb-3 text-gray-700">Top 5 аймаг</div>
      <ol className="space-y-2">
        {items.map(([slug, v], idx) => {
          const displayName = MN_NAME_BY_SLUG[slug] || slug;
          return (
            <li
              key={slug}
              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-800">
                {idx + 1}. {displayName}
              </span>
              <span className="font-bold text-blue-600">
                {(v as number).toLocaleString()}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
