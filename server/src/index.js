import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import compression from 'compression';

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
app.use(compression());
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

// Health & Lightweight Memory Diagnostic Endpoint
app.get('/api/health', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    service: "Angkringan Blue'sukan Kopi API",
    time: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    engine: process.env.DATABASE_URL ? 'Prisma PostgreSQL' : 'In-Memory Store',
    memory: {
      rssMB: +(mem.rss / (1024 * 1024)).toFixed(2),
      heapUsedMB: +(mem.heapUsed / (1024 * 1024)).toFixed(2),
      heapTotalMB: +(mem.heapTotal / (1024 * 1024)).toFixed(2),
      externalMB: +(mem.external / (1024 * 1024)).toFixed(2),
    },
  });
});

// ─── Production Static Frontend Serving ───────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  // Serve static files from Vite build output
  app.use(
    express.static(clientDistPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        // Never cache HTML files to ensure clients always get latest release
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  // SPA Fallback for client routes (excluding /api routes) - compatible with Express 4 & 5
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ─── 404 fallback (for unhandled API endpoints) ───────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ─── Start server in standalone mode ──────────────────────────
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`\n  🚀 Angkringan Blue'sukan Kopi API Server running at http://${HOST}:${PORT}`);
    console.log(`  📋 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  📋 Endpoints:`);
    console.log(`     GET  /`);
    console.log(`     GET  /api/health`);
    console.log(`     GET  /api/menus`);
    console.log(`     POST /api/orders`);
    console.log(`     GET  /api/orders/:order_code/status`);
    console.log(`     PATCH /api/orders/:id/approve\n`);
  });
}

export default app;
