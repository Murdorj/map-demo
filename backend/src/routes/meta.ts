import { Router } from 'express';
import { Aimag } from '../models/Aimag';


const r = Router();


// GET /api/aimags
r.get('/aimags', async (req, res) => {
const items = await Aimag.find({}, { _id: 0, slug: 1, name: 1, households: 1 }).lean();
res.json({ aimags: items });
});


export default r;