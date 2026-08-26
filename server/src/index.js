import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import menusRouter from './routes/menus.js';
import ordersRouter from './routes/orders.js';
import categoriesRouter from './routes/categories.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    const ts = new Date().toLocaleTimeString('id-ID');
    console.log(`[${ts}] ${req.method} ${req.url}`);
    next();
  });
}

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/menus', menusRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/categories', categoriesRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Bantu Cafe API', time: new Date().toISOString() });
});

// ─── 404 fallback ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Start server in standalone mode ──────────────────────────
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  🚀 Bantu Cafe API Server running at http://localhost:${PORT}`);
    console.log(`  📋 Endpoints:`);
    console.log(`     GET  /api/menus`);
    console.log(`     POST /api/orders`);
    console.log(`     GET  /api/orders/:order_code/status`);
    console.log(`     PATCH /api/orders/:id/approve\n`);
  });
}

export default app;
