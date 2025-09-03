const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function fetchAimags() {
  const r = await fetch(`${API}/api/aimags`, { cache: "no-store" });
  if (!r.ok) throw new Error("aimags");
  return r.json();
}

export async function fetchViewership(params: {
  date?: string;
  normalized?: boolean;
}) {
  const q = new URLSearchParams();
  if (params.date) q.set("date", params.date);
  if (params.normalized) q.set("normalized", "1");
  const r = await fetch(`${API}/api/viewership?${q.toString()}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error("viewership");
  return r.json();
}
