# CLAUDE.md

Guidance for Claude Code on the `grocery-store` POS/SaaS frontend.

> **Companion file:** [`AGENTS.md`](./AGENTS.md) holds the same rules for non-Claude agents. **Keep both
> files byte-for-byte equivalent below the title block** — every edit here MUST be mirrored there in the
> same commit. Verify with `diff <(sed -n '/^## 0\. Commands/,$p' CLAUDE.md) <(sed -n '/^## 0\. Commands/,$p' AGENTS.md)`
> (exits 0 when in sync). User setup lives in [`README.md`](./README.md); this file is the engineering rulebook.

## 0. Commands

| Command         | Purpose                                                              |
|-----------------|----------------------------------------------------------------------|
| `pnpm install`  | Install dependencies (Node ≥ 20, **pnpm ≥ 9** required)              |
| `pnpm dev`      | Vite dev server with HMR; `--host` exposes it on the LAN             |
| `pnpm build`    | `tsc -b && vite build` — strict type-check + production bundle       |
| `pnpm lint`     | ESLint over the whole repo                                           |
| `pnpm preview`  | Serve the production build locally                                   |

**No test runner.** Verification baseline: `pnpm lint && pnpm build`, then `pnpm dev` for manual UI checks.

**Package manager — pnpm only.** `pnpm-lock.yaml` is source of truth. Never run `npm install` / `yarn` /
`npm run …` — desyncs lockfile and pulls mismatched transitive versions.

**Environment.** Copy `.env.example` → `.env`; only var is `VITE_API_URL` (default `http://localhost:8080`).
The `/api/v1` prefix is appended by `apiClient` — do not include it in the env value or feature paths.

## Quick orientation (read first)

Feature-driven React SPA. Two auth flows backed by separate endpoints (`/auth/login` store users →
`/pos`, `/admin/login` SaaS admins → `/admin/stores`), three guards (`AdminGuard`, `StoreGuard`,
`OwnerGuard`) under `src/routes/guards/`. Every `src/features/<domain>/` folder follows the same
skeleton: `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`. Cross-feature state lives in
Zustand stores (`useAuthStore`, `usePosStore`, `useCashShiftStore`, `useNotificationStore`,
`useSettingsStore`); each exposes `reset()` and `authStore.logout` chains them so a user-switch or
silent 401 wipes everything. All HTTP goes through `src/shared/api/api.ts` (`apiClient`) —
interceptors attach the JWT and turn `401` into a silent global logout. Cash shifts gate every
`/pos/*` route via a mandatory `OpenShiftModal`. Tailwind v4 (no config file); all custom CSS lives
in `src/index.css`. No test runner — verify with `pnpm lint && pnpm build` plus manual checks via
`pnpm dev`. Detailed conventions for every feature module live in §3 below; use the wayfinding map
at the top of that section to jump to the right rule.

## 1. Stack & Role

Senior Frontend Engineer building a multi-tenant POS SPA.

- **Framework:** React 19 + TypeScript 6 via Vite 8.
- **Styling:** Tailwind CSS v4 (CSS-first engine, no `tailwind.config.js`).
- **State:** Zustand 5. **Routing:** React Router DOM v7. **HTTP:** Axios.
- **Toasts:** `sonner` ^2.0.7 — single `<Toaster richColors position="top-right" />` mounted in
  `src/App.tsx`. Use `import { toast } from "sonner"` (`toast.success` / `toast.error`) for non-blocking
  feedback. Do not add a second toast library or a second `<Toaster>` instance.
- **JWT decode:** `jwt-decode` ^4.0.0 — only via helpers in `src/features/auth/utils/token.ts`
  (`decodeToken`, `isExpired`, `toAuthUser`). Never call `jwtDecode` directly elsewhere.
- **Barcode camera:** `html5-qrcode` 2.3.8 — only via `src/shared/components/scanner/CameraScannerModal.tsx`.
- **PWA:** `vite-plugin-pwa` ^1.3.0 — `VitePWA` plugin in `vite.config.ts`, `registerType: 'autoUpdate'`
  (cashiers get latest code on reload, no manual step), manifest `display: "standalone"` so the POS
  installs as a native-like app on Windows/Android/iOS. Service worker is **auto-generated** — never
  hand-write SW files. Icons: `logo.svg` (`sizes: 'any'`) plus `pwa-192x192.png` / `pwa-512x512.png`
  (PNGs added to `public/` manually). PWA `<head>` meta (`theme-color #0f172a`, `apple-touch-icon`) lives
  in `index.html`.
- **Backend:** Spring Boot 4.0 (Java 21) REST API, JWT auth, RBAC (Store Users vs SaaS Admins),
  ProblemDetails/ErrorResponse error structures.
- Two auth flows: `OWNER`/`CASHIER` vs `SUPER_ADMIN`. Highly responsive POS UI.

## 2. Restrictions & Rules

### Folder and Module Architecture

Feature-Driven (Domain) Architecture aligned with backend modules.

- `src/features/<feature-name>` — components, hooks, stores, API per domain (`admin`, `stores`, `users`,
  `products`, `sales`, `customers`, `cash`, `notifications`, `inventory`, `settings`).
- `src/shared/` — global UI components, utilities, generic hooks.
- `src/routes/` — route definitions mapping to feature pages.

### State & UI

- **Local vs Global:** Prefer `useState`/`useReducer`. Zustand only for shared state (POS Cart, Auth Session, Theme).
- **Persistence:** Zustand `persist` middleware with `partialize` to whitelist persisted keys. Re-validate
  derived flags inside `onRehydrateStorage` — never trust persisted flag directly. Always reassign
  `state.user = toAuthUser(decoded, state.user?.username ?? "")` after successful decode to normalize
  stale persisted payloads. Reference: `src/features/auth/store/authStore.ts`.
- **Tailwind v4:** All custom variables go in `src/index.css`. Do **not** create `tailwind.config.js`.
- **Icons:** `lucide-react`.
- **Design System:** Follow `.claude/skills/frontend-design`.
- **Mobile-First & Responsiveness:**
    - Page roots must NOT repeat `min-h-screen bg-slate-50` — `AdminLayout`/`StoreLayout` `<main>` provides it.
      Page wrappers start with `px-4 py-8` only.
    - Card/panel padding: `p-4 md:p-8`, never flat `p-8`.
    - Action headers (title + CTA): `flex flex-wrap` so they reflow on narrow screens.
    - **Data tables:** wrap table in `<div className="hidden md:block ...">` and add a
      `<ul className="... md:hidden">` card list for mobile. Mobile cards show essentials only
      (code, name, status, actions); defer secondary columns (owner, phone, date) to desktop.
    - **Touch targets:** standalone interactive elements minimum `py-2.5` (≈44 px). `NavLink` minimum `py-3`.
      Never use `py-1` / `py-1.5` on buttons.
- **Accessibility (a11y):** Semantic HTML (`<nav>`, `<main>`, `<aside>`, `<header>`). ARIA attrs
  (`aria-label`, `aria-expanded`, `aria-hidden`) on interactive/collapsible elements. Keyboard navigable,
  visible focus.
    - Every button/link/input: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-<color>`.
    - Pagination controls: `aria-label="Go to previous page"` / `aria-label="Go to next page"`.
    - **Never `window.confirm()`** for destructive actions. Use inline confirmation UI (state key +
      confirmation row/card) so screen readers announce and keyboard users can respond.
    - Slide-in drawers close on `Escape` via `useEffect` attaching `keydown` only while open, cleaned up
      on close/unmount.

### Integration & APIs (Axios)

- **Base URL:** Axios reads `import.meta.env.VITE_API_URL` (fallback `http://localhost:8080`) and bakes
  `/api/v1` into `baseURL`. Feature paths are clean (`/auth/login`, `/products`, etc.).
- **Auth endpoints:** `POST /auth/login` (store users, body `{ storeCode, username, password }`) and
  `POST /admin/login` (admins, body `{ username, password }`).
- **storeCode vs storeId / IDs as string:** Login *body* uses `storeCode` (string, e.g., `"STORE001"`).
  JWT *claims* use `storeId` (UUID string), `userId` (UUID string), `role`, `sub`, `iss`, `iat`, `exp`.
  Admin tokens carry `adminId` (UUID string) + `role`. Never send `storeCode` to authenticated endpoints,
  never send `storeId` to admin requests. **Do NOT type `storeId`/`userId`/`adminId` as `number`** — backend
  emits via `uuid.toString()`. `DecodedToken` and `AuthUser` in `src/features/auth/types/index.ts` type
  these as `?: string`.
- **TypeScript DTOs:** Never `any`. Strict `interface`/`type` matching backend DTOs (`PageResponse<T>`,
  `ErrorResponse`, etc.).
- **Auth Interceptors:** Axios interceptors auto-attach JWT. Read token via
  `useAuthStore.getState().token` (no React binding, no circular import). On `401`, response interceptor
  calls `useAuthStore.getState().logout()` for silent global session clear.
- **Error Handling:** Map HTTP statuses + `error` codes to user-friendly UI. Common: `invalid_credentials`,
  `store_inactive`, `store_not_found`, `validation_failed` (auth); `store_code_taken` (stores conflict —
  not generic `conflict`). Use `mapAuthError(err)` from `src/features/auth/utils/errorMessages.ts` for auth.
  Other features create per-feature `mapXxxError` following the same `Record<errorCode, message>` +
  `axios.isAxiosError` shape (reference: `src/features/stores/utils/errorMessages.ts`).
- **No Business Logic Duplication:** Backend is source of truth for calculations, taxes, validations.

### SOLID & Clean Code

- **SRP:** Components small. Above 150–200 lines, extract logic into custom hooks.
- **Strict typing:** No implicit any. `tsconfig.json` strict mode on.
- **React 19 imports:** No namespace imports for React types (avoid `icon: React.ReactNode;`). Use named
  imports (`import { ReactNode, SyntheticEvent } from 'react';`). **Forms:** `FormEvent` is deprecated
  for native events in React 19 — for `onSubmit`, use `SyntheticEvent` (e.g.,
  `e: SyntheticEvent<HTMLFormElement, SubmitEvent>`).

## 3. Established Conventions (reuse, do not reinvent)

`auth` and `stores` modules set the precedent.

**Wayfinding for this section** — where each topic lives below:

- **Shared HTTP, auth session, guards, routing, error mapping** — first cluster of bullets
  (`apiClient`, `useAuthStore`, `AdminGuard`/`StoreGuard`/`OwnerGuard`, `mapXxxError` registry).
- **DTO conventions** — "DTO immutability & minimal surface", "DTO field naming mirrors wire format",
  "BigDecimal as `string` in TS".
- **Layout & responsive UI** — "Layout nesting", "Responsive data tables", "Mobile menu / drawer
  shared hook", "Modal entrance / exit animation pattern", "Mobile slide-in drawer pattern", "Global
  scrollbar-gutter", "POS full-bleed layout escape".
- **List patterns** — "List search pattern (remote vs local)", "Cross-feature deep-link via URL
  params", "Self-action protection", "Hide actions already in target state", "Threshold warning
  indicators", "Inline destructive confirmation".
- **POS / cart** — "POS / sales module" + "Sales history list".
- **Cash shift gate** — "Cash shifts module (`/pos/*` gate)".
- **Scanner & scale** — "Barcode scanning (dual: HID scanner + camera)", "Physical scale integration".
- **Product images** — "Product images (upload + thumbnails)".
- **Notifications, inventory, credit payments** — short sub-sections near the end.
- **Agent printer settings** — "Agent printer settings — multi-station".
- **Lint compliance** — "Lint compliance — `react-hooks/set-state-in-effect`" and "`react-hooks/refs`".

Subsequent features MUST reuse these primitives:

- **Axios client:** `src/shared/api/api.ts` exports `apiClient`. All feature APIs import this — no
  per-feature Axios instances. Auth header + 401→logout interceptors already wired.
- **Auth session store:** `src/features/auth/store/authStore.ts` exports `useAuthStore` with shape
  `{ token, user, isAuthenticated, setToken, logout }`. Read via `useAuthStore((s) => s.user)`.
- **Shared types:** `src/shared/types/index.ts` exports `PageResponse<T>`. Import for all paginated
  responses — do not redefine per feature.
- **Error mapping:** `src/features/auth/utils/errorMessages.ts` exports `mapAuthError(err)`. Each feature
  defines its own `mapXxxError`:
    - `mapStoresError` — `src/features/stores/utils/errorMessages.ts`
    - `mapAdminProvisioningError` — `src/features/admin/utils/errorMessages.ts`
    - `mapUsersError` — `src/features/users/utils/errorMessages.ts` (codes: `username_taken`,
      `user_not_found`, `validation_failed`, `forbidden`)
    - `mapCustomersError` — `src/features/customers/utils/errorMessages.ts` (codes: `customer_not_found`,
      `validation_failed`, `forbidden`)
    - `mapSalesError` — `src/features/sales/utils/errorMessages.ts` (codes: `invalid_mixed_payment`,
      `credit_limit_exceeded`, `customer_required`, `product_not_found`, `customer_not_found`, `conflict`,
      `validation_failed`, `forbidden`)
    - `mapCashShiftError` — `src/features/cash/utils/errorMessages.ts` (codes: `shift_already_open`,
      `open_shift_not_found`, `validation_failed`, `forbidden`)
    - `mapNotificationsError` — `src/features/notifications/utils/errorMessages.ts` (codes:
      `notification_not_found`, `forbidden`)
    - `mapInventoryError` — `src/features/inventory/utils/errorMessages.ts` (codes: `product_not_found`,
      `reason_not_allowed`, `validation_failed`, `forbidden`, `conflict`)
    - `mapProductsError` — `src/features/products/utils/errorMessages.ts` (codes: `product_not_found`,
      `product_barcode_taken`, `validation_failed`, `forbidden`, `conflict`, `image_type_not_allowed`,
      `image_too_large`, `file_required`)

  Never add unrelated error codes to another feature's map.
- **Field-level error state:** When endpoint returns `400` `{ error: "validation_failed", fields:
  Record<string, string> }`, capture in
  `const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})`. In catch:
  `if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) setFieldErrors(err.response.data.fields)`.
  Backend `Map<String, String>` arrives as `Record<string, string>` — no transform. Clear with
  `setFieldErrors({})` at start of each submit. Render inline below `<input>` as
  `<p className="text-rose-500 text-sm mt-1">`. Use `inputClass(hasError: boolean)` to toggle
  `border-rose-500 focus:border-rose-500 focus:ring-rose-300/40`. Reference:
  `src/features/admin/components/ProvisionOwnerForm.tsx`.
- **Token utilities:** `src/features/auth/utils/token.ts` — `decodeToken`, `isExpired`, `toAuthUser`. Reuse;
  do not call `jwtDecode` directly elsewhere. `decodeToken` is hardened against tampering: it returns
  `null` not only when `jwtDecode` throws (invalid base64) but also when the payload fails shape
  validation (`exp` not a `number`, or `role` not one of `OWNER`/`CASHIER`/`SUPER_ADMIN`). This closes
  the hole where a `{}`-payload token makes `isExpired` compute `NaN < now` → "never expires" with an
  `undefined` role. `setToken` and `authStore`'s `onRehydrateStorage` rely on this `null` to destroy a
  manipulated session — never weaken `decodeToken` to return a partial payload.
- **Route guards:** Three guards in `src/routes/guards/`:
    - `AdminGuard` — `SUPER_ADMIN` only; unauthenticated → `/admin/login`, wrong role → `/login`.
    - `StoreGuard` — `OWNER` or `CASHIER`; else → `/login`. Accepts optional `children` prop (mirrors `AdminGuard`).
    - `OwnerGuard` — `OWNER` only; CASHIER → `/pos`; unauthenticated/other → `/login`. Used as layout
      route (no `children`, renders `<Outlet />`).

  Pattern: read `isAuthenticated` + `user.role` from `useAuthStore`, return `<Navigate replace>`
  synchronously on failure. **Never** `useEffect + navigate` for auth redirects.
- **Post-login navigation:** Redirect targets in hooks (`src/features/auth/hooks/useLogin.ts`), not
  components. `useAdminLogin` → `/admin/stores`. `useStoreLogin` → `/pos`.
- **Routing:** `src/routes/AppRouter.tsx` uses `createBrowserRouter` + `RouterProvider`. Route map:
    - `/login` — StoreLogin (public)
    - `/admin/login` — AdminLogin (public)
    - `/admin` — AdminGuard → AdminLayout (SUPER_ADMIN)
        - `/admin/stores` — StoresList
        - `/admin/stores/new` — StoreForm (create)
        - `/admin/stores/:id/edit` — StoreForm (edit)
        - `/admin/stores/:id/provision-owner` — ProvisionOwnerForm (cold-start OWNER user)
    - `/pos` — StoreGuard → StoreLayout (OWNER / CASHIER)
        - `/pos` (index) — `<Navigate to="sales" replace />`
        - `/pos/sales` — PosScreen (cash register UI: catalog + cart + checkout)
        - `/pos/sales-history` — SalesList (OWNER + CASHIER; paginated history, view + reprint)
        - `/pos/products` — ProductsList (OWNER + CASHIER read; OWNER-only writes nested under OwnerGuard)
        - `/pos/customers` — CustomersList (OWNER + CASHIER read-only; OWNER-only writes nested under OwnerGuard)
        - OwnerGuard (layout route, OWNER only)
            - `/pos/users` — UsersList
            - `/pos/users/new` — UserForm (create)
            - `/pos/users/:id/edit` — UserForm (edit)
            - `/pos/products/new` — ProductForm (create)
            - `/pos/products/:id/edit` — ProductForm (edit)
            - `/pos/customers/new` — CustomerForm (create, OWNER only)
            - `/pos/customers/:id/edit` — CustomerForm (edit, OWNER only)
    - `/` → redirect `/login` | `*` → redirect `/login`
- **Feature folder layout:** `src/features/<domain>/{api,components,hooks,store,types,utils}`. Cross-feature
  deps go through `src/shared/`.
- **Forms:** HTML5 native validation (`required`, `type="email"`, `pattern`, `maxLength`) for MVP. Promote
  to a validation library only when cross-field rules are needed.
- **DTO immutability & minimal surface:** Some fields are immutable post-create (`Store.code`,
  `User.username`). Exclude from `UpdateXxxRequest`, render `disabled` in edit forms with "cannot be
  changed" hint. Keep `UpdateXxxRequest` minimal — backend may accept more optional fields (e.g.,
  `password`, `active` on `UpdateUserRequest`) intentionally out of scope; document the omission with a
  one-line comment in the types file.
- **DTO field naming mirrors wire format:** Match TS field names to backend JSON keys — no camelCase ↔
  snake_case translation layer. Backends with `@JsonProperty(snake_case)` (Products, Customers) → snake_case
  TS keys (`full_name`, `credit_limit`, `outstanding_balance`, `purchase_cost`). The `fields` map in
  `validation_failed` uses the same keys, so `fieldErrors.full_name` indexes directly. Backends emitting
  camelCase (Stores, Users) → camelCase in TS. **Derived/server-managed fields excluded from `Create*` /
  `Update*` types** (e.g., `outstanding_balance` — mutated only by sales/payments). References:
  `src/features/customers/types/index.ts`, `src/features/products/types/index.ts`.
- **BigDecimal as `string` in TS:** Backend monetary/decimal fields cross the wire as JSON numbers but MUST
  be typed `string` in TS to avoid float precision loss. Forms accept raw input as `string` and forward
  unchanged; Jackson re-parses to `BigDecimal` server-side. Format display via
  `Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })` (helpers: `formatMoney` in
  `ProductsList.tsx`, `CustomersList.tsx`). Never `parseFloat` for arithmetic that will be persisted; use
  `Number()` only for display-only ratio checks (e.g., credit-usage thresholds).
- **Layout nesting:** `AdminLayout` and `StoreLayout` (in `src/shared/components/layout/`) render
  `<main className="flex-1 bg-slate-50 p-6 md:p-8">`. Pages inside MUST NOT add `min-h-screen` or
  `bg-slate-50`. Page root: `<div className="px-4 py-8">`.
- **Responsive data tables:** `<div className="hidden md:block ..."><table>` desktop +
  `<ul className="md:hidden ...">` of `<li>` cards mobile. Reference: `StoresList.tsx`.
- **Inline destructive confirmation:** local state (`confirmDeleteId: string | null`) + in-place
  confirmation row/card. Confirm + Abort buttons meet touch-target rules. Reference: `StoresList.tsx`.
- **Threshold warning indicators (credit usage, low stock, etc.):** When a numeric value crosses a business
  threshold relative to a related limit (e.g., `outstanding_balance >= 0.9 * credit_limit`,
  `current_stock <= minimum_stock`), the cue MUST combine **color + weight + icon + accessible text** —
  never color alone (WCAG 1.4.1). Pattern: `text-rose-600 font-semibold` on the value cell +
  `<AlertTriangle aria-hidden className="inline w-4 h-4 mr-1" />` + `title=` (or `aria-label` on a badge).
  Guard ratio computations against divide-by-zero (`if (limit <= 0) return false`) so a customer without
  credit is never marked. References: `CustomersList.tsx` (`isHighCredit`), `ProductsList.tsx` (`stockBadge`).
- **Mobile menu / drawer shared hook:** `src/shared/hooks/useMobileMenu.ts` exports `useMobileMenu()`
  (returns `{ isMobileMenuOpen, setIsMobileMenuOpen, closeMenu }`) and `navLinkClass`. Layouts with a
  slide-in sidebar **must** use this hook — do not inline `useState` + `useEffect`. Hook attaches
  `keydown` only while drawer open and cleans up (Escape closes). Reference: `AdminLayout.tsx`,
  `StoreLayout.tsx`.
- **Debounce shared hook:** `src/shared/hooks/useDebounce.ts` exports
  `useDebounce<T>(value: T, delay: number): T`. Use for any debounced input. Do **not** inline
  `setTimeout` + `clearTimeout` per feature.
- **List search pattern (remote vs local):** Paginated server-side lists (Stores, Products, Customers) use
  **remote** search — debounce input via `useDebounce(searchInput, 400)`, pass `debouncedSearch ||
  undefined` as optional `search?: string` to API method (forwarded as `search` query param), add
  `debouncedSearch` to `useCallback` deps of `load`. Reset to page 0 with dedicated
  `useEffect(() => { setPage(0); }, [debouncedSearch])` so a query never lands out-of-range.
  Small/per-tenant lists (Users) use **local** filter — plain `useState`, no debounce, derive
  `filteredUsers` before `return`, swap **both** `users.map` calls AND empty-state `length === 0` checks
  to filtered array. UI: relative wrapper with absolute `Search` icon (`aria-hidden`),
  `<input type="search">` with explicit `aria-label` + placeholder naming searchable fields (e.g.,
  `"Buscar por nombre o código..."`, `"Buscar por nombre o código de barras..."`,
  `"Buscar por nombre o teléfono..."`, `"Buscar por nombre o usuario..."`). Filter row container:
  `flex flex-wrap items-center gap-3`; input wrapper: `relative flex-1 min-w-48`. Backend `search` is
  case-insensitive substring on: store `name`+`code`, product `name`+`barcode`, customer
  `full_name`+`phone`. References: `StoresList.tsx`, `ProductsList.tsx`, `CustomersList.tsx` (remote);
  `UsersList.tsx` (local).
- **Admin provisioning pattern:** One-shot admin endpoints (cold-start user creation) belong in
  `src/features/admin/api/` and `src/features/admin/utils/`, not generic user CRUD. Endpoint
  `POST /admin/stores/:storeId/users` is called via `provisionStoreOwner(storeId, data)` in
  `src/features/admin/api/adminProvisioningApi.ts`. Shared user types (`UserRole`, `UserResponse`,
  `CreateUserRequest`) live in `src/features/users/types/index.ts`; `UserRole` re-exported from
  `src/features/auth/types`.
- **Preventive vs reactive UX for action buttons:** Disable action buttons only based on the resource's own
  status field (e.g., `disabled={s.status === "CANCELED"}`). Never infer state of a *different* entity
  from a related field — `Store.ownerName` is a billing contact string, not an indicator of whether an
  `OWNER` user exists. For business-rule conflicts (e.g., `store_owner_exists`), rely on the backend 409
  and surface in the form's error alert. Add informative `title` / `aria-label` on disabled buttons.
- **Regex `pattern` safety:** In HTML `pattern` attrs and JS `RegExp` strings, place hyphen at start or end
  of character class to avoid ambiguous range: use `[-a-zA-Z0-9._]`, never `[a-zA-Z0-9._-]`.
- **Self-action protection (hide, not disable):** When a list allows deleting/deactivating a resource that
  could be the logged-in user, **hide** the destructive button on that row — do not disable. Compare
  `resource.id === useAuthStore((s) => s.user?.userId)` (string equality after UUID fix). Reference:
  `src/features/users/components/UsersList.tsx`.
- **Hide actions already in target state:** Soft-delete endpoints (e.g., `DELETE /customers/:id` flips
  `active=false`) are idempotent on the backend. Pattern: gate with
  `{c.active && (<button …>Desactivar</button>)}` rather than `disabled={!c.active}`. Edit button stays
  visible because data correction (and reactivation) is still useful on inactive rows. Reference:
  `src/features/customers/components/CustomersList.tsx`.
- **Distinct sidebar icons per nav target:** Every `NavLink` uses a visually distinct lucide icon. Current
  in `StoreLayout.tsx`: `ShoppingCart` → `/pos/sales`, `ListOrdered` → `/pos/sales-history`, `Package` →
  Productos, `UserRound` → Clientes, `Users` → Usuarios (staff). New nav targets must pick a glyph not
  already used.

- **Cross-feature deep-link via URL params:** When a list links into another feature's filtered view
  (e.g. `CustomersList` → `/pos/sales-history?customerId=<id>`), encode the filter as a query param
  rather than navigating via global state. Target view reads with `useSearchParams`, renders a removable
  chip naming the filtered entity, and clears it with `setSearchParams(next)` (where `next` deletes the
  key). Resolve human-readable labels with a lightweight fetch (e.g., `getCustomerById` on mount). Keeps
  the URL shareable and avoids coupling features through Zustand. Reference:
  `src/features/customers/components/CustomersList.tsx` (link) and
  `src/features/sales/components/SalesList.tsx` (consumer).

- **POS / sales module (`/pos/sales`):** Cash register UI lives in `src/features/sales/`. Reusable parts:
    - **Cart store (`src/features/sales/store/posStore.ts`):** `usePosStore` exposes
      `{ cart, selectedCustomerId, addItem, updateItemQuantity, removeItem, setCustomer, clearCart }`.
      Selectors `useCartTotal()` and `useCartItemCount()` exported from same file. In-memory only
      (no persist) — closing tab clears it intentionally.
      - `CartItem` carries `unitOfMeasure: UnitOfMeasure` (re-exported via `sales/types/index.ts` from
        `../../products/types`). Never omit when constructing a cart item.
      - `addItem(product, quantity = 1)` — pass `1` for PIECE (default); pass weighed decimal for KILO
        (e.g., `0.250`). `ProductForCart` (exported from `posStore.ts`) requires
        `unit_of_measure: UnitOfMeasure`. When product already in cart, passed quantity is **added** to
        existing total — not hardcoded `+1`.
      - **Float precision (IEEE 754):** All quantity mutations go through
        `sanitizeQty = (v: number) => Number(v.toFixed(3))` (module-level in `posStore.ts`) to prevent
        drift accumulation. Applied in `addItem` on **both** branches — merge wraps `existing + new`,
        new-item branch wraps the raw `quantity` argument (so a caller passing `0.1 + 0.2` cannot
        persist drift). Also applied in `updateItemQuantity`. `useCartItemCount` applies
        `Number(...toFixed(3))` to the running sum. Never bypass `sanitizeQty`.
    - **Sales API:** `src/features/sales/api/salesApi.ts` — `createSale(data)`,
      `getSales({ page, size, sort? })`. `sort` defaults to `"createdAt,desc"`. Backend auto-assigns
      `cashier_id` from JWT — never send it.
    - **Sale request DTO uses snake_case** (`payment_method`, `customer_id`, `amount_paid`,
      `items[].product_id`, `items[].quantity`, `items[].unit_price`). All decimal fields are strings.
      Per payment method: CARD/TRANSFER → `amount_paid = total`; CASH → `amount_paid = amountReceived`;
      CREDIT → `amount_paid = "0"`; MIXED → `0 < amount_paid < total` and `customer_id` required
      (backend code `invalid_mixed_payment`). Items always serialize `quantity` as
      `item.quantity.toFixed(3)` and `unit_price` as `item.unitPrice.toFixed(2)` — never `.toString()`,
      which would preserve IEEE 754 drift as invalid wire strings.
    - **Quick Cash Buttons (`CheckoutModal`):** Two-row denomination grid rendered only inside
      `{showCalculator && ...}` (CASH method; MIXED toggle inside same block).
      `const QUICK_CASH = [50, 100, 200, 500, 1000] as const` (bills),
      `const QUICK_COINS = [1, 2, 5, 10, 20] as const` (coins). Additive handler:
      `setAmountPaid(prev => ((parseFloat(prev || "0") || 0) + value).toString())` — outer `|| 0` guards
      `NaN`. "Exacto" overwrites: `setAmountPaid(total.toFixed(2))`. "Limpiar" resets: `setAmountPaid("")`.
      Buttons: `h-12 active:scale-95 transition-transform focus-visible:ring-2`. Layout:
      `flex flex-col gap-2 mt-4` → two `grid grid-cols-6 gap-2` rows. "Exacto":
      `bg-indigo-600 text-white hover:bg-indigo-700`. "Limpiar": `bg-rose-100 text-rose-700`.
    - **POS data hooks:** `src/features/sales/hooks/usePosProducts.ts` (debounced 300 ms search,
      page-size 40, active-only) and `usePosCustomers.ts` (single fetch active customers, dropdown
      filtered locally). Both wrap async `load` in `useCallback` and call via
      `useEffect(() => { void load(); }, [load])` to satisfy `react-hooks/set-state-in-effect`. Reuse
      instead of inlining `getProducts` / `getCustomers` in POS components.
    - **POS formatters:** `src/features/sales/utils/format.ts` exports `formatMoney`, `getInitials`,
      `pastelColorFromId` (deterministic UUID → tailwind class), `formatSaleId` (8-char uppercase prefix),
      `formatSaleDate` (epoch-safe — falls back to `new Date()` when null/invalid/pre-1970). Never call
      `Intl.DateTimeFormat` directly on `created_at` without this guard, or "1969" leaks into the UI.
    - **QuantityModal (`src/features/sales/components/QuantityModal.tsx`):** Centered modal with giant
      `type="number" step="0.001"` input. Props: `{ open, onClose, onConfirm, initialValue?,
      unitOfMeasure, productName }`. Label: "Ingresar peso (kg)" for KILO, "Ingresar cantidad" for
      PIECE. Uses `useModalAnimation`. Two call sites: (1) `PosScreen` —
      `kiloProduct: ProductResponse | null` state, KILO card clicks open this modal, PIECE cards call
      `addItem` directly. (2) `CartSidebar` — `editingItem: CartItem | null` state, clicking quantity
      chip opens this modal.
    - **ProductGrid `onProductClick` prop:** Required
      `onProductClick: (product: ProductResponse) => void` — no longer calls `addItem` directly.
      `PosScreen` owns dispatch (KILO → `QuantityModal`, PIECE → `addItem`). `ProductCard` receives
      `onAdd` from `ProductGrid`.
    - **Cart quantity formatting:** `formatQty(item: CartItem)` inside `CartSidebar` —
      KILO: `` `${qty.toFixed(3)} kg` ``; PIECE integer: `` `${qty} pz` ``; PIECE fraction:
      `` `${qty.toFixed(1)} pz` ``. Quantity chip between `−` / `+` is a clickable `<button>` opening
      `QuantityModal` pre-filled.

- **Sales history list (`/pos/sales-history`):** Read-only paginated list. Component:
  `src/features/sales/components/SalesList.tsx`. Reuses `SaleSummaryModal` and formatters from
  `sales/utils/format.ts`.
    - **Server-side filters available:** `GET /sales` accepts `page`/`size`/`sort` plus `customerId`
      (UUID string), `paymentMethod`, `search` (case-insensitive substring), `startDate` / `endDate`
      (ISO date strings). `SalesList.tsx` reads them from URL params via `useSearchParams` so links are
      shareable. Deep-link `/pos/sales-history?customerId=<id>` from `CustomersList` filters the history
      by customer and renders a removable chip that clears the param via `setSearchParams(next)`. Search
      input uses `useDebounce(searchInput, 400)` + a dedicated `useEffect(() => setPage(0), [filters])`
      reset. Reuse this pattern for future filters — never add a filter the backend silently ignores.
    - **On-demand product name resolution:** `openSale(sale)` calls
      `Promise.all(uniqueProductIds.map(id => getProductById(id).catch(() => null)))`, builds
      `CartItem[]`, passes to `SaleSummaryModal`. Individual 404s fall back to name `"Producto"` so they
      never block viewing the ticket.
    - **Per-row loading state:** `loadingDetailId: string | null` tracks in-flight row. Other rows stay
      interactive. Pattern: `disabled={loadingDetailId === s.id}`.
    - **Table layout stability:** `<table className="w-full table-fixed">` + fixed `<th>` widths
      (`w-32`/`w-40`) prevent column reflow. `table-auto` recalculates on every setState.
    - **Fixed-width action buttons:** Buttons toggling loading state MUST carry `w-32 justify-center` so
      they're dimension-stable when text toggles ("Ver ticket" ↔ "Cargando..."). Swap icon conditionally:
      `loadingDetailId === s.id ? <Loader2 className="animate-spin" /> : <ReceiptText />`. Text-width
      delta on a free-width button causes column shift even inside `table-fixed` cells.
    - **Modal without tenderedAmount:** Pass no `tenderedAmount` (not persisted post-sale); the cash/change
      section in `SaleSummaryModal` is auto-hidden by its own `showCash`/`showChange` guards.
    - **Sale cancellation (`CancelSaleModal`):** `src/features/sales/components/CancelSaleModal.tsx` —
      opens from `SalesList` (OWNER only). Calls `cancelSale(id, reason, notes?)` which posts to
      `POST /sales/:id/cancel` with body `{ reason, notes? }`.
      `CancellationReason = "CASHIER_ERROR" | "CUSTOMER_REGRET" |
      "WRONG_PRODUCT" | "OTHER"`. Blocking while submitting; state resets on reopen via
      `requestAnimationFrame`. Uses `mapSalesError`.
    - **Ticket adapter:** `src/features/sales/utils/ticketAdapter.ts` exports
      `mapSaleToTicketDTO(sale, cartItems, options)` — bridges `SaleResponse` + `CartItem[]` →
      `AgentTicketDTO` for the printer agent. Handles all 5 payment methods for
      `amountTendered`/`changeDue`. `uuidToLong()` truncates the first 8 UUID hex chars to a `number`
      (agent protocol requirement). Always route `SaleResponse → AgentTicketDTO` through this function —
      never map inline.

- **Global scrollbar-gutter:** `src/index.css` sets `html { scrollbar-gutter: stable; }` to permanently
  reserve scrollbar track width. Prevents CLS when modals apply `body { overflow: hidden }`. **Never**
  compensate with `document.body.style.paddingRight`/`marginRight` — gutter handles it. Reference:
  `src/shared/hooks/useModalAnimation.ts` sets only `overflow: hidden`.

- **Route-level code-splitting (initial-bundle / TTI):** `AppRouter.tsx` lazy-loads admin pages and
  secondary store pages via `React.lazy` + a `suspense()` helper that wraps each route `element` in
  `<Suspense fallback={<RouteFallback />}>` (centered `Loader2` spinner). Lazy components are named
  exports, so each is `lazy(() => import("…").then((m) => ({ default: m.X })))`. Kept **eager** for
  first paint / synchronous auth: both logins, the three guards, `AdminLayout`, `StoreLayout`, and
  `PosScreen` (the cashier's landing). Heaviest deferral: `PosScreen` lazy-loads `CameraScannerModal`
  (pulls in ~370 kB `html5-qrcode`) behind a `scannerMounted` latch — the modal mounts only after the
  first camera tap and **stays mounted** thereafter so its entrance/exit animation survives later opens.
  New routes/feature pages follow this: lazy unless needed for first paint.

- **POS full-bleed layout escape:** `StoreLayout` `<main>` is `flex-1 bg-slate-50 p-6 md:p-8`. POS catalog
  + cart needs full viewport, so `PosScreen.tsx` root cancels padding and pins height:
  `<div className="-m-6 md:-m-8 h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">`. The `4rem`
  matches `<header className="h-16">` of `StoreLayout`. Future immersive pages (kitchen display, scanner)
  follow the same escape.

- **Modal entrance / exit animation pattern:** Modals that mount/unmount conditionally must animate both
  ways. Two state flags + double `requestAnimationFrame` for entry, `setTimeout(EXIT_DURATION)` before
  unmount for exit:
  ```tsx
  const [render, setRender] = useState(open);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setRender(true);
        raf2 = requestAnimationFrame(() => setShow(true));
      });
      return () => { cancelAnimationFrame(raf1); if (raf2) cancelAnimationFrame(raf2); };
    }
    const raf = requestAnimationFrame(() => setShow(false));
    const t = setTimeout(() => setRender(false), 200);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [open]);
  if (!render) return null;
  ```
  Backdrop: `transition-opacity duration-300 ease-out`, `opacity-100`↔`opacity-0`. Panel:
  `transform transition-all duration-300 ease-out`, `translate-y-0 opacity-100 sm:scale-100` ↔
  `translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95` (mobile slides up, desktop fades + zooms).
  Reference: `src/shared/components/ui/Modal.tsx`, `src/features/sales/components/CheckoutModal.tsx`,
  `src/features/sales/components/SaleSummaryModal.tsx`.

- **Caching last prop during exit animation:** When a modal reads from a prop the parent clears on close
  (e.g., `SaleSummaryModal`'s `sale` prop set to `null`), the panel briefly shows stale data during the
  200 ms exit. Cache the latest non-null prop in state via `useEffect` whose body uses
  `requestAnimationFrame(() => setCached(value))` (lint-safe). Derive `const current = prop ?? cached;`.

- **Mobile slide-in drawer pattern:** Drawers must always be mounted and toggle classes — never gate the
  whole drawer with `{open && <div>}` (cuts the entrance/exit transition). Backdrop:
  `transition-opacity duration-300 ease-out` toggled `opacity-100`↔`opacity-0`. Panel:
  `transition-transform duration-300 ease-in-out` toggled `translate-x-0`↔`translate-x-full`. Outer
  container toggles `pointer-events-auto`/`pointer-events-none` and `aria-hidden={!open}`. Reference:
  `src/features/sales/components/PosScreen.tsx`.

- **Lint compliance — `react-hooks/set-state-in-effect`:** Never call `setState` synchronously in a
  `useEffect` body. Wrap mutations in callbacks (`requestAnimationFrame`, `setTimeout`, `.then`, event
  handlers). For data-loading effects, extract async function via `useCallback` and invoke with
  `useEffect(() => { void load(); }, [load])` — rule allows setState inside the async function.

- **Lint compliance — `react-hooks/refs`:** Do **not** read `ref.current` during render. Use `useState`
  updated inside a `requestAnimationFrame` callback in a `useEffect` (see "Caching last prop"). Refs are
  fine for imperative DOM access from event handlers/effects.

- **Toast feedback after async actions:** Successful side-effecting actions (e.g., `createSale` ack)
  surface a non-blocking toast with `role="status"` + `aria-live="polite"`, auto-dismiss in ~6 s (3 s is
  too short to read both message and CTA). Embed any secondary action as a real button
  (`px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 rounded-md font-medium transition-colors`), not a
  text link. Reference: `PosScreen.tsx`'s "Ver ticket" toast.

- **Cash shifts module (`/pos/*` gate):** Shift lifecycle in `src/features/cash/`. `StoreLayout` mounts
  `<OpenShiftModal>` and `<CloseShiftModal>` as siblings of `<main>` — they gate every `/pos/*` route.
    - **Cash store (`src/features/cash/store/cashShiftStore.ts`):** `useCashShiftStore` exposes
      `{ currentShift, isLoading, error, hasFetched, fetchCurrentShift, open, close, clearCurrentShift,
      clearError, reset }`. No `persist` — backend is source of truth. `hasFetched` starts `false`, goes
      `true` after first `fetchCurrentShift` resolves. `OpenShiftModal` gate is
      `hasFetched && !currentShift` — `hasFetched` prevents a flash during initial GET. `close()` returns
      `CashShiftResponse | null` and does **not** clear `currentShift` — caller owns receipt display and
      calls `clearCurrentShift()` after ack. `reset()` wipes all state including `hasFetched=false` (used
      on logout); `clearCurrentShift()` nulls only `currentShift`/`error` and keeps `hasFetched=true` so
      `OpenShiftModal` reappears immediately.
    - **Logout integration:** `authStore.logout` calls `useCashShiftStore.getState().reset()` before
      clearing token — same `getState()` no-React-binding pattern as `apiClient` interceptor. Covers
      user-switch and silent 401 logout.
    - **`OpenShiftModal` — non-dismissible blocking modal (`src/features/cash/components/OpenShiftModal.tsx`):**
      `useModalAnimation(open, { closeOnEscape: false })`, omit `onClick` on backdrop. No X, no Cancel.
      Single submit. Pattern for any mandatory gate.
    - **`CloseShiftModal` — two-step modal (`src/features/cash/components/CloseShiftModal.tsx`):** Step
      `"form"` dismissible (ESC, backdrop, Cancel); step `"receipt"` not (`closeOnEscape: false`,
      backdrop `onClick` conditionally omitted). Modal resets step/fields/error in
      `useEffect([open, clearError])` so reopening starts clean. `handleFinish` calls `onClose()` first
      (starts 200 ms exit), then `setTimeout(220ms, clearCurrentShift)` to prevent overlap with
      `OpenShiftModal`. `closedShift` is local state — receipt survives unmount. Difference display:
      `±0.0049` tolerance for Sobrante/Faltante/Exacto; `text-emerald-600`/`text-rose-600`/`text-slate-700`;
      icons `ArrowUpCircle`/`ArrowDownCircle`/`CheckCircle2` (color + icon, never color alone — WCAG 1.4.1).
    - **Sidebar shift footer:** In `StoreLayout` `<aside>`, after `<nav>` (`flex-1`), render
      `{currentShift && <div className="border-t border-slate-800 px-3 py-4">...</div>}` with a pill
      showing `opening_balance` and a `bg-rose-600` "Cerrar caja" button (`LockKeyhole` icon). Call
      `closeMenu()` before opening `CloseShiftModal` to close the mobile sidebar.
    - **`StoreLayout` mount fetch:** `useCallback(() => { void fetchCurrentShift(); }, [fetchCurrentShift])`
      + `useEffect(() => { loadShift(); }, [loadShift])` — satisfies `react-hooks/set-state-in-effect`.
    - **Cash API (`src/features/cash/api/cashApi.ts`):** `getCurrentShift()` catches 404 → `null`; other
      errors propagate. `getShiftHistory({ page, size, sort? })` (sort default `openedAt,desc` — Spring
      `Pageable` sorts on the Java entity property, not the snake_case JSON key) backs the OWNER-only
      shifts history screen `CashShiftsScreen.tsx` at `/pos/shifts` (read-only paginated table, modeled on
      `SalesList`; reuses `formatMoney`/`formatSaleDate` and the `CloseShiftModal` diff color+icon cue).
      Route nested under `OwnerGuard`; sidebar link "Cortes" (`Wallet` icon) is `isOwner`-gated.

- **Barcode scanning (dual: HID scanner + camera):** Shared infra in `src/shared/`. Backend exposes
  `GET /products/search?barcode=`; frontend wraps it via `searchByBarcode(barcode)` in
  `src/features/products/api/productsApi.ts` (404 → `null`, mirrors `cashApi.getCurrentShift`). Never
  call the endpoint directly elsewhere.
    - **`useBarcodeScanner` hook (`src/shared/hooks/useBarcodeScanner.ts`):** global `keydown` listener
      with timing-based detection. Defaults: `interKeyMs=30`, `minLength=4`. Active element rules:
      ignore if focused inside an editable element **unless** that element carries
      `data-allow-scanner="true"` (opt-in). When opted-in and the gap between keys is "sobrehumano"
      (`<= interKeyMs`), the hook calls `e.preventDefault()` + `stopPropagation()` on each char so
      scanner bytes never reach the input. On scanner `Enter`, the hook also calls `flushInputValue()`
      (native `HTMLInputElement.prototype.value` setter + synthetic `input` event) to clear any leaked
      first char and resync the React controlled value. Always pass `enabled: !cameraScannerOpen` so the
      hook doesn't double-fire while the camera scanner modal is decoding.
    - **`CameraScannerModal` (`src/shared/components/scanner/CameraScannerModal.tsx`):** wraps
      `html5-qrcode` (v2.3.8, pnpm-installed — never duplicate the dep). Uses `useModalAnimation` with
      the standard entrance/exit pattern. Camera defaults to rear (`facingMode: { ideal: "environment" }`).
      Supported formats: `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `CODE_128`, `CODE_39`, `ITF`, `QR_CODE`,
      `DATA_MATRIX`. Maps `NotAllowedError` / `NotFoundError` / `NotReadableError` to legible Spanish
      messages with a "Reintentar" button (increments a `retryNonce` to re-run the effect). `setState`
      inside the start effect is wrapped in `requestAnimationFrame` to satisfy
      `react-hooks/set-state-in-effect`. `Html5Qrcode.stop()` is called from a try/catch wrapper since
      it rejects if not scanning. Reuse this modal — do not instantiate `Html5Qrcode` ad-hoc per
      feature. **Viewfinder layout:** outer container is
      `relative overflow-hidden rounded-xl bg-slate-900 aspect-square sm:aspect-video flex items-center justify-center`
      and the scanner div is bare `w-full` (parent owns crop + rounding) so the qrbox stays centered
      across portrait (phone) and landscape (desktop) video. The qrbox itself is a dynamic function
      sized at 70% of `Math.min(viewfinderWidth, viewfinderHeight)`. Do **not** apply
      `[&_video]:object-cover` or `absolute inset-0` to the scanner div, and do **not** set a static
      `qrbox` / `aspectRatio` in the config — both desync the qrbox overlay from the video feed.
    - **Feedback utils (`src/shared/utils/feedback.ts`):** `playBeep(durationMs?, freq?)` (singleton
      `AudioContext`, square wave 1200Hz/90ms by default), `playErrorBeep()` (220Hz/140ms), and
      `vibrate(pattern)` (no-op when `navigator.vibrate` absent). Always pair a successful scan with
      `playBeep() + vibrate(50)` and a failed scan with `playErrorBeep() + vibrate([60,50,60])`. iOS
      Web Audio requires a prior user gesture — the hook's `Enter` keystroke and the camera button tap
      both qualify.
    - **POS scan flow (`PosScreen.handleScan`):** `useCallback(async code => ...)` calls
      `searchByBarcode`, then: 404 / inactive / `current_stock <= 0` → toast rojo (`role="status"
      aria-live="polite"`, auto-dismiss 4 s) + error beep + triple vibrate; success → success beep +
      single vibrate, then PIECE products → `addItem` (qty 1, merged via `usePosStore`'s `sanitizeQty`),
      KILO products → open existing `QuantityModal` via `setKiloProduct(product)`. The catalog search
      `<input type="search">` in `ProductGrid` carries `data-allow-scanner="true"` so the hook can fire
      while the cashier is also typing.
    - **Product form scan flow (`ProductForm`):** `barcode` input is `autoFocus`-equivalent via a
      `useRef<HTMLInputElement>` + `useEffect(() => { if (!isEdit && !loading) ref.current?.focus(); },
      [isEdit, loading])` so a wireless scanner with autocomplete works on `/pos/products/new`. Adjacent
      camera button opens `CameraScannerModal`; `handleScan` writes the code into form state, plays
      beep + vibrate, and calls `searchByBarcode(code)` — if an existing product comes back with
      `existing.id !== id` (the route param), set `duplicateMessage` to
      `\`Este código ya pertenece al producto: ${existing.name}\`` rendered in `text-rose-500`. Edit
      mode where the match is the same product **must not** flag it. Same check runs on input `onBlur`
      so manual typing (or pasted code) is also validated.
    - **`data-allow-scanner` opt-in:** Only attach this attribute to inputs that should accept scanner
      bytes (e.g., a catalog search). The hook itself enforces the suppression — do not also add custom
      `onKeyDown` handlers to strip digits; that double-blocks legitimate human typing.

- **Product images (upload + thumbnails):** `ProductResponse.image_url` (`?: string | null`, absolute
  R2 URL, server-managed — never add it to `Create*`/`Update*` types). API in
  `src/features/products/api/productsApi.ts`: `uploadProductImage(id, file)` posts multipart `FormData`
  with key **`file`** (backend `@RequestParam("file")`) and a `Content-Type: multipart/form-data`
  override (axios injects the boundary); `deleteProductImage(id)`; both return the updated
  `ProductResponse`. Backend limits are mirrored client-side **before** the request (module constants in
  `ProductForm.tsx`): MIME `image/jpeg | image/png | image/webp`, max `2 * 1024 * 1024` bytes —
  violations toast the matching `PRODUCTS_ERROR_MESSAGES` texts (`image_type_not_allowed`,
  `image_too_large`) without hitting the network.
    - **`ProductImage` (`src/shared/components/ui/ProductImage.tsx`):** shared `<img loading="lazy">`
      wrapper with a required `fallback: ReactNode` rendered when `src` is empty **or** `onError` fires.
      The error flag resets on `src` change inside `requestAnimationFrame` (lint-safe) because upload
      URLs are cache-busted per re-upload. Always render product images through it — never a bare
      `<img>`.
    - **Placements:** `ProductForm` (edit mode only, endpoints are OWNER-only) — hidden
      `<input type="file" accept="image/jpeg,image/png,image/webp">` triggered by a "Cambiar/Subir
      imagen" button, inline rose confirm row for "Eliminar imagen" (no `window.confirm`), `sonner`
      toasts, busy state with `Loader2` spinner. `ProductsList` — `h-10 w-10 rounded-md bg-slate-100
      object-cover` thumb in a leading table column (`w-14`, `sr-only` "Imagen" header — full-width rows
      use `colSpan={7}`) and in the mobile card header; fallback = `Package` icon tile (`ThumbFallback`).
      POS `ProductGrid` card — image replaces the avatar only when `image_url` exists; fallback stays
      the existing `getInitials` + `pastelColorFromId` circle (`alt=""`, card button owns the
      `aria-label`).

- **Notifications module (`src/features/notifications/`):** Server-push alerts for OWNER only
  (LOW_STOCK, OUT_OF_STOCK, OVERDUE_CREDIT). `StoreLayout` fetches unread on mount for `OWNER` role.
    - **API:** `GET /notifications/unread` → `NotificationResponse[]` (not paginated); `PATCH
      /notifications/:id/read`. Types in `src/features/notifications/types/index.ts`.
    - **`useNotificationStore`:** `{ notifications, unreadCount, isLoading, error, hasFetched,
      fetchUnread, markAsRead, clearError, reset }`. No `persist`. `markAsRead` is **optimistic** —
      removes from list immediately, rolls back on API failure. `reset()` called on logout (same
      `getState()` pattern as cash shift store).
    - **`NotificationBell`:** Dropdown anchored to `StoreLayout` header. On desktop renders as an
      absolute panel; on mobile slides up from bottom as a sheet (`fixed inset-x-0 bottom-0
      rounded-t-2xl`). Outside-click closes via `mousedown` listener on `document` (not `click` — avoids
      event-order issues). `unreadCount > 99` displays "99+".
    - **`formatRelativeTime` (`src/features/notifications/utils/relativeTime.ts`):** Epoch-safe relative
      formatter using `Intl.RelativeTimeFormat("es-MX")`. Falls back to `Intl.DateTimeFormat` for dates
      older than 7 days. Reuse for any relative timestamp — do not call `Intl.RelativeTimeFormat`
      directly in components.

- **Inventory adjustments (`src/features/inventory/`):** Manual stock corrections posted by OWNER.
    - **API:** `adjustStock(data)` → `POST /inventory/movements`. Request DTO:
      `{ product_id: string, quantity: string, reason: InventoryReason, notes?: string }` — all
      snake_case. `InventoryReason = "RESTOCK" | "LOSS" | "ADJUSTMENT"`.
    - **`AdjustStockModal`** lives in `src/features/products/components/AdjustStockModal.tsx` (product
      feature, not inventory) because it's triggered from `ProductsList`. Uses `mapInventoryError`.

- **Customer credit payments (`RegisterPaymentModal`):**
  `src/features/customers/components/RegisterPaymentModal.tsx` — opens from `CustomersList` for rows
  with `outstanding_balance > 0`. Calls `registerPayment(customerId, amount)` →
  `POST /customers/:id/payments` with body `{ amount: string }` (2-decimal string). Client-side guards:
  `parsed <= 0` and `parsed > outstanding_balance`. Uses `mapCustomersError`. Modal returns `null`
  (renders nothing) when `customer` prop is null or balance is ≤ 0.

- **Agent printer settings — multi-station (`src/features/settings/`):** A store has multiple checkout
  stations (`StoreStation`); each station self-reports its own LAN agent URL to the cloud.
    - **`useSettingsStore` (`src/features/settings/store/settingsStore.ts`):** Persisted Zustand store
      (`"grocery-pos-settings"` key, `partialize` → `localAgentUrl` only). Exports only `setLocalAgentUrl`,
      which normalizes trailing slashes and **validates against SSRF (V-04)** with the module-level
      `PRIVATE_AGENT_URL` regex: the value must be strict `http://` (rejects `https`/`javascript`) with a
      loopback or RFC1918 host (`localhost`, `127.0.0.1`, `10.x`, `192.168.x`, `172.16–31.x`) and optional
      port. Invalid input is discarded (previous URL kept) with a `console.error`; the action returns
      `boolean` (`false` = rejected). Empty string falls back to the default. Default URL:
      `http://192.168.68.66:8081`. No `autoDiscoverAgent` — cloud-sync logic lives in `AgentSettingsModal`,
      keyed on the selected station. Never relax `PRIVATE_AGENT_URL` to allow public hosts or other schemes.
    - **`AgentSettingsModal`** opens from `StoreLayout` sidebar (`Printer` icon). Owns local `url` state,
      `TestState` (`idle | testing | ok | fail | discovered`), `stations: StoreStationResponse[]`, and
      `selectedStationId`. A `useEffect` on `open` calls `fetchStationsFromCloud()` and pre-selects the
      first station (lint-safe via `.then` + functional updater). A `<select>` "Caja / Estación" picks
      the station. "Probar conexión" calls `pingAgent(url)`. "Sincronizar IP con la Nube" looks up the
      selected station: valid `agentUrl` → `setLocalAgentUrl` + `toast.success("IP sincronizada con la
      caja")`; null `agentUrl` → `toast.error` (Agente PC apagado). The "Configuración del Agente Local
      (PC)" block shows the `selectedStationId` UUID (NOT `storeId`) — copy it into `station.id` of the
      PC `config.properties`. `handleSubmit` checks the `setLocalAgentUrl` boolean: a rejected (non-private)
      URL keeps the modal open and fires `toast.error` instead of calling `onClose()`.
    - **`agentApi.ts` (`src/shared/api/agentApi.ts`):** `printTicket(dto)` (POST, 8 s timeout),
      `pingAgent(url?)` (OPTIONS, 3 s timeout), `fetchStationsFromCloud()` (authenticated
      `GET /stores/me/stations` via `apiClient`, returns `StoreStationResponse[]` — `{ id, name,
      agentUrl: string | null, status }` — or `[]` on error; `console.warn` on failure, never throws).
      Always use these — never create ad-hoc axios calls to the agent. Each station self-reports its LAN
      IP to the cloud; the frontend no longer scans the LAN for it.

- **Physical scale integration (báscula):** The print agent also exposes the serial scale over HTTP
  (`GET /api/scale/weight`, port 8081, permissive CORS). Frontend infra lives in `src/shared/`.
    - **`readScale(signal?)` (`src/shared/api/agentApi.ts`):** GET to `${localAgentUrl}/api/scale/weight`
      with a strict per-request 1500 ms timeout (overrides the 8 s `agentClient` default) and an optional
      `AbortSignal` (forwarded to axios so `useScale`'s cleanup can cancel an in-flight read). Returns
      `ScaleReadingDTO { weight: number; isStable: boolean; error?: string | null }`. Never throws —
      same "safe object always" contract as `pingAgent` / `fetchStationsFromCloud`: on any failure
      returns `{ weight: 0, isStable: false, error: "Báscula desconectada" }`, on missing agent URL
      `error: "Agente no configurado"`. The agent emits `stable` (no `is` prefix) — `readScale` maps
      `stable → isStable`. Always use this helper — never call the scale endpoint ad-hoc.
    - **`useScale(enabled)` hook (`src/shared/hooks/useScale.ts`):** Self-scheduling `setTimeout` loop
      (not `setInterval`) calling `readScale`, strictly only while `enabled === true`. Returns
      `{ reading }`; `reading` is always defined (initialized to a zero reading) and resets to that
      initial value when `enabled` turns false (inside `requestAnimationFrame` — lint-safe).
      **Exponential backoff:** each tick reschedules at `Math.min(300 * 2 ** consecutiveErrors, 3000)` ms
      — a `reading.error` increments the effect-local `consecutiveErrors`, a clean reading resets it to 0
      (back to 300 ms), so a dead agent stops hammering the LAN at 300 ms. An `AbortController` created
      per effect run is passed to `readScale(signal)` and `abort()`-ed on cleanup alongside
      `clearTimeout`. setState happens only inside the async `tick` and is change-detected (steady weight
      = no re-render) — satisfies `react-hooks/set-state-in-effect`.
    - **`QuantityModal` scale UI (`src/features/sales/components/QuantityModal.tsx`):** For KILO
      products only, calls `useScale(open && unitOfMeasure === "KILO")` so polling runs only while the
      modal is open for a weighed product. Renders a "Báscula en vivo" card above the manual input:
      live weight `font-mono text-3xl font-bold`, badge `bg-emerald-100` when `isStable` else
      `bg-amber-100` (color + icon + text — WCAG 1.4.1). Fast-Track button `Agregar {weight} kg`
      (`ShoppingCart` icon, emerald) calls `onConfirm(reading.weight)` directly — adds to cart in one
      step; disabled when `!reading.isStable` or `reading.error`. The manual `type="number"` input and
      its `Cancelar` / `Confirmar` buttons stay untouched as the fallback when the scale fails or the
      cashier needs a different weight — never remove or hide them.
