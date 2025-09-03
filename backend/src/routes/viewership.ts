import { Router } from 'express';
import { Viewership } from '../models/Viewership';
import { Aimag } from '../models/Aimag';


const r = Router();


// GET /api/viewership?date=YYYY-MM | YYYY-MM-DD & normalized=1
r.get('/viewership', async (req, res) => {
const { date, normalized } = req.query as { date?: string; normalized?: string };


// resolve target month/day → month span [start, end)
const now = new Date();
const target = date ? new Date(date) : now; // supports YYYY-MM or YYYY-MM-DD
const start = new Date(target.getFullYear(), target.getMonth(), 1);
const end = new Date(target.getFullYear(), target.getMonth() + 1, 1);


const raw = await Viewership.aggregate([
{ $match: { date: { $gte: start, $lt: end } } },
{ $group: { _id: '$aimag_slug', views: { $sum: '$views' } } },
{ $project: { _id: 0, aimag_slug: '$_id', views: 1 } }
]);


// attach households for normalization
const aimags = await Aimag.find({}, { _id: 0, slug: 1, households: 1 }).lean();
const hhMap = new Map(aimags.map(a => [a.slug, a.households || 0]));


const data = raw.map(it => {
const hh = hhMap.get(it.aimag_slug) || 0;
const per1k = hh > 0 ? (it.views / hh) * 1000 : null;
return {
aimag_slug: it.aimag_slug,
views: it.views,
per_1000: per1k
};
});


if (normalized === '1') {
return res.json({ date: `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}`, metric: 'per_1000', data });
}
res.json({ date: `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}`, metric: 'views', data });
});


// GET /api/viewership/trend/:slug?months=12
r.get('/viewership/trend/:slug', async (req, res) => {
const slug = req.params.slug;
const months = Number(req.query.months || 12);
const end = new Date();
const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);


const rows = await Viewership.aggregate([
{ $match: { aimag_slug: slug, date: { $gte: start, $lt: end } } },
{ $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, views: { $sum: '$views' } } },
{ $project: { _id: 0, ym: { $concat: [ { $toString: '$_id.y' }, '-', { $toString: '$_id.m' } ] }, views: 1 } },
{ $sort: { ym: 1 } }
]);


res.json({ slug, data: rows });
});


// POST /api/viewership (bulk insert)
r.post('/viewership', async (req, res) => {
const body = req.body as Array<{ aimag_slug: string; date: string; views: number; source?: string }>;
if (!Array.isArray(body)) return res.status(400).json({ error: 'Array required' });
const docs = body.map(b => ({ ...b, date: new Date(b.date) }));
await Viewership.insertMany(docs, { ordered: false });
res.json({ inserted: docs.length });
});


export default r;