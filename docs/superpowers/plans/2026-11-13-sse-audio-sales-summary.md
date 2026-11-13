# Realtime SSE, Cashier Audio Alert & Daily Sales Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Server-Sent Events (SSE) for 1-way realtime communication between server, cashier, and customer; add Web Audio API chime notifications for new cashier orders; and build a daily sales summary aggregation endpoint and UI modal.

**Architecture:** 
1. Use Node.js `EventEmitter` to broadcast order changes from Express order route mutations (`POST`, `PUT`, `PATCH`) to an SSE stream endpoint (`/api/orders/stream`) with heartbeat and connection cleanup.
2. Replace blind 3-second client polling in `CashierPage.jsx` and `App.jsx` with `EventSource` listeners, with graceful fallback.
3. Use browser native `AudioContext` to synthesize an instant cafe chime on new incoming orders (`NEW_ORDER`) with a user-unlockable toggle.
4. Add `/api/orders/summary/daily` route aggregating completed/paid revenue, payment methods, and top 5 best sellers with support for both PostgreSQL (Prisma) and In-Memory fallback, surfaced via `SalesSummaryModal.jsx`.

**Tech Stack:** Express.js ESM, Node `events` (EventEmitter), Prisma ORM 6 / In-memory fallback, React 19, Lucide React, Web Audio API, Vanilla CSS.

---

## Global Constraints
- Style with existing Vanilla CSS Variables (Midnight Navy, Deep Cobalt, Glassmorphism). Do not introduce Tailwind.
- Keep Dual-Engine compatibility: all backend features must work seamlessly with Prisma (PostgreSQL) and the In-Memory storage fallback (`server/src/db.js`).
- Never overwrite static routes with dynamic routes: `/api/orders/stream` and `/api/orders/summary/daily` must be placed above `/:id` and `/:order_code/status`.

---

## Review Focus
1. Vercel serverless timeout on long-lived connections: ensure SSE headers (`X-Accel-Buffering`, `keep-alive`) and 15s heartbeat comments keep connection stable, while browser `EventSource` auto-reconnects on drop.
2. Autoplay policy rejection: ensure AudioContext is initialized/resumed on user interaction (sound toggle button) rather than on raw page load.
3. Case-insensitivity and null-handling in payment method aggregation (`cash` vs `Cash`, `qris` vs `QRIS`).
4. Avoid duplicate audio plays or double event broadcasts on concurrent operations.
5. In-Memory vs Prisma date filtering: Ensure UTC/WIB boundaries match target day correctly across both storage engines.

---

### Task 1: Backend Event Bus, SSE Stream & Order Mutation Broadcasts

**Files:**
- Modify: `server/src/routes/orders.js`
- Test: Verification via curl / fetch test script

**Interfaces:**
- Produces: `export const orderEvents = new EventEmitter();`
- Route: `GET /api/orders/stream`
  - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`
  - Output events: Initial `{ type: 'CONNECTED' }`, `{ type: 'NEW_ORDER', order_code, status }`, `{ type: 'STATUS_UPDATED', order_code, status }`, and `: heartbeat\n\n`
- Emits:
  - `POST /api/orders` -> `orderEvents.emit('order_changed', { type: 'NEW_ORDER', order_code, status })`
  - `PUT /api/orders/:id/items` -> `orderEvents.emit('order_changed', { type: 'STATUS_UPDATED', order_code, status })`
  - `PATCH /api/orders/:id/approve` -> `orderEvents.emit('order_changed', { type: 'STATUS_UPDATED', order_code, status })`
  - `PATCH /api/orders/:id/complete` -> `orderEvents.emit('order_changed', { type: 'STATUS_UPDATED', order_code, status })`
  - `PATCH /api/orders/:id/cancel` -> `orderEvents.emit('order_changed', { type: 'STATUS_UPDATED', order_code, status })`

- [x] **Step 1.1: Add EventEmitter and `/stream` endpoint to `server/src/routes/orders.js`**
- [x] **Step 1.2: Add `orderEvents.emit(...)` to all mutation endpoints (both Prisma and in-memory paths)**
- [x] **Step 1.3: Verify SSE endpoint connects and delivers events via a curl / node test script**

---

### Task 2: Backend Daily Sales Summary Endpoint

**Files:**
- Modify: `server/src/routes/orders.js`

**Interfaces:**
- Route: `GET /api/orders/summary/daily?date=YYYY-MM-DD`
- Output JSON format:
  ```json
  {
    "success": true,
    "date": "2026-11-13",
    "total_orders": 12,
    "total_revenue": 345000,
    "average_order_value": 28750,
    "payment_breakdown": {
      "Cash": 120000,
      "QRIS": 180000,
      "Debit": 45000
    },
    "top_items": [
      { "name": "Kopi Susu Gula Aren", "qty": 14, "revenue": 252000 }
    ]
  }
  ```

- [x] **Step 2.1: Add `GET /summary/daily` handler with date range filtering and aggregation for Prisma**
- [x] **Step 2.2: Add In-memory fallback aggregation matching the exact response shape**
- [x] **Step 2.3: Test endpoint with query params and verify calculation accuracy**

---

### Task 3: Audio Alert Helper & Cashier Page Integration

**Files:**
- Create: `client/src/utils/bellSound.js`
- Modify: `client/src/pages/CashierPage.jsx`
- Modify: `client/src/styles/cashier.css`

**Interfaces:**
- Produces: `playCashierBell()` in `client/src/utils/bellSound.js`
- Cashier UI:
  - Audio toggle button in header (`pos-btn-sound`) with state in `localStorage`
  - SSE listener `EventSource('/api/orders/stream')` triggering silent reload and audio chime on `NEW_ORDER`
  - Remove 3-second polling interval in favor of SSE with fallback sync

- [x] **Step 3.1: Create `client/src/utils/bellSound.js` using Web Audio API**
- [x] **Step 3.2: Wire SSE listener and audio notification in `CashierPage.jsx`**
- [x] **Step 3.3: Add sound toggle button & live status pill in POS header**
- [x] **Step 3.4: Add CSS styles for sound toggle and action controls**

---

### Task 4: Frontend Customer SSE Integration (Order Status Tracker)

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/ActiveOrderTracker.jsx`
- Modify: `client/src/components/OrderTicket.jsx`

**Interfaces:**
- Consumes: `/api/orders/stream`
- In `App.jsx`: Listen for status changes on `activeOrder.order_code` and immediately update `activeOrder` state.
- In `ActiveOrderTracker.jsx` & `OrderTicket.jsx`: Replace aggressive 3-second polling with passive prop updates and slow fallback polling.

- [x] **Step 4.1: Add SSE `EventSource('/api/orders/stream')` listener in `App.jsx` when `activeOrder` exists**
- [x] **Step 4.2: Relax/remove redundant 3-second polling in `ActiveOrderTracker.jsx` and `OrderTicket.jsx`**

---

### Task 5: Daily Sales Summary UI Component

**Files:**
- Modify: `client/src/services/api.js`
- Create: `client/src/components/SalesSummaryModal.jsx`
- Modify: `client/src/pages/CashierPage.jsx`
- Modify: `client/src/styles/cashier.css`

**Interfaces:**
- `fetchDailySalesSummaryApi(date)` in `client/src/services/api.js`
- `<SalesSummaryModal isOpen={isOpen} onClose={...} />` component displaying:
  - 3 Key Metrics: Total Omzet, Total Transaksi, Average Order Value
  - Payment Distribution bar and numbers (Cash, QRIS, Debit)
  - Top 5 Best Sellers table/cards
- Header button in `CashierPage.jsx`: "Laporan Hari Ini"

- [x] **Step 5.1: Add `fetchDailySalesSummaryApi` function in `client/src/services/api.js`**
- [x] **Step 5.2: Create `client/src/components/SalesSummaryModal.jsx`**
- [x] **Step 5.3: Add modal trigger button to `CashierPage.jsx` header and wire state**
- [x] **Step 5.4: Add CSS styling for `SalesSummaryModal` in `client/src/styles/cashier.css`**

---

### Task 6: Verification & End-to-End Testing

**Files:**
- Test all endpoints with curl and verify client build with `npm run build --prefix client`.

- [x] **Step 6.1: Run `npm run build --prefix client` and verify Vite build passes with 0 errors**
- [x] **Step 6.2: Test SSE broadcast on order creation and cashier status change**
- [x] **Step 6.3: Test daily summary calculation with test orders**
- [x] **Step 6.4: Update `GEMINI_PROJECT_SUMMARY.md` with the new SSE & Sales Summary capabilities**
