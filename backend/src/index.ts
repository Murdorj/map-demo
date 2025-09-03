import express from 'express';
import cors from 'cors';
import { CORS_ORIGIN, PORT } from './config';
import { connectDB } from './db';
import metaRoutes from './routes/meta';
import viewRoutes from './routes/viewership';


async function main() {
await connectDB();
const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', metaRoutes);
app.use('/api', viewRoutes);


app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
}
main().catch(err => { console.error(err); process.exit(1); });