# Grocery Store POS — Frontend

Multi-tenant Point-of-Sale SPA for the `grocery-store` SaaS. Talks to the Spring Boot 4 backend over JWT-authenticated
REST.

## Stack

- **React 19** + **TypeScript 6** via **Vite 8** (Oxc-powered `@vitejs/plugin-react`)
- **Tailwind CSS v4** (CSS-first engine — all customization in `src/index.css`, no `tailwind.config.js`)
- **Zustand 5** for global state (auth session, future POS cart) with `persist` middleware
- **React Router DOM v7** (`createBrowserRouter` + `RouterProvider`)
- **Axios** with shared `apiClient` (auth-header interceptor, `401 → logout`)
- **lucide-react** for iconography

## Requirements

- Node 20.19+, 22.13+ or ≥ 24 (required by Vite 8 and ESLint 10)
- [pnpm](https://pnpm.io/) ≥ 9
- The `grocery-store` Spring Boot backend running locally on `http://localhost:8080` (or any URL
  exposed via `VITE_API_URL`)

## Setup

```bash
pnpm install
cp .env.example .env   # then edit VITE_API_URL if backend is not on :8080
pnpm dev
```

The dev server runs at `http://localhost:5173` and proxies API calls to `${VITE_API_URL}/api/v1`.

## Scripts

| Command        | What it does                                        |
|----------------|-----------------------------------------------------|
| `pnpm dev`     | Vite dev server with HMR (use `--host` to expose)   |
| `pnpm build`   | `tsc -b && vite build` — strict type-check + bundle |
| `pnpm lint`    | ESLint over the whole repo                          |
| `pnpm preview` | Serve the production build locally                  |

## Project structure

```
src/
  features/
    admin/        # SUPER_ADMIN provisioning flows (cold-start OWNER user)
    auth/         # Store + Admin login, JWT decoding, session store
    cash/         # Cash-shift lifecycle (open / close, gate over /pos/*)
    customers/    # Customer CRUD with credit-limit tracking + payments
    inventory/    # Manual stock adjustments (OWNER)
    notifications/# Server-push alerts (low stock, overdue credit) for OWNER
    products/     # Catalog + inventory with quick price / stock adjustments
    sales/        # POS checkout UI, sales history, ticket / agent printing
    settings/     # Local agent printer + station configuration
    stores/       # SaaS-admin store management
    users/        # Per-tenant staff (CASHIER / OWNER) management
  routes/
    AppRouter.tsx
    guards/       # AdminGuard, StoreGuard, OwnerGuard
  shared/
    api/          # apiClient (axios) + shared interceptors
    components/   # Layouts (AdminLayout, StoreLayout) + reusable UI
    hooks/        # useDebounce, useMobileMenu
    types/        # PageResponse<T> and other cross-feature types
```

Each feature folder follows the same skeleton: `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`.

## Authentication

Two separate flows backed by distinct backend endpoints:

| Role          | Login endpoint | Login route    | Lands on        |
|---------------|----------------|----------------|-----------------|
| `SUPER_ADMIN` | `/admin/login` | `/admin/login` | `/admin/stores` |
| `OWNER`       | `/auth/login`  | `/login`       | `/pos`          |
| `CASHIER`     | `/auth/login`  | `/login`       | `/pos`          |

Store login body uses `storeCode` (e.g. `"STORE001"`); the decoded JWT then exposes `storeId` (UUID string), `userId`,
and `role`.

## Routes (current)

```
/login                              StoreLogin (public)
/admin/login                        AdminLogin (public)
/admin                              AdminGuard → AdminLayout
  /admin/stores                     StoresList
  /admin/stores/new                 StoreForm (create)
  /admin/stores/:id/edit            StoreForm (edit)
  /admin/stores/:id/provision-owner ProvisionOwnerForm
/pos                                StoreGuard → StoreLayout
  /pos                              redirect → /pos/sales
  /pos/sales                        PosScreen      (cash register UI)
  /pos/sales-history                SalesList      (paginated history + reprint)
  /pos/products                     ProductsList   (OWNER + CASHIER read)
  /pos/customers                    CustomersList  (OWNER + CASHIER read/write)
  /pos/customers/new                CustomerForm
  /pos/customers/:id/edit           CustomerForm
  OwnerGuard (OWNER only)
    /pos/users                      UsersList
    /pos/users/new                  UserForm
    /pos/users/:id/edit             UserForm
    /pos/products/new               ProductForm
    /pos/products/:id/edit          ProductForm
```

## Environment

| Variable       | Default                 | Description                                                 |
|----------------|-------------------------|-------------------------------------------------------------|
| `VITE_API_URL` | `http://localhost:8080` | Backend root (the `/api/v1` prefix is added by `apiClient`) |

See `.env.example`.

## Conventions

This project follows a strict feature-driven architecture with shared primitives (axios client, `PageResponse<T>`, error
mappers, guards, layouts). Before adding a new feature module, read the established conventions in:

- [`CLAUDE.md`](./CLAUDE.md) — guidance for Claude Code
- [`AGENTS.md`](./AGENTS.md) — same content, addressed to any AI coding agent

Key rules captured there: snake_case TS DTOs when the backend uses `@JsonProperty`, BigDecimal as `string` (never
`number`), `SyntheticEvent` instead of the deprecated `FormEvent`, `useDebounce(searchInput, 400)` for remote search
lists, inline confirmation (never `window.confirm`), responsive table + mobile-card pattern, and accessibility rules for
focus rings, touch targets, and Escape-to-close drawers.

## Backend

The frontend assumes the companion Spring Boot 4 / Java 21 backend (separate repo) is running and reachable. Key
contracts the frontend depends on:

- `PageResponse<T>` shape: `{ content, page, size, totalElements, totalPages }`
- `ErrorResponse` shape: `{ error: string, message?: string, fields?: Record<string, string> }` — `fields` keys match
  the wire-format DTO keys
- JWT in `Authorization: Bearer <token>` (attached automatically by `apiClient`); a `401` triggers a silent global
  `logout()`
