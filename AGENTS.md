# AGENTS.md

This file provides guidance to any AI coding agent or assistant (e.g., Cursor, GitHub Copilot, ChatGPT, Gemini, etc.)
when working with the frontend code of the `grocery-store` POS/SaaS repository.

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
- **Styling:** Use Tailwind CSS v4. Do **NOT** create or look for a `tailwind.config.js` file. All configuration and
  custom variables must go into `src/index.css`.
- **Design System:** Strictly follow the design rules and component guidelines defined in the project's local design
  system rules.

### Integration and APIs (Axios)

- **TypeScript DTOs:** Never use `any`. Always define strict TypeScript `interfaces` or `types` that perfectly match the
  backend DTOs (`PageResponse<T>`, `ErrorResponse`, etc.).
- **Auth Interceptors:** Implement Axios interceptors to automatically attach the JWT token.
- **Token Decoding:** Understand that store tokens contain `storeId`, `userId`, `role`, while admin tokens contain
  `adminId`, `role`. Never send `storeId` in admin API requests.
- **Error Handling:** Map backend HTTP statuses and `error` codes (e.g., 401 `invalid_credentials`, 403
  `store_inactive`, 409 `conflict`, 404 `store_not_found`) to user-friendly toast notifications or UI states.
- **No Business Logic Duplication:** Rely on the backend as the source of truth for calculations, taxes, and complex
  validations.

### SOLID & Clean Code

- **Single Responsibility:** Keep components small. If a component exceeds 150-200 lines, extract its logic into custom
  hooks.
- **Strict Typing:** No implicit anys. Enable strict mode in `tsconfig.json`.

## 5. Expected Output Format

When generating code or proposing changes, you MUST provide your response in the following exact order:

1. **Design Reasoning:** A brief technical justification of the UI/UX choices, state management strategy, and how it
   aligns with the backend API contract.
2. **Implementation:** The TypeScript/React code blocks organized by the required feature folder structure.
3. **Verification:** The specific `pnpm` command to verify the implementation:

- Run dev: `pnpm dev`
- Type check: `pnpm build`
- Linter: `pnpm lint`