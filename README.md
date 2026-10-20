## Trinity Web

Modern React + TypeScript frontend for Trinity — a green‑building certification SaaS. This app talks to the Trinity API from `ayushmann01/trinity` (see that repo’s master README for the API contract) and is designed as a standalone frontend.

### What is Trinity?
- A platform for managing green building certifications (projects, stakeholders, scorecards).
- This repo hosts the UI; the backend API lives separately and exposes REST endpoints used here via RTK Query.

## Tech stack

- React 19 + TypeScript + Vite 8 (fast DX, ESM, modern TS)
- Tailwind CSS 3 (utility styling) + class-variance-authority and tailwind-merge
- shadcn/ui pattern (reusable UI in `src/shared/ui/`) with `components.json` for `npx shadcn add`
- React Router 7 (routing)
- Redux Toolkit 2 + RTK Query (state, API, caching, tags)
- redux-persist (token/user persistence)
- React Hook Form + Zod (forms and validation)
- Sonner (toasts), lucide-react (icons)
- Vitest 5 + Testing Library (tests)
- ESLint 8 + Prettier 3 (lint/format)
- Path alias `@/` (via vite-tsconfig-paths)

## Prerequisites
- Node.js 18+ and npm
- Access to the Trinity API (local or via ngrok)

## Setup
1. Install deps:
   - `npm install`
2. Configure env:
   - `cp .env.example .env`
   - Edit `.env` as needed.
3. Start dev server:
   - `npm run dev` → http://localhost:3000

## Environment variables

| Name | Default | Description |
|------|---------|-------------|
| VITE_API_BASE_URL | http://localhost:5173/api | Base URL for the API. Absolute URL recommended (supports ngrok). |

Notes:
- Dev server runs on http://localhost:3000 (see `vite.config.ts`).
- Ensure the API CORS_ORIGINS includes http://localhost:3000 (and your ngrok origin when used).
- You can also point to ngrok, e.g. `VITE_API_BASE_URL=https://abc123.ngrok.app/api`.
- All requests add `ngrok-skip-browser-warning: 1` and `Accept: application/json`. `Content-Type: application/json` is set when missing.

## Scripts

| Script | What it does |
|--------|---------------|
| dev | Start Vite dev server (port 3000, strictPort) |
| build | Type-check (TS project refs) and build production bundle |
| preview | Serve the production build locally |
| typecheck | TS compile check with no emit |
| lint | ESLint over `src/**/*.{ts,tsx}` |
| lint:fix | ESLint with `--fix` |
| test | Run Vitest in CI mode |
| test:watch | Run Vitest in watch mode |

## Architecture

High-level layering:
- `app/` — app shell (store, providers, router, layout, route guards)
- `shared/` — base API client, UI building blocks, utilities, hooks
- `features/<name>/` — vertical features (auth, projects, stakeholders, scorecard)

Mermaid overview:

```mermaid
flowchart TD
  C[Component/Page] --> H[Hook/useMutation\\nuseQuery]
  H --> E[RTK Query Endpoint\\n(baseApi.injectEndpoints)]
  subgraph RTKQuery
    E --> BQ[baseQueryWithReauth\\n(fetchBaseQuery)]
    BQ -->|401| R[/POST /auth/refresh/]
    R -->|new tokens| ST[authSlice.setTokens]
    ST --> BQ
    BQ --> U[unwrapEnvelope\\nnormalize error]
  end
  U --> Cache[(RTKQ Cache\\nTags: Me, Projects, Project,\\nStakeholders, StakeholderBuckets,\\nCertifications, Scorecard)]
  Cache --> H
  H --> C
```

Data flow:
- Components call generated hooks (e.g. `useLoginMutation`, `useListProjectsQuery`).
- `baseQueryWithReauth` adds headers; on 401 it posts to `/auth/refresh`, stores new tokens, and retries once; otherwise logs out.
- API envelopes `{ data }` are unwrapped; `{ error: { message, details } }` are normalized to `{ message, details }`.
- Tags drive cache invalidation and refetching.

## Folder structure

```
src/
  app/
    store.ts                # Redux store + RTK Query middleware + persist
    providers.tsx           # Redux Provider, PersistGate, Toaster
    router.tsx              # Route table
    ProtectedRoute.tsx      # Auth guard (redirects to /auth/login)
    ui/AppLayout.tsx        # Top nav + Logout + nested routes outlet
  shared/
    api/
      baseApi.ts            # fetchBaseQuery, 401 refresh flow, envelope normalization
      types.ts              # shared API types
    ui/                     # shadcn-style components (button, input, card, ...)
    lib/utils.ts            # cn() helper
    hooks/redux.ts          # typed useDispatch/useSelector
  features/
    auth/
      api/authApi.ts        # login, signup, forgot, update-password, logout, me
      pages/                # Login, Signup, ForgotPassword
      state/authSlice.ts    # tokens + user (persisted)
    projects/
      api/projectsApi.ts    # list/get/create/update, listCertifications
      pages/                # list, form (new/edit), detail
      types.ts
    stakeholders/
      api/stakeholdersApi.ts# buckets, list, create
    scorecard/
      api/scorecardApi.ts   # get + save
      pages/ScorecardPage.tsx
      types.ts              # AttemptState, Scorecard shape
styles.css                  # Tailwind setup and CSS variables
```

### Feature module anatomy and conventions
- Public entry: `index.ts` (optional) to re-export stable surface.
- `api/`: Use `baseApi.injectEndpoints`. Prefer strong types, add tags.
- `pages/`: Route-level components only. Use feature `components/` for reusable UI.
- `hooks/`, `schemas/` (Zod), `types/` as needed.
- Cache strategy: add tagTypes in `baseApi` and wire `providesTags`/`invalidatesTags`.

## State management and auth flow
- `authSlice` stores `accessToken`, `refreshToken`, and `user` (persisted via `redux-persist` localStorage).
- Protected routes: `ProtectedRoute` checks for `accessToken`, otherwise redirects to `/auth/login`.
- Refresh flow: on 401, post `/auth/refresh` with `refreshToken`; if success, save new tokens and retry once; otherwise, logout.
- Logout clears persisted auth state and navigates to login.

## API integration details
- Base URL from `VITE_API_BASE_URL`, fallback to `/api`.
- Envelopes:
  - Success: `{ data, meta? }` → returns `data` to callers.
  - Error: `{ error: { message, details? } }` → normalized to `{ message, details }`.
- Tags:
  - `'Me'`, `'Projects'`, `'Project'`, `'Stakeholders'`, `'StakeholderBuckets'`, `'Certifications'`, `'Scorecard'`.
- Endpoints by feature:
  - Auth: `POST /auth/login`, `POST /auth/signup`, `POST /auth/forgot`, `POST /auth/update-password`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh`.
  - Projects: `GET /projects?page=&pageSize=`, `GET /projects/:id`, `POST /projects`, `PUT /projects/:id`, `GET /catalog/certifications`.
  - Stakeholders: `GET /stakeholders/buckets`, `GET /projects/:projectId/stakeholders`, `POST /projects/:projectId/stakeholders`.
  - Scorecard: `GET /projects/:projectId/scorecard`, `POST /projects/:projectId/scorecard` with `{ attempted_ids, maybe_ids }`.

## Routing

| Path | Element | Notes |
|------|---------|-------|
| `/` | Redirect | → `/app/projects` |
| `/auth/login` | LoginPage | Public |
| `/auth/signup` | SignupPage | Public |
| `/auth/forgot` | ForgotPasswordPage | Public |
| `/app` | ProtectedRoute | Requires auth |
| `/app/projects` | ProjectsListPage | List projects |
| `/app/projects/new` | ProjectFormPage | Create |
| `/app/projects/:projectId` | ProjectDetailPage | Detail |
| `/app/projects/:projectId/edit` | ProjectFormPage | Edit |
| `/app/projects/:projectId/scorecard` | ScorecardPage | Scorecard UI |
| `*` | Redirect | → `/` |

## UI and shadcn usage
- Reusable primitives live in `src/shared/ui/` (button, input, select, card, table, badge).
- `components.json` is provided so `npx shadcn add <component>` will scaffold into `@/shared/ui` and use `@/shared/lib/utils` for utilities.
- Style tokens are defined as CSS variables in `styles.css` and mapped in `tailwind.config.js`.

## Forms and validation
- Use React Hook Form; prefer `zod` schemas + `zodResolver` for validation.
- Derive TS types from schemas with `z.infer`.
- Keep page-level forms in `pages/` and extract complex UI into `components/`.

## Scorecard domain notes
- Attempt states: `YES`, `MAYBE`, `NO` on selectable criteria nodes; mandatory nodes are labeled `M` and may be non-selectable.
- Summary from API includes:
  - `pointsAttempted` (YES),
  - `pointsMaybe`,
  - `pointsToTarget`,
  - optionally `totalPoints`.
- Save payload uses snake_case keys: `{ attempted_ids, maybe_ids }`.

## Testing
- Vitest + Testing Library with `jsdom` environment and `@testing-library/jest-dom` in `vitest.setup.ts`.
- Place tests under `src/**/__tests__` or `**/*.test.ts(x)`.
- A basic smoke test exists in `src/__tests__/smoke.test.ts`.

## Linting and formatting
- ESLint with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `prettier` config.
- Run `npm run lint` / `npm run lint:fix`. Prettier config is in `.prettierrc`.

## Build and deployment
- `npm run build` emits static assets to `dist/`.
- Environment variables are inlined at build time (`import.meta.env`); set `VITE_API_BASE_URL` before building.
- Deploy any static host or container; ensure the API is reachable and permits the deployed origin via CORS.
- If deploying behind a reverse proxy, you can set `VITE_API_BASE_URL` to a path like `/api` and terminate/proxy at the edge.

## Running against local API and via ngrok
1. Start your local API and note its URL (e.g. `http://localhost:5173/api` or via ngrok `https://abc123.ngrok.app/api`).
2. Set `VITE_API_BASE_URL` accordingly in `.env`.
3. Ensure API CORS_ORIGINS includes `http://localhost:3000` (and your ngrok origin).
4. `npm run dev` at http://localhost:3000.

## How to add a new feature
1. Create `src/features/<name>/` with `api/`, `pages/`, optionally `components/`, `hooks/`, `schemas/`, `types/`.
2. Define endpoints in `api/<name>Api.ts` via `baseApi.injectEndpoints`, add `providesTags`/`invalidatesTags`.
3. Add pages and route entries in `src/app/router.tsx`.
4. Use primitives from `@/shared/ui`; run `npx shadcn add <component>` if you need more building blocks.
5. Add tests for endpoints and pages.

## Contribution and branching
- Create branches using prefixes:
  - `ft/<short-name>` for features
  - `fix/<short-name>` for fixes
- Open PRs into `main`. Keep commits scoped and descriptive.

## Troubleshooting / FAQ
- 401 loops after login:
  - Ensure refresh endpoint `POST /auth/refresh` returns `accessToken` or `access_token` (and optionally `refreshToken`), and that `CORS_ORIGINS` includes the frontend origin.
- CORS errors in browser:
  - Verify `VITE_API_BASE_URL`; add `http://localhost:3000` (and ngrok origin) to API CORS.
- API returns envelopes:
  - Success should wrap data as `{ data: ... }`; errors as `{ error: { message, details? } }`.
- Path alias `@/` not resolving:
  - Ensure TS/JS tooling reads `tsconfig.app.json`; Vite already resolves via `vite-tsconfig-paths`.
- Shadcn add fails:
  - Ensure `components.json` exists and aliases map to `@/shared/ui` and `@/shared/lib/utils`.
- No tests found in CI:
  - Add at least one test under `src/**`. A smoke test exists already.
