import 'dotenv/config';
export const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mnb_viewership';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';