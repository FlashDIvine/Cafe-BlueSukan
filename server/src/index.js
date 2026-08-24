import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import menusRouter from './routes/menus.js';
import ordersRouter from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Bantu Cafe API', time: new Date().toISOString() });
});

// ─── 404 fallback ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🚀 Bantu Cafe API Server running at http://localhost:${PORT}`);
  console.log(`  📋 Endpoints:`);
  console.log(`     GET  /api/menus`);
  console.log(`     POST /api/orders`);
  console.log(`     GET  /api/orders/:order_code/status`);
  console.log(`     PATCH /api/orders/:id/approve\n`);
});
