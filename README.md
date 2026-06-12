# RKT APPARELS — Shop Billing Management System (Frontend)

A production-ready React + TypeScript frontend for the RKT Apparels Spring Boot
billing/inventory backend. Built with Vite, Tailwind CSS, shadcn-style UI
components, TanStack Query, React Hook Form + Zod, Axios, and Recharts.

---

## 1. Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (custom dark theme matching the brief's palette)
- **Shadcn-style UI primitives** (Radix UI under the hood)
- **React Router DOM v6** — routing & role-based guards
- **TanStack Query (React Query)** — server state, caching, refetching
- **Axios** — HTTP client with JWT interceptors
- **React Hook Form + Zod** — forms & validation
- **React Hot Toast** — notifications
- **Recharts** — dashboard & profit charts
- **Lucide React** — icons

---

## 2. Project Structure

```
src/
├── api/             # Axios instance + interceptors
├── components/
│   ├── ui/          # Base UI primitives (Button, Input, Dialog, Select, etc.)
│   ├── common/       # DataTable, StatCard, PageHeader, ConfirmDialog, EmptyState
│   └── layout/       # Sidebar, TopNav
├── config/
│   └── api.ts        # API_BASE_URL + ENDPOINTS registry (single source of truth)
├── contexts/
│   └── AuthContext.tsx
├── layouts/
│   └── AppLayout.tsx
├── pages/
│   ├── auth/          # Login
│   ├── dashboard/      # Admin/Manager dashboard
│   ├── billing/        # POS billing screen + invoices
│   ├── products/        # Products, Variants, Barcodes
│   ├── inventory/        # Stock management
│   ├── customers/         # Customer CRM
│   ├── reports/            # Daily/Monthly/Yearly/Custom reports
│   ├── profit/              # Admin-only profit analytics
│   ├── users/                # Admin-only user management
│   ├── settings/              # Admin-only shop settings
│   ├── audit/                  # Admin-only audit logs
│   └── errors/                  # 403 / 404 / 500
├── routes/
│   └── ProtectedRoute.tsx
├── services/
│   └── index.ts        # All API service functions, typed
├── types/
│   └── index.ts          # TypeScript interfaces generated from backend DTOs
└── utils/
    └── index.ts            # formatCurrency, formatDate, etc.
```

---

## 3. Getting Started

### Prerequisites

- Node.js 18+ and npm
- The Spring Boot backend running (default: `http://localhost:8080`)

### Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (Vite default).

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

Output is generated in `dist/`.

---

## 4. API Configuration (IMPORTANT)

**All backend URLs are centralized in one file:** `src/config/api.ts`

```ts
export const API_BASE_URL = 'http://localhost:8080'
```

To point the app at a different backend (staging, production, etc.), **change
only this one line**. No other file needs to be touched.

The `ENDPOINTS` object in the same file documents every endpoint used by the
app, including purpose, request shape, and response shape as comments.

---

## 5. Authentication & Roles

- JWT is obtained via `POST /api/auth/login` and stored in `localStorage`
  (`rkt_token`, `rkt_user`).
- Axios automatically attaches `Authorization: Bearer <token>` to every
  request via an interceptor (`src/api/axios.ts`).
- On `401 Unauthorized`, the user is logged out and redirected to `/login`.
- Role-based routing is enforced via `<ProtectedRoute allowedRoles={[...]}>`
  in `src/routes/ProtectedRoute.tsx` and `src/App.tsx`.

### Roles & Access

| Module           | ADMIN | MANAGER | USER (Cashier) |
|------------------|:-----:|:-------:|:---------------:|
| Dashboard        | ✅    | ✅      | ❌ (lands on Billing) |
| Billing/POS      | ✅    | ✅      | ✅ |
| Invoices         | ✅ (all) | ✅ (all) | ✅ (own only) |
| Products         | ✅    | ✅      | ❌ |
| Variants         | ✅    | ✅      | ❌ |
| Inventory        | ✅    | ✅      | ❌ |
| Barcodes         | ✅    | ✅      | ❌ |
| Customers        | ✅    | ✅      | ✅ |
| Reports          | ✅    | ✅      | ❌ |
| Profit Reports   | ✅    | ❌      | ❌ |
| User Management  | ✅    | ❌      | ❌ |
| Shop Settings    | ✅    | ❌      | ❌ |
| Audit Logs       | ✅    | ❌      | ❌ |

After login, **USER (Cashier)** accounts are redirected directly to
`/billing`. **ADMIN** and **MANAGER** accounts land on `/dashboard`.

---

## 6. Key Features

### Billing / POS Screen (`/billing`)
- Barcode scanner input — calls `GET /api/barcodes/search/{barcode}` and
  auto-adds the matched variant to the cart.
- Manual product search — calls `GET /api/products/variants/search?q=`.
- Cart with quantity controls, per-item discounts, invoice-level discount,
  notes, and live total calculation.
- Customer search/select or walk-in customer; create new customers inline.
- "Generate Invoice" → `POST /api/invoices`, then download the
  backend-generated PDF receipt.

### Products & Variants
- Full CRUD for products and variants with React Hook Form + Zod validation.
- Variant table shows cost price only to ADMIN (per backend DTO visibility).
- Low-stock badges driven by the `lowStock` flag from the API.

### Barcode Management (`/barcodes`)
- Generate / regenerate barcodes per variant.
- Live label preview (shop name, design, color/size, MRP, code, barcode).
- Download barcode as PNG or PDF.

### Inventory (`/inventory`)
- All-stock and low-stock views.
- Stock adjustment dialog (Add, Reduce, Purchase, Return, Adjustment,
  Damaged) → `POST /api/inventory/adjust`.
- Per-variant stock movement history.

### Reports (`/reports`)
- One-click Daily / Monthly / Yearly PDF reports.
- Custom date-range report generation.
- Report history with re-download and (admin) delete.

### Profit Reports (`/profit`, ADMIN only)
- Yearly profit table + bar chart (Revenue / Cost / Profit).
- Add/update monthly profit entries.

### User Management (`/users`, ADMIN only)
- Create/update users & managers, enable/disable accounts, reset passwords.

### Shop Settings (`/settings`, ADMIN only)
- Edit shop name, address, contact info, GST number, invoice footer message.

### Audit Logs (`/audit`, ADMIN only)
- Full activity log with action-type filter.

---

## 7. Error Handling

- Global Axios interceptor handles 401 (auto-logout), 403 (permission toast),
  500 (server error toast), and network errors.
- Dedicated `403`, `404`, `500` pages (`src/pages/errors/ErrorPages.tsx`).
- Forms show inline field-level validation errors via Zod.
- All async actions show loading states (button spinners, skeleton loaders).

---

## 8. Design System

Colors (Tailwind tokens defined in `tailwind.config.js`):

| Token       | Hex       |
|-------------|-----------|
| Background  | `#0F172A` |
| Sidebar     | `#1E293B` |
| Card        | `#334155` |
| Primary     | `#2563EB` |
| Success     | `#22C55E` |
| Warning     | `#F59E0B` |
| Danger      | `#EF4444` |
| Text Primary| `#F8FAFC` |
| Text Secondary | `#CBD5E1` |

Fonts: **Inter** (UI), **JetBrains Mono** (barcodes/codes).

---

## 9. Deployment

1. Set `API_BASE_URL` in `src/config/api.ts` to your production backend URL.
2. Run `npm run build`.
3. Deploy the contents of `dist/` to any static host (Nginx, Vercel,
   Netlify, S3 + CloudFront, etc.).
4. Ensure CORS is enabled on the backend for your frontend's domain, and that
   the backend is served over HTTPS if the frontend is.

### Example Nginx config (SPA routing)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/rkt-apparels/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 10. Notes for Backend Integration

- All request/response shapes in `src/types/index.ts` were generated directly
  from the backend's DTO classes (`com.shopbilling.dto.request.*` and
  `com.shopbilling.dto.response.*`).
- All responses are expected to be wrapped in
  `ApiResponse<T> { success, message, data, timestamp }`.
- Binary endpoints (barcode PNG/PDF, invoice PDF, report PDFs) are fetched
  with `responseType: 'blob'` and downloaded via `downloadBlob()` in
  `src/services/index.ts`.
