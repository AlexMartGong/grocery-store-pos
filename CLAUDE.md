# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the frontend code of the `grocery-store`
POS/SaaS repository.

## 1. Role

Act as a **Senior Frontend Engineer** specialized in React 19, TypeScript 6, and modern UI architectures. You are the
counterpart to the backend team, ensuring seamless integration, high performance, and exceptional user experience (UX)
for the POS system.

## 2. Context

You are developing the frontend for the `grocery-store` SaaS project (a multi-tenant POS system).
**Base framework:** React 19 + TypeScript 6 via Vite 8.
**Styling:** Tailwind CSS v4 (CSS-first engine).
**State & Routing:** Zustand 5 for global state, React Router DOM v7 for routing.
**API Client:** Axios.
**Integration:** The backend is a Spring Boot 4.0 (Java 21) REST API that strictly enforces JWT authentication,
role-based access control (Store Users vs. SaaS Admins), and robust error structures (ProblemDetails/ErrorResponse).

## 3. Task

Your task is to build and maintain a modular, scalable, and type-safe Single Page Application (SPA). You must consume
the backend APIs efficiently, manage complex forms and validations, handle two separate authentication flows (`OWNER`/
`CASHIER` vs `SUPER_ADMIN`), and implement offline-first or highly responsive POS features where necessary.

## 4. Restrictions & Rules

### Folder and Module Architecture

Follow a **Feature-Driven (Domain) Architecture** aligned with the backend modules.

- `src/features/<feature-name>`: Isolate components, hooks, stores, and API calls per domain (e.g., `admin`, `stores`,
  `users`, `products`, `sales`).
- `src/shared/`: For global UI components, utilities, and generic hooks.
- `src/routes/`: For global route definitions mapping to feature pages.

### State Administration and UI

- **Local vs Global:** Prioritize React local state (`useState`, `useReducer`). Use Zustand *only* for globally shared
  state (e.g., Current POS Cart, Authenticated User Session, Theme).
- **Persistence:** When a Zustand slice must survive reload (e.g., auth session), use the `persist` middleware with
  `partialize` to whitelist only the persisted keys. Re-validate derived flags (e.g., `isAuthenticated`,
  token expiry) inside `onRehydrateStorage` — never trust the persisted flag directly. **Additionally**, always
  reassign `state.user = toAuthUser(decoded, state.user?.username ?? "")` inside `onRehydrateStorage` after a
  successful decode, so stale persisted payloads (e.g., from a previous type shape) are normalized on rehydrate.
  Reference: `src/features/auth/store/authStore.ts`.
- **Styling:** Use Tailwind CSS v4. Do **NOT** create or look for a `tailwind.config.js` file. All configuration and
  custom variables must go into `src/index.css`.
- **Icons:** Use `lucide-react` for iconography.
- **Design System:** Strictly follow the design rules and component guidelines defined in the project's local skill:
  `.claude/skills/frontend-design`.
- **Mobile-First & Responsiveness:** All layouts and components MUST be designed mobile-first using Tailwind CSS. Use
  `md:` and `lg:` prefixes to scale up for tablet and desktop views. Concrete rules:
    - Feature page roots must NOT repeat `min-h-screen bg-slate-50` — `AdminLayout`'s `<main>` already provides it.
      Start page wrappers with `px-4 py-8` only.
    - Card/panel padding must use responsive progression: `p-4 md:p-8`, never a flat `p-8`.
    - Action headers (title + CTA button) must use `flex flex-wrap` so they reflow on narrow screens.
    - **Data tables:** wrap the table in `<div className="hidden md:block ...">` and add a
      `<ul className="... md:hidden">`
      card list for mobile. Cards show essential fields only (code, name, status, actions); defer secondary columns
      (owner, phone, date) to the desktop table.
    - **Touch targets:** all standalone interactive elements must be at minimum `py-2.5` (≈44 px). Navigation links
      (`NavLink`) must use at least `py-3`. Never use `py-1` or `py-1.5` on buttons.
- **Accessibility (a11y):** Strictly use semantic HTML (`<nav>`, `<main>`, `<aside>`, `<header>`). Always include
  appropriate ARIA attributes (`aria-label`, `aria-expanded`, `aria-hidden`) for interactive or collapsible elements
  (e.g., mobile menus, modals, dropdowns). Ensure components are keyboard navigable and maintain visible focus states.
  Concrete rules:
    - Every button, link, and input must carry
      `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-<color>`
      so keyboard users always see a visible focus indicator.
    - Pagination controls must have descriptive `aria-label` values:
      `aria-label="Go to previous page"` / `aria-label="Go to next page"`.
    - **Never use `window.confirm()`** for destructive actions. Use an inline confirmation UI (an extra state key +
      a confirmation row/card) so screen readers can announce the prompt and keyboard users can respond.
    - Slide-in drawers (mobile sidebar) must close on `Escape` via a `useEffect` that attaches a `keydown` listener
      only while the drawer is open, and cleans up on close or unmount.

### Integration and APIs (Axios)

- **Base URL:** The Axios instance reads from `import.meta.env.VITE_API_URL` (fallback `http://localhost:8080`) and
  bakes the `/api/v1` prefix into `baseURL`. Feature code uses clean paths like `/auth/login`, `/products`, etc.
  Configure the env via `.env` at the repo root (see `.env.example`).
- **Auth endpoints:** `POST /auth/login` (store users, body `{ storeCode, username, password }`) and
  `POST /admin/login` (SaaS admins, body `{ username, password }`).
- **storeCode vs storeId:** The store login *request body* uses `storeCode` (string, e.g., `"STORE001"`).
  The decoded JWT *claims* use `storeId` (UUID **string**) plus `userId` (UUID **string**), `role`, `sub`, `iss`,
  `iat`, `exp`. Do not confuse the two: never send `storeId` to login, never send `storeCode` to authenticated
  endpoints. **Do NOT type `storeId`/`userId`/`adminId` as `number`** — the backend emits them via
  `uuid.toString()`.
- **TypeScript DTOs:** Never use `any`. Always define strict TypeScript `interfaces` or `types` that perfectly match the
  backend DTOs (`PageResponse<T>`, `ErrorResponse`, etc.).
- **Auth Interceptors:** Implement Axios interceptors to automatically attach the JWT token. The interceptor reads
  the token via `useAuthStore.getState().token` (no React binding, no circular import). On `401`, the response
  interceptor calls `useAuthStore.getState().logout()` for a silent global session clear.
- **Token Decoding:** Store tokens contain `storeId` (UUID string), `userId` (UUID string), `role`; admin tokens
  contain `adminId` (UUID string), `role`. Never send `storeId` in admin API requests. `DecodedToken` and `AuthUser`
  in `src/features/auth/types/index.ts` type these as `?: string`.
- **Error Handling:** Map backend HTTP statuses and `error` codes to user-friendly UI states. Common codes:
  `invalid_credentials`, `store_inactive`, `store_not_found`, `validation_failed` (auth); `store_code_taken`
  (stores conflict — not the generic `conflict` code). Use `mapAuthError(err)` from
  `src/features/auth/utils/errorMessages.ts` for auth flows. For other features, create a per-feature
  `mapXxxError` following the same `Record<errorCode, message>` + `axios.isAxiosError` shape (see
  `src/features/stores/utils/errorMessages.ts` as the reference implementation).
- **No Business Logic Duplication:** Rely on the backend as the source of truth for calculations, taxes, and complex
  validations.

### SOLID & Clean Code

- **Single Responsibility:** Keep components small. If a component exceeds 150-200 lines, extract its logic into custom
  hooks.
- **Strict Typing:** No implicit anys. Enable strict mode in `tsconfig.json`.
- **Modern React 19 Imports & Deprecation Checks:** Always verify that imported types, variables, and hooks are not
  deprecated. Do not use namespace imports for React types (AVOID `icon: React.ReactNode;`). Strictly use named imports
  directly from React (e.g., `import { ReactNode, SyntheticEvent } from 'react';`). **Crucial for Forms:** The
  `FormEvent` type is inaccurate/deprecated for native events in React 19; for form submissions (`onSubmit`), you MUST
  use `SyntheticEvent` (e.g., `e: SyntheticEvent<HTMLFormElement, SubmitEvent>`) instead of `FormEvent`.

## 5. Established Conventions (reuse, do not reinvent)

The `auth` and `stores` modules set the architectural precedent. Subsequent feature modules MUST reuse these primitives:

- **Axios client:** `src/shared/api/api.ts` exports `apiClient`. All feature API services import this — do **not**
  create per-feature Axios instances. Interceptors (auth header, 401 → logout) are already wired here.
- **Auth session store:** `src/features/auth/store/authStore.ts` exports `useAuthStore` with shape
  `{ token, user, isAuthenticated, setToken, logout }`. Read role/IDs via `useAuthStore((s) => s.user)`.
- **Shared types:** `src/shared/types/index.ts` exports `PageResponse<T>`. Import from here for all paginated
  list responses — do not redefine it per feature.
- **Error mapping:** `src/features/auth/utils/errorMessages.ts` exports `mapAuthError(err)`. Each feature defines
  its own `mapXxxError` following the same `Record<errorCode, message>` + `axios.isAxiosError` shape:
    - `mapStoresError` — `src/features/stores/utils/errorMessages.ts`
    - `mapAdminProvisioningError` — `src/features/admin/utils/errorMessages.ts`
    - `mapUsersError` — `src/features/users/utils/errorMessages.ts` (codes: `username_taken`, `user_not_found`,
      `validation_failed`, `forbidden`)
    - `mapCustomersError` — `src/features/customers/utils/errorMessages.ts` (codes: `customer_not_found`,
      `validation_failed`, `forbidden`)
    - `mapSalesError` — `src/features/sales/utils/errorMessages.ts` (codes: `invalid_mixed_payment`,
      `credit_limit_exceeded`, `customer_required`, `product_not_found`, `customer_not_found`, `conflict`,
      `validation_failed`, `forbidden`)
    - `mapCashShiftError` — `src/features/cash/utils/errorMessages.ts` (codes: `shift_already_open`,
      `open_shift_not_found`, `validation_failed`, `forbidden`)
      Never add unrelated error codes to another feature's map.
- **Field-level error state:** When a form submits to a backend endpoint that returns `400` with
  `{ error: "validation_failed", fields: Record<string, string> }`, capture field errors in a separate
  `const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})` state. In the catch block:
  `if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) setFieldErrors(err.response.data.fields)`.
  The backend `Map<String, String>` arrives as `Record<string, string>` — no transformation needed. Always
  clear with `setFieldErrors({})` at the start of each submission. Render field errors inline below the
  relevant `<input>` as `<p className="text-rose-500 text-sm mt-1">`. Use an `inputClass(hasError: boolean)`
  helper to toggle `border-rose-500 focus:border-rose-500 focus:ring-rose-300/40` vs the default border/ring.
  Reference: `src/features/admin/components/ProvisionOwnerForm.tsx`.
- **Token utilities:** `src/features/auth/utils/token.ts` — `decodeToken`, `isExpired`, `toAuthUser`. Reuse for any
  token-related logic; do not call `jwtDecode` directly elsewhere.
- **Route guards:** Three guards exist in `src/routes/guards/`:
    - `AdminGuard` — `SUPER_ADMIN` only; unauthenticated → `/admin/login`, wrong role → `/login`.
    - `StoreGuard` — `OWNER` or `CASHIER`; anything else → `/login`. Accepts optional `children` prop to wrap a
      layout element (mirrors `AdminGuard`).
    - `OwnerGuard` — `OWNER` only; CASHIER → `/pos` (they are authenticated, just not authorized for this section);
      unauthenticated or other → `/login`. Used as a layout route (no `children` prop, renders `<Outlet />`).
      Pattern: read `isAuthenticated` + `user.role` from `useAuthStore`, return `<Navigate replace>` synchronously on
      failure. **Never** use `useEffect + navigate` for auth redirects.
- **Post-login navigation:** Redirect targets live in hooks (`src/features/auth/hooks/useLogin.ts`), not in
  components. `useAdminLogin` → `/admin/stores`. `useStoreLogin` → `/pos`.
- **Routing:** `src/routes/AppRouter.tsx` uses `createBrowserRouter` + `RouterProvider`. Current route map:
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
        - `/pos/sales-history` — SalesList (OWNER + CASHIER; paginated history, view + reprint tickets)
        - `/pos/products` — ProductsList (OWNER + CASHIER read; OWNER-only writes nested under OwnerGuard)
        - `/pos/customers` — CustomersList (OWNER + CASHIER read/write — both roles can CRUD)
        - `/pos/customers/new` — CustomerForm (create)
        - `/pos/customers/:id/edit` — CustomerForm (edit)
        - OwnerGuard (layout route, OWNER only)
            - `/pos/users` — UsersList
            - `/pos/users/new` — UserForm (create)
            - `/pos/users/:id/edit` — UserForm (edit)
            - `/pos/products/new` — ProductForm (create)
            - `/pos/products/:id/edit` — ProductForm (edit)
    - `/` → redirect `/login` | `*` → redirect `/login`
- **Feature folder layout:** `src/features/<domain>/{api,components,hooks,store,types,utils}`. Keep slices isolated;
  cross-feature dependencies should go through `src/shared/`.
- **Forms:** Use HTML5 native validation (`required`, `type="email"`, `pattern`, `maxLength`, etc.) for the MVP.
  Promote to a validation library only when a feature genuinely needs cross-field rules.
- **DTO immutability & minimal surface:** Some backend fields are immutable post-create (e.g., `Store.code`,
  `User.username`). Exclude them from `UpdateXxxRequest` types and render them `disabled` in edit forms with a
  visible "cannot be changed" hint. Additionally, keep `UpdateXxxRequest` to the minimum surface required by the
  current UI — backend may accept more optional fields (e.g., `password`, `active` on `UpdateUserRequest`) that are
  intentionally out of scope for a given flow; document the omission with a one-line comment in the types file so
  future developers do not reinvent it.
- **DTO field naming mirrors the wire format:** Match TypeScript field names to the JSON keys the backend
  emits — do **NOT** introduce a camelCase ↔ snake_case translation layer. Backends with
  `@JsonProperty(snake_case)` on their record DTOs (Products, Customers) must be mirrored with snake_case
  keys in the matching TS `interface` (e.g., `full_name`, `credit_limit`, `outstanding_balance`,
  `purchase_cost`). The `fields` map in `validation_failed` 400 responses uses the same snake_case keys, so
  `fieldErrors.full_name` indexes directly without renaming. For backends that emit camelCase (Stores,
  Users), keep camelCase in TS. Additionally, **derived/server-managed fields must be excluded from
  `Create*` / `Update*` types** (e.g., `outstanding_balance` on `Customer` is mutated only by the
  sales/payments flow — never present in the form, the state, or the DTO). References:
  `src/features/customers/types/index.ts`, `src/features/products/types/index.ts`.
- **BigDecimal as `string` in TS:** Backend monetary / decimal fields (`BigDecimal`) cross the wire as JSON
  numbers but MUST be typed as `string` on the frontend to avoid float precision loss. Forms accept the
  raw input as `string` and forward it unchanged in the request body — Jackson re-parses it back to
  `BigDecimal` server-side. Format for display via `Intl.NumberFormat("es-MX", { style: "currency",
  currency: "MXN" })` (helpers: `formatMoney` in `ProductsList.tsx` and `CustomersList.tsx`). Never call
  `parseFloat` on these values for arithmetic that will be persisted; only convert with `Number()` for
  display-only ratio checks (e.g., credit-usage thresholds).
- **Layout nesting:** Both `AdminLayout` and `StoreLayout` (in `src/shared/components/layout/`) render
  `<main className="flex-1 bg-slate-50 p-6 md:p-8">`. Feature pages rendered inside either must NOT add their own
  `min-h-screen` or `bg-slate-50`. Page root div: `<div className="px-4 py-8">`.
- **Responsive data tables:** data-heavy list pages use a two-view pattern —
  `<div className="hidden md:block ..."><table>` for
  desktop and `<ul className="md:hidden ...">` of `<li>` cards for mobile. Reference: `StoresList.tsx`.
- **Inline destructive confirmation:** replace `window.confirm()` with local state (`confirmDeleteId: string | null`).
  Render a confirmation row (table) or section (card) in-place. Confirm + Abort buttons must meet touch-target rules.
  Reference: `StoresList.tsx`.
- **Threshold warning indicators (credit usage, low stock, etc.):** When a numeric value crosses a business
  threshold relative to a related limit (e.g., `outstanding_balance >= 0.9 * credit_limit`,
  `current_stock <= minimum_stock`), the visual cue MUST combine **color + weight + icon + accessible text**
  — never color alone (WCAG 1.4.1). Pattern: `text-rose-600 font-semibold` on the value cell +
  `<AlertTriangle aria-hidden className="inline w-4 h-4 mr-1" />` + a `title=` (or `aria-label` on a badge)
  describing the condition. Always guard ratio computations against divide-by-zero before applying the rule
  (`if (limit <= 0) return false`) so a customer without a credit line is never marked. References:
  `CustomersList.tsx` (`isHighCredit`), `ProductsList.tsx` (`stockBadge`).
- **Mobile menu / drawer shared hook:** `src/shared/hooks/useMobileMenu.ts` exports `useMobileMenu()` (returns
  `{ isMobileMenuOpen, setIsMobileMenuOpen, closeMenu }`) and `navLinkClass` (sidebar active/inactive CSS helper).
  Any layout that has a slide-in sidebar **must** use this hook — do not inline the `useState` + `useEffect` again.
  The hook attaches a `keydown` listener only while the drawer is open and cleans up on close/unmount (Escape closes
  it). Reference: `AdminLayout.tsx`, `StoreLayout.tsx`.
- **Debounce shared hook:** `src/shared/hooks/useDebounce.ts` exports `useDebounce<T>(value: T, delay: number): T`.
  Use this for any debounced input (search bars, type-ahead). Do **not** inline `setTimeout` + `clearTimeout`
  inside components or reinvent a per-feature debounce.
- **List search pattern (remote vs local):** Paginated server-side lists (Stores, Products, Customers) use
  **remote** search — debounce the input via `useDebounce(searchInput, 400)`, pass
  `debouncedSearch || undefined` as an optional `search?: string` argument to the API method (which forwards
  it as the `search` query param), and add `debouncedSearch` to the `useCallback` deps of `load`. Reset to
  page 0 with a dedicated `useEffect(() => { setPage(0); }, [debouncedSearch])` so a query never lands on
  an out-of-range page. Small/per-tenant lists (Users) use **local** filter — plain `useState` with no
  debounce, derive `filteredUsers` before the `return`, swap **both** `users.map` calls AND empty-state
  `length === 0` checks to the filtered array. UI: relative wrapper with absolutely-positioned `Search`
  icon (`aria-hidden`), `<input type="search">` carrying an explicit `aria-label` and a placeholder that
  **names the searchable fields** (e.g., `"Buscar por nombre o código..."`,
  `"Buscar por nombre o código de barras..."`, `"Buscar por nombre o teléfono..."`,
  `"Buscar por nombre o usuario..."`). Filter row container must be `flex flex-wrap items-center gap-3` so
  the search input reflows on mobile; the input wrapper uses `relative flex-1 min-w-48`. Backend `search`
  is case-insensitive substring against: store `name`+`code`, product `name`+`barcode`, customer
  `full_name`+`phone`. References: `StoresList.tsx`, `ProductsList.tsx`, `CustomersList.tsx` (remote);
  `UsersList.tsx` (local).
- **Admin provisioning pattern:** One-shot admin endpoints (e.g., cold-start user creation) belong in
  `src/features/admin/api/` and `src/features/admin/utils/`, not in generic user CRUD modules. The endpoint
  `POST /admin/stores/:storeId/users` is called via `provisionStoreOwner(storeId, data)` in
  `src/features/admin/api/adminProvisioningApi.ts`. Shared user types (`UserRole`, `UserResponse`,
  `CreateUserRequest`) live in `src/features/users/types/index.ts`; `UserRole` is re-exported from
  `src/features/auth/types` to maintain a single source of truth.
- **Preventive vs reactive UX for action buttons:** Only disable action buttons based on the resource's own
  status field (e.g., `disabled={s.status === "CANCELED"}`). Never infer the state of a *different* entity
  from a related field — e.g., `Store.ownerName` is a billing contact string, not an indicator of whether
  an `OWNER` user exists in the `users` table. For business-rule conflicts (e.g., `store_owner_exists`),
  rely on the backend 409 response and surface it in the form's error alert. Include an informative
  `title` / `aria-label` on disabled buttons explaining why they are disabled.
- **Regex `pattern` attribute safety:** When writing character classes in HTML `pattern` attributes or
  JS `RegExp` strings, always place the hyphen at the start or end of the class to avoid ambiguous range
  interpretation: use `[-a-zA-Z0-9._]`, never `[a-zA-Z0-9._-]`.
- **Self-action protection (hide, not disable):** When a list allows deleting or deactivating a resource that
  could be the currently logged-in user, **hide** the destructive action button entirely on that row — do not
  disable it. Compare `resource.id === useAuthStore((s) => s.user?.userId)` (string equality after the UUID fix).
  Reference: `src/features/users/components/UsersList.tsx`.
- **Hide actions already in target state:** Soft-delete endpoints (e.g., `DELETE /customers/:id` flips
  `active=false`) are idempotent on the backend; rendering a disabled "Desactivar" button on a row that is
  already inactive pollutes the UI with unactionable controls. Pattern: gate the action with
  `{c.active && (<button …>Desactivar</button>)}` rather than `disabled={!c.active}`. The Edit button stays
  visible because data correction (and eventually reactivation) is still useful on inactive rows.
  Reference: `src/features/customers/components/CustomersList.tsx`.
- **Distinct sidebar icons per nav target:** Every `NavLink` in a layout sidebar must use a **visually
  distinct** lucide icon. Reusing the same glyph for two destinations (e.g., `Users` for both staff and
  customers) creates ambiguity for OWNER who sees both links. Current assignments in `StoreLayout.tsx`:
  `ShoppingCart` → `/pos/sales` (POS), `ListOrdered` → `/pos/sales-history` (Historial), `Package` → Productos,
  `UserRound` → Clientes, `Users` → Usuarios (staff). When adding a new nav target, pick a glyph not already in
  the current sidebar.

- **POS / sales module (`/pos/sales`):** Cash register UI lives in `src/features/sales/`. Reusable parts:
    - **Cart store (`src/features/sales/store/posStore.ts`):** `usePosStore` exposes
      `{ cart, selectedCustomerId, addItem, updateItemQuantity, removeItem, setCustomer, clearCart }`.
      Selectors `useCartTotal()` and `useCartItemCount()` are exported from the same file. Cart is
      in-memory only (no persist) — closing the tab clears it intentionally.
      - `CartItem` carries `unitOfMeasure: UnitOfMeasure` (re-exported via `sales/types/index.ts` from
        `../../products/types`). Never omit this field when constructing a cart item.
      - `addItem(product, quantity = 1)` — pass `1` for PIECE products (default); pass the weighed decimal
        for KILO products (e.g., `0.250`). `ProductForCart` (exported from `posStore.ts`) requires
        `unit_of_measure: UnitOfMeasure`. When the product is already in the cart, the passed quantity is
        **added** to the existing total — not a hardcoded `+1`.
      - **Float precision (IEEE 754):** All quantity mutations go through `sanitizeQty = (v: number) => Number(v.toFixed(3))` (module-level in `posStore.ts`) to prevent drift accumulation from repeated additions. Applied in `addItem` on **both** branches — the merge branch wraps `existing + new`, and the new-item branch wraps the raw `quantity` argument before storing it (so a caller passing `0.1 + 0.2` cannot persist drift). Also applied in `updateItemQuantity` (wraps the raw argument). `useCartItemCount` applies `Number(...toFixed(3))` to the running sum before returning. Never bypass `sanitizeQty` when updating cart quantities.
    - **Sales API:** `src/features/sales/api/salesApi.ts` — `createSale(data)`,
      `getSales({ page, size, sort? })`. `getSales` accepts an object; `sort` defaults to `"createdAt,desc"`.
      Backend auto-assigns `cashier_id` from JWT — never send it.
    - **Sale request DTO uses snake_case** (`payment_method`, `customer_id`, `amount_paid`, `items[].product_id`,
      `items[].quantity`, `items[].unit_price`). All decimal fields are strings. Per payment method:
      CARD/TRANSFER → `amount_paid = total`; CASH → `amount_paid = amountReceived`; CREDIT → `amount_paid = "0"`;
      MIXED → `0 < amount_paid < total` and `customer_id` required (backend code `invalid_mixed_payment`).
      Items payload always serializes `quantity` as `item.quantity.toFixed(3)` and `unit_price` as
      `item.unitPrice.toFixed(2)` — never `.toString()`, which would preserve IEEE 754 drift as invalid wire strings.
    - **Quick Cash Buttons (`CheckoutModal`):** Two-row denomination grid rendered only inside
      `{showCalculator && ...}` (CASH method; MIXED toggle lives inside the same block so buttons apply to both).
      Constants at module level: `const QUICK_CASH = [50, 100, 200, 500, 1000] as const` (bills) and
      `const QUICK_COINS = [1, 2, 5, 10, 20] as const` (coins). Additive handler:
      `handleQuickCash = (value: number) => setAmountPaid(prev => ((parseFloat(prev || "0") || 0) + value).toString())`
      — the outer `|| 0` guards against `NaN` when the user typed invalid text before tapping a denomination.
      "Exacto" **overwrites** (does not accumulate): `setAmountPaid(total.toFixed(2))`.
      "Limpiar" resets: `setAmountPaid("")`. All buttons use `h-12 active:scale-95 transition-transform
      focus-visible:ring-2`. Layout: `flex flex-col gap-2 mt-4` wrapper → two `grid grid-cols-6 gap-2` rows.
      "Exacto" style: `bg-indigo-600 text-white hover:bg-indigo-700`. "Limpiar" style: `bg-rose-100 text-rose-700`.
    - **POS data hooks:** `src/features/sales/hooks/usePosProducts.ts` (debounced 300 ms search, page-size 40,
      active-only) and `usePosCustomers.ts` (single fetch of active customers, dropdown filtered locally).
      Both wrap an async `load` in `useCallback` and call it via `useEffect(() => { void load(); }, [load])`
      to satisfy `react-hooks/set-state-in-effect`. Reuse these instead of inlining `getProducts` /
      `getCustomers` in POS components.
    - **POS formatters:** `src/features/sales/utils/format.ts` exports `formatMoney`, `getInitials`,
      `pastelColorFromId` (deterministic UUID → tailwind class for product cards), `formatSaleId` (8-char
      uppercase prefix), `formatSaleDate` (epoch-safe — falls back to `new Date()` when input is null /
      invalid / pre-1970). Never call `Intl.DateTimeFormat` directly on `created_at` strings without this
      guard, or "1969" leaks into the UI.
    - **QuantityModal (`src/features/sales/components/QuantityModal.tsx`):** Centered modal with a
      giant `type="number" step="0.001"` input. Props: `{ open, onClose, onConfirm, initialValue?,
      unitOfMeasure, productName }`. Label reads "Ingresar peso (kg)" for KILO, "Ingresar cantidad"
      for PIECE. Uses `useModalAnimation`. Two call sites with distinct state owners:
      (1) `PosScreen` — `kiloProduct: ProductResponse | null` state; KILO card clicks open this modal,
      PIECE cards call `addItem` directly. (2) `CartSidebar` — `editingItem: CartItem | null` state;
      clicking the quantity chip opens this modal to set an exact value on an existing cart line.
    - **ProductGrid `onProductClick` prop:** `ProductGrid` requires `onProductClick: (product: ProductResponse) => void`
      — it no longer calls `addItem` directly. `PosScreen` owns the dispatch logic (KILO → open
      `QuantityModal`, PIECE → `addItem` immediately). `ProductCard` receives `onAdd` from `ProductGrid`.
    - **Cart quantity formatting:** `formatQty(item: CartItem)` helper inside `CartSidebar` —
      KILO: `` `${qty.toFixed(3)} kg` ``; PIECE integer: `` `${qty} pz` ``; PIECE fraction:
      `` `${qty.toFixed(1)} pz` ``. The quantity chip between `−` / `+` buttons is a clickable
      `<button>` that opens `QuantityModal` pre-filled with the current value.

- **Sales history list (`/pos/sales-history`):** Read-only paginated list of confirmed sales. Component:
  `src/features/sales/components/SalesList.tsx`. Reuses `SaleSummaryModal` and all formatters from
  `sales/utils/format.ts`. Key patterns:
    - **No search:** `GET /sales` only accepts `page`/`size`/`sort` — omit search UI until backend adds the
      param. Omitting it is correct; never add a filter that silently does nothing server-side.
    - **On-demand product name resolution:** `openSale(sale)` calls
      `Promise.all(uniqueProductIds.map(id => getProductById(id).catch(() => null)))`, builds `CartItem[]`,
      then passes it to `SaleSummaryModal`. Individual `getProductById` 404s fall back to name `"Producto"`
      so they never block viewing the ticket.
    - **Per-row loading state:** `loadingDetailId: string | null` tracks the in-flight row. Other rows stay
      interactive. Pattern: `disabled={loadingDetailId === s.id}`.
    - **Table layout stability:** `<table className="w-full table-fixed">` + fixed `<th>` widths
      (`w-32`/`w-40`) prevent column reflow on re-render. `table-auto` recalculates on every setState.
    - **Fixed-width action buttons:** Buttons that toggle loading state MUST carry `w-32 justify-center` so
      the button is dimension-stable when text toggles ("Ver ticket" ↔ "Cargando..."). Swap the icon
      conditionally: `loadingDetailId === s.id ? <Loader2 className="animate-spin" /> : <ReceiptText />`.
      Text-width delta on a free-width button causes a column shift even inside `table-fixed` cells.
    - **Modal without tenderedAmount:** Pass no `tenderedAmount` (not persisted post-sale); the cash/change
      section in `SaleSummaryModal` is auto-hidden by its own `showCash`/`showChange` guards.

- **Global scrollbar-gutter:** `src/index.css` sets `html { scrollbar-gutter: stable; }` to permanently
  reserve the scrollbar track width. Prevents CLS when modals apply `body { overflow: hidden }`. **Never**
  compensate with `document.body.style.paddingRight` or `marginRight` — the gutter handles it. Reference:
  `src/shared/hooks/useModalAnimation.ts` sets only `overflow: hidden`, no padding hack needed.

- **POS full-bleed layout escape:** `StoreLayout` `<main>` is `flex-1 bg-slate-50 p-6 md:p-8`. The POS
  catalog + cart needs the full viewport, so `PosScreen.tsx` root cancels that padding and pins the
  height: `<div className="-m-6 md:-m-8 h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">`.
  The `4rem` matches the `<header className="h-16">` of `StoreLayout`. Other future "immersive" pages
  (kitchen display, scanner) should follow the same escape pattern.

- **Modal entrance / exit animation pattern:** Modals that mount/unmount conditionally must animate both
  ways. Use two state flags + double `requestAnimationFrame` for entry and `setTimeout(EXIT_DURATION)`
  before unmount for exit:
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
  Backdrop classes: `transition-opacity duration-300 ease-out`, toggled `opacity-100`↔`opacity-0`.
  Panel classes: `transform transition-all duration-300 ease-out`, toggled
  `translate-y-0 opacity-100 sm:scale-100` ↔ `translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95`
  (mobile slides up from bottom, desktop fades + zooms). Reference: `src/shared/components/ui/Modal.tsx`,
  `src/features/sales/components/CheckoutModal.tsx`, `src/features/sales/components/SaleSummaryModal.tsx`.

- **Caching last prop during exit animation:** When a modal owns nothing but reads from a prop that the
  parent clears on close (e.g., `SaleSummaryModal`'s `sale` prop set to `null` to close), the panel will
  briefly render with stale data during the 200 ms exit. Cache the latest non-null prop in state via an
  `useEffect` whose body uses `requestAnimationFrame(() => setCached(value))` so the lint rule does not
  flag a sync setState. Then derive `const current = prop ?? cached;` for the JSX.

- **Mobile slide-in drawer pattern:** Drawers must always be mounted and toggle classes — never gate the
  whole drawer with `{open && <div>}` because the entrance/exit transition is then cut. Pattern:
  ```tsx
  <div className={`fixed inset-0 z-40 md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
       aria-hidden={!open}>
    <div className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ease-out
                     ${open ? "opacity-100" : "opacity-0"}`} onClick="" />
    <div className={`absolute inset-y-0 right-0 ... bg-white shadow-2xl
                     transition-transform duration-300 ease-in-out
                     ${open ? "translate-x-0" : "translate-x-full"}`}>...</div>
  </div>
  ```
  Reference: `src/features/sales/components/PosScreen.tsx`.

- **Lint compliance — `react-hooks/set-state-in-effect`:** Never call `setState` synchronously inside a
  `useEffect` body. Wrap state mutations in callbacks (`requestAnimationFrame`, `setTimeout`, promise
  `.then`, event handlers). For data-loading effects, extract an async function via `useCallback` and
  invoke it with `useEffect(() => { void load(); }, [load])` — the rule allows setState inside the async
  function because it runs as a callback, not synchronously in the effect.

- **Lint compliance — `react-hooks/refs`:** Do **not** read `ref.current` during render (e.g., to derive
  JSX from a cached value). Use `useState` updated inside an `requestAnimationFrame` callback in a
  `useEffect` instead — see the "Caching last prop during exit animation" pattern above. Refs are still
  fine for imperative DOM access from event handlers / effects.

- **Toast feedback after async actions:** Successful side-effecting actions (e.g., `createSale` ack)
  should surface a non-blocking toast with `role="status"` + `aria-live="polite"`, auto-dismiss in
  ~6 s (3 s is too short to read both message and CTA). Embed any secondary action as a real button
  (`px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 rounded-md font-medium transition-colors`), not a
  text link, so the click target is finger-sized. Reference: `PosScreen.tsx`'s "Ver ticket" toast.

- **Cash shifts module (`/pos/*` gate):** Shift lifecycle lives in `src/features/cash/`. `StoreLayout`
  mounts `<OpenShiftModal>` and `<CloseShiftModal>` as siblings of `<main>` — they gate every `/pos/*`
  route. Reusable parts:
    - **Cash store (`src/features/cash/store/cashShiftStore.ts`):** `useCashShiftStore` exposes
      `{ currentShift, isLoading, error, hasFetched, fetchCurrentShift, open, close, clearCurrentShift,
      clearError, reset }`. No `persist` — backend is the source of truth. `hasFetched` starts `false`
      and goes `true` after the first `fetchCurrentShift` resolves (success or error). The
      `OpenShiftModal` gate is `hasFetched && !currentShift` — the `hasFetched` guard prevents a flash
      during the initial GET. `close()` returns `CashShiftResponse | null` and does **not** clear
      `currentShift` — the caller owns the receipt display and calls `clearCurrentShift()` after
      acknowledgement. `reset()` wipes all state including `hasFetched=false` (used on logout);
      `clearCurrentShift()` nulls only `currentShift`/`error` and keeps `hasFetched=true` so
      `OpenShiftModal` reappears immediately.
    - **Logout integration:** `authStore.logout` calls `useCashShiftStore.getState().reset()` before
      clearing token — same `getState()` no-React-binding pattern as the `apiClient` interceptor. Covers
      user-switch and silent 401 logout.
    - **`OpenShiftModal` — non-dismissible blocking modal (`src/features/cash/components/OpenShiftModal.tsx`):**
      Use `useModalAnimation(open, { closeOnEscape: false })` and omit `onClick` on backdrop. No X
      button, no Cancel. Single submit. Pattern for any mandatory gate (e.g., onboarding steps).
    - **`CloseShiftModal` — two-step modal (`src/features/cash/components/CloseShiftModal.tsx`):** Step
      `"form"` is dismissible (ESC, backdrop, Cancel); step `"receipt"` is not (`closeOnEscape: false`,
      backdrop `onClick` conditionally omitted). Modal resets step/fields/error in
      `useEffect([open, clearError])` so reopening always starts clean. `handleFinish` calls `onClose()`
      first (starts 200 ms exit), then `setTimeout(220ms, clearCurrentShift)` to prevent overlap with
      `OpenShiftModal`. `closedShift` is local component state — receipt data survives unmount.
      Difference display: `±0.0049` tolerance for Sobrante / Faltante / Exacto; `text-emerald-600` /
      `text-rose-600` / `text-slate-700`; paired icons `ArrowUpCircle` / `ArrowDownCircle` /
      `CheckCircle2` (color + icon, never color alone — WCAG 1.4.1).
    - **Sidebar shift footer:** In `StoreLayout` `<aside>`, after `<nav>` (which is `flex-1`), render
      `{currentShift && <div className="border-t border-slate-800 px-3 py-4">...</div>}` with a pill
      showing `opening_balance` and a `bg-rose-600` "Cerrar caja" button (`LockKeyhole` icon). Call
      `closeMenu()` before opening `CloseShiftModal` to close the mobile sidebar first.
    - **`StoreLayout` mount fetch:** `useCallback(() => { void fetchCurrentShift(); }, [fetchCurrentShift])`
      + `useEffect(() => { loadShift(); }, [loadShift])` — satisfies `react-hooks/set-state-in-effect`.
    - **Cash API (`src/features/cash/api/cashApi.ts`):** `getCurrentShift()` catches 404 → `null`; all
      other errors propagate. `getShiftHistory({ page, size, sort? })` is a stub for a future OWNER
      history page — do not wire UI until backend supports the endpoint.

## 6. Expected Output Format

When generating code or proposing changes, you MUST provide your response in the following exact order:

1. **Design Reasoning:** A brief technical justification of the UI/UX choices, state management strategy, and how it
   aligns with the backend API contract.
2. **Implementation:** The TypeScript/React code blocks organized by the required feature folder structure.
3. **Verification:** The specific `pnpm` command to verify the implementation:
    - Run dev: `pnpm dev`
    - Type check: `pnpm build`
    - Linter: `pnpm lint`