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
  token expiry) inside `onRehydrateStorage` — never trust the persisted flag directly.
- **Styling:** Use Tailwind CSS v4. Do **NOT** create or look for a `tailwind.config.js` file. All configuration and
  custom variables must go into `src/index.css`.
- **Icons:** Use `lucide-react` for iconography.
- **Design System:** Strictly follow the design rules and component guidelines defined in the project's local skill:
  `.claude/skills/frontend-design`.

### Integration and APIs (Axios)

- **Base URL:** The Axios instance reads from `import.meta.env.VITE_API_URL` (fallback `http://localhost:8080`) and
  bakes the `/api/v1` prefix into `baseURL`. Feature code uses clean paths like `/auth/login`, `/products`, etc.
  Configure the env via `.env` at the repo root (see `.env.example`).
- **Auth endpoints:** `POST /auth/login` (store users, body `{ storeCode, username, password }`) and
  `POST /admin/login` (SaaS admins, body `{ username, password }`).
- **storeCode vs storeId:** The store login *request body* uses `storeCode` (string, e.g., `"STORE001"`).
  The decoded JWT *claims* use `storeId` (number) plus `userId`, `role`, `sub`, `iss`, `iat`, `exp`. Do not confuse
  the two: never send `storeId` to login, never send `storeCode` to authenticated endpoints.
- **TypeScript DTOs:** Never use `any`. Always define strict TypeScript `interfaces` or `types` that perfectly match the
  backend DTOs (`PageResponse<T>`, `ErrorResponse`, etc.).
- **Auth Interceptors:** Implement Axios interceptors to automatically attach the JWT token. The interceptor reads
  the token via `useAuthStore.getState().token` (no React binding, no circular import). On `401`, the response
  interceptor calls `useAuthStore.getState().logout()` for a silent global session clear.
- **Token Decoding:** Store tokens contain `storeId`, `userId`, `role`, while admin tokens contain
  `adminId`, `role`. Never send `storeId` in admin API requests.
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

## 5. Established Conventions (reuse, do not reinvent)

The `auth` and `stores` modules set the architectural precedent. Subsequent feature modules MUST reuse these primitives:

- **Axios client:** `src/shared/api/api.ts` exports `apiClient`. All feature API services import this — do **not**
  create per-feature Axios instances. Interceptors (auth header, 401 → logout) are already wired here.
- **Auth session store:** `src/features/auth/store/authStore.ts` exports `useAuthStore` with shape
  `{ token, user, isAuthenticated, setToken, logout }`. Read role/IDs via `useAuthStore((s) => s.user)`.
- **Shared types:** `src/shared/types/index.ts` exports `PageResponse<T>`. Import from here for all paginated
  list responses — do not redefine it per feature.
- **Error mapping:** `src/features/auth/utils/errorMessages.ts` exports `mapAuthError(err)`. Each feature defines
  its own `mapXxxError` (e.g., `src/features/stores/utils/errorMessages.ts` → `mapStoresError`) following the
  same `Record<errorCode, message>` + `axios.isAxiosError` shape. Never add unrelated error codes to another
  feature's map.
- **Token utilities:** `src/features/auth/utils/token.ts` — `decodeToken`, `isExpired`, `toAuthUser`. Reuse for any
  token-related logic; do not call `jwtDecode` directly elsewhere.
- **Route guards:** `src/routes/guards/AdminGuard.tsx` guards `/admin/*` for `SUPER_ADMIN` only. It uses
  `<Outlet />` for nested children. Pattern: read `isAuthenticated` + `user.role` from `useAuthStore`, return
  `<Navigate replace>` on failure. Create additional guards following this pattern (e.g., `StoreGuard` for
  `OWNER`/`CASHIER`). **Never** use `useEffect + navigate` for auth redirects — use synchronous `<Navigate>`.
- **Post-login navigation:** Redirect targets live in hooks (`src/features/auth/hooks/useLogin.ts`), not in
  components. `useAdminLogin` → `/admin/stores`. `useStoreLogin` → `/pos`.
- **Routing:** `src/routes/AppRouter.tsx` uses `createBrowserRouter` + `RouterProvider`. Current route map:
  - `/login` — StoreLogin (public)
  - `/admin/login` — AdminLogin (public)
  - `/admin` — AdminGuard (SUPER_ADMIN)
    - `/admin/stores` — StoresList
    - `/admin/stores/new` — StoreForm (create)
    - `/admin/stores/:id/edit` — StoreForm (edit)
  - `/pos` — Store POS placeholder (OWNER/CASHIER, guard pending)
  - `/` → redirect `/login` | `*` → redirect `/login`
- **Feature folder layout:** `src/features/<domain>/{api,components,hooks,store,types,utils}`. Keep slices isolated;
  cross-feature dependencies should go through `src/shared/`.
- **Forms:** Use HTML5 native validation (`required`, `type="email"`, `pattern`, `maxLength`, etc.) for the MVP.
  Promote to a validation library only when a feature genuinely needs cross-field rules.
- **DTO immutability:** Some backend fields are immutable post-create (e.g., `Store.code`). Reflect this in
  TypeScript by excluding them from `UpdateXxxRequest` types, and render those fields as `disabled` in edit forms
  with a visible "cannot be changed" hint.

## 6. Expected Output Format

When generating code or proposing changes, you MUST provide your response in the following exact order:

1. **Design Reasoning:** A brief technical justification of the UI/UX choices, state management strategy, and how it
   aligns with the backend API contract.
2. **Implementation:** The TypeScript/React code blocks organized by the required feature folder structure.
3. **Verification:** The specific `pnpm` command to verify the implementation:
    - Run dev: `pnpm dev`
    - Type check: `pnpm build`
    - Linter: `pnpm lint`