# Kyber Fitness — Modern Workout Tracking & Coaching Platform

Kyber Fitness is a full-stack fitness and athletic coaching app built for individual athletes and personal trainers. It provides a clean, fast platform to log workouts, track health trends, build reusable workout plans, assign routines to clients, and manage trainer-client partnerships with clear permissions.

---

## Architectural Core & Stack

Kyber Fitness utilizes an isomorphic, typesafe React 19 stack:

- **App Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + Vinxi SSR) for high-performance isomorphic rendering and server functions.
- **Routing System:** [TanStack Router](https://tanstack.com/router) for typesafe, file-system-based navigation and automatic code splitting.
- **Identity & Authentication:** [Clerk](https://clerk.com) (`@clerk/tanstack-start`) for authentication and secure session management.
- **Database & Persistence:** [Drizzle ORM](https://orm.drizzle.team) + **Turso/libSQL** for durable production SQLite, with a local `fitness.db` fallback for development.
- **Design & Layout:** [Tailwind CSS v4](https://tailwindcss.com) + custom **Vanilla CSS** tokens providing glassmorphic cards, dynamic grid layouts, light/dark theme modes, and smooth micro-animations.
- **Progress Visuals:** Clean **SVG trend lines** and Lucide React icons for tracking health metrics.
- **Quality Tooling:** [Oxlint](https://oxc.rs/docs/guide/usage/linter) for fast JavaScript/TypeScript linting and [Prettier](https://prettier.io) for repo-wide formatting.

Shared TypeScript data-transfer and form/editor shapes live under `src/types`. Component-only prop/helper types live beside their component in `*.types.ts` files. This keeps route files focused on behavior and prevents duplicated workout, program, profile, and trainer-client shapes from drifting.

---

## Current Product Surface

- **Landing and auth:** A public landing page with an interactive dual-persona hero (live workout tracker preview with weight adjusters and rest timer alongside a coach client management preview), feature pillars, progress charts, and Clerk-powered `/sign-in` and `/sign-up` routes.
- **Navigation architecture:** Elevated floating capsule header on desktop with a mobile circular hamburger toggle that slides out a right-side navigation drawer, paired with a thumb-friendly 5-icon persistent mobile bottom dock (Home, Train, Plans/Clients, Vitals, Settings) with live notification badges.
- **Dashboards for athletes and coaches:** Role-tailored consoles — athlete view with workout totals, assigned-routine prompts, quick body-weight logging, and recent activity summaries; coach view with business overview, active client network counts, program template metrics, quick coaching desk shortcuts, recent client snapshot, and coaching guidance.
- **Workout logging and review:** Custom workout session builder with global/custom exercises, set targets, reps, load, distance, duration, rest, intensity, notes, dedicated session detail pages, and permission-checked edit/delete flows.
- **Health metrics:** Timelines for weight, body fat, and resting heart rate, including trainer-supported client metric logging plus permission-checked metric correction and deletion when access allows.
- **Trainer clients:** Client invitation, active relationship management, athlete profile/metric views, and permission-guarded client logging.
- **Trainer coaching notes:** Trainer-private client notes with pinned follow-ups, update/delete controls, and active relationship enforcement.
- **Program builder:** Trainer-only program templates with ordered exercises, reusable block labels, target sets, and progression-plan notes.
- **Program assignment flow:** Trainers assign programs to active clients with scheduled dates, due dates, recurrence cadence, and coach notes; athletes can open pending assignments, preload the routine into `/workouts/new`, record the actual session, and complete the assignment through a server-validated workflow that links the completed workout session.
- **In-app notifications:** A persisted `/notifications` inbox captures trainer invites and assigned-routine alerts with unread badges and mark-read controls.

---

## Refined Neon Cyber 2.0 Aesthetic Guidelines

The application strictly implements the **Refined Neon Cyber 2.0** design principles:

- **Contrast Base:** Deep Carbon (`#0A0D14` base, `#0C101A` / `#111622` cards) generating high-contrast, low-fatigue athletic surfaces.
- **Cyber Frost Light Mode:** Clean ice-slate surfaces (`#F8FAFC` base, `#FFFFFF` cards, `#0F172A` text, `#E2E8F0` borders) preserving high-contrast athletic Volt and Cyan accents.
- **Theme Modes:** Light, dark, and system-auto modes are available through `ThemeToggle.tsx`. The initial mode is applied before hydration to prevent visible theme flash. All navigation bars and SVG data charts dynamically adapt to the active theme.
- **CTA Highlighters & Charts:** **Volt Lime** (`#D4FF00` dark, `#4D7C0F` light) primary markers for success nodes, action triggers, PR celebrations, active workout timers, and primary biometric progress.
- **Tech Accents & Curves:** **Hyper Cyan** (`#00F0FF` dark, `#0891B2` light) secondary lines for charting trends, diagnostic metrics, coach sync status, and structural borders.
- **Surfaces:** Semi-transparent **Balanced Modern Glass** (`rgba(17, 22, 34, 0.85)` in dark, `rgba(255, 255, 255, 0.85)` in light with `backdrop-filter: blur(16px)`, clean 1px border highlights, and soft ambient radial glow behind active cards).
- **Typography:** `Lexend` for hero/display titles, `Geist` for clean SaaS body/forms, and `Geist Mono` with `tabular-nums` for clock readouts and weights without layout jitter.
- **Component & Container Sizing:** In-app buttons adhere to compact, high-performance SaaS scaling (`8px 16px` at 12px font size with `btn-sm` and `btn-xs` variants). Signed-in page components are constrained to `max-w-6xl mx-auto px-4 sm:px-6`, matching the landing page design and floating navigation header width for cohesive visual alignment.
- **Mobile Responsiveness & Ergonomics:** Viewport configuration supports `viewport-fit=cover` with iOS safe area offsets (`env(safe-area-inset-bottom)`) on the persistent bottom navigation dock and main viewports. Multi-column set logging tables are guarded with horizontal scroll wrappers and minimum widths (`min-w-[540px]`), client console tabs feature frictionless horizontal scrolling, and dialog modals enforce max-height constraints (`max-h-[88vh] overflow-y-auto`) for mobile keyboards.

---

## Relational Database Schema

The database uses a SQLite-compatible Turso/libSQL store mapped with Drizzle. The structural architecture resolves user records directly to Clerk identities via the unique `userId` key:

```mermaid
erDiagram
    users ||--|| profiles : "has profile"
    users ||--|| trainer_profiles : "has professional profile"
    users ||--o{ trainer_clients : "participates in"
    users ||--o{ workout_sessions : "performs / logs"
    users ||--o{ health_metrics : "logs metrics"
    users ||--o{ workout_programs : "creates"
    users ||--o{ program_assignments : "receives / assigns"
    users ||--o{ coaching_notes : "writes / receives private context"
    users ||--o{ notifications : "receives alerts"
    workout_sessions ||--o{ session_exercises : "contains"
    exercises ||--o{ session_exercises : "is added to"
    session_exercises ||--o{ exercise_sets : "has sets"
    workout_programs ||--o{ workout_program_exercises : "contains"
    workout_programs ||--o{ program_assignments : "is assigned"
    workout_program_exercises ||--o{ workout_program_sets : "has target sets"
```

1.  **`users`:** Account records mapping Clerk user IDs with roles (`individual` or `trainer`).
2.  **`profiles`:** Athlete profile information (date of birth, gender, height, activity level, fitness goals).
3.  **`trainer_profiles`:** Trainer profiles with gym/studio name, specialization, bio, and years of experience.
4.  **`trainer_clients`:** Trainer-client relationships with status (`pending`, `active`, `declined`) and permissions (e.g. view health data, log workouts).
5.  **`workout_sessions`:** Logged workouts with date, title, duration, and notes.
6.  **`exercises` & `exercise_sets`:** Logged exercises preloaded with standard movements (strength, cardio, bodyweight) plus custom exercises, tracking sets, reps, weight, distance, duration, and intensity (RPE).
7.  **`health_metrics`:** Health metrics history (body weight, body fat percentage, resting heart rate).
8.  **`workout_programs`, `workout_program_exercises`, `workout_program_sets`:** Trainer-owned workout plans and templates with exercises, block labels, target sets, and coaching notes.
9.  **`program_assignments`:** Workout plan assignments from trainers to clients with scheduled dates, due dates, recurrence cadence, and completion tracking.
10. **`coaching_notes`:** Trainer-private client notes with pinned status, guarded by active trainer-client relationships.
11. **`notifications`:** In-app notifications for invites and program assignments with unread badges.

---

## Key Architectural Resolutions & Optimization

During the development process, we implemented several critical configurations to resolve SSR and server function limitations under Vinxi and Clerk:

### 1. Clerk SSR Context Externalization Bypass

- **Symptom:** Vinxi threw fatal `Error: Context is not available` on initial server renders during `getAuth` evaluations.
- **Cause:** Clerk's `@clerk/tanstack-start` package was being loaded as an external module, running in a isolated scope that did not share H3's `AsyncLocalStorage` instance.
- **Resolution:** Configured `ssr.noExternal: ['@clerk/tanstack-start']` inside `vite.config.ts` to force Vite to bundle Clerk inline, syncing the isomorphic request context perfectly.

### 2. Stream Lock & Disturbed Request Stream Bypass

- **Symptom:** Submitting POST server functions (such as profile onboarding or workout logging) threw `TypeError: Response body object should not be disturbed or locked` and returned `401 Unauthorized` states.
- **Cause:** TanStack Start consumes the incoming request body stream to validate form input. Passing this same stream to Clerk's `getAuth` middleware triggers stream conflicts since the body stream has already been read.
- **Resolution:** Built a request-sanitizing utility `createAuthRequest` in `auth-server.ts` that clones the request headers but forces the HTTP method to `'GET'`. Because GET requests carry no body streams, Clerk retrieves auth signatures seamlessly without stream collisions.

### 3. Server-Side Access Validation Hook

- **Symptom:** Protecting database transactions against unauthorized clients.
- **Resolution:** Enforced `verifyTrainerClientAccess(trainerId, clientId)` inside server actions. A trainer can only query or log health metrics for an athlete if an active relationship (`trainerClients.status = 'active'`) exists with the correct permissions.

### 4. Program Ownership and Assignment Validation

- **Symptom:** Workout program templates and assigned routines can expose sensitive coaching data if loaded only by a client-provided `programId`.
- **Resolution:** Program details are guarded server-side. Trainers can access only programs they created. Athletes can access assigned program details only through an assignment belonging to their user ID. Completing a program assignment requires a pending assignment for the current athlete; coach-entered client sessions cannot mark athlete assignments complete.

### 5. Client and Server Diagnostics Guards (ERR_TOO_MANY_REDIRECTS Bypass)

- **Symptom:** In live serverless environments like Netlify, if Clerk API keys are missing, unconfigured, or set to standard placeholders (`pk_test_placeholder`), the Clerk SSR middleware repeatedly redirects the browser to authenticate, producing a fatal browser `ERR_TOO_MANY_REDIRECTS` loop.
- **Cause:** Clerk's SSR wrapper forces authentication handshakes and throws redirection headers. Without valid keys, it gets stuck in an infinite redirect cascade.
- **Resolution:** Implemented robust diagnostic overrides in the application lifecycle:
  - **Server-Side Guard (`src/server.ts`):** Before initializing Vinxi's `createClerkHandler`, the server checks for the presence and validity of `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. If keys are invalid or missing, it bypasses Clerk completely and intercepts document requests to serve a gorgeous, dark-themed diagnostic page outlining the required environment variables.
  - **Client-Side Guard (`src/routes/__root.tsx`):** If the publishable key is missing or set to a placeholder, the `<ClerkProvider>` wrap is bypassed entirely on the client, rendering a unified "Sync Offline" diagnostic viewport to guide configuration.

---

## Local Development Runbook

Follow these steps to run the application in your local development environment:

### 1. Prepare Environment Variables

Create a `.env` file in the repository root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=...
```

_Note: If Turso credentials are omitted locally, the app falls back to `fitness.db` in the workspace root. Production should always use `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`._

### 2. Install Dependencies & Build

```bash
# Install packages using pnpm
pnpm install

# Compile the routing tree and verify TS type-safety
pnpm run build
```

### 3. Database Initialization & Seeding

```bash
# Push schema changes to Turso when TURSO_DATABASE_URL is set,
# or to the local SQLite fallback when it is not.
pnpm run db:push

# Populate database with standard exercise sets and mock trainers
pnpm run db:seed
```

### 4. Run the Dev Server

```bash
# Spin up the Vinxi server (runs on http://localhost:3000)
pnpm run dev
```

### 5. Quality Commands

```bash
# Run fast JavaScript/TypeScript linting
pnpm run lint

# Apply safe lint fixes
pnpm run lint:fix

# Format all tracked source/docs/config files
pnpm run format

# Verify formatting for CI or review
pnpm run format:check
```

Prettier ignores generated/build artifacts such as `dist`, `.netlify`, `.tanstack`, `fitness.db`, `pnpm-lock.yaml`, and `src/routeTree.gen.ts`. Oxlint ignores the same generated/build surfaces through `.oxlintrc.json`.

---

## Netlify Serverless Deployment & Hosting Setup

Kyber Fitness is fully configured for deployment on **Netlify** using TanStack Start's official Netlify adapter.

### 1. Adapter and Bundler Configuration

We installed `@netlify/vite-plugin-tanstack-start` and integrated it into the plugins array of `vite.config.ts`:

```typescript
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig({
  plugins: [
    // ... other plugins
    netlify(),
  ],
})
```

This allows Netlify to seamlessly intercept the build process, generating the edge and serverless runtime files inside `.netlify/v1/functions/server.mjs`.

### 2. Build Settings (`netlify.toml`)

Build settings are declared inside `netlify.toml` in the project root:

```toml
[build]
  command = "pnpm run build"
  publish = "dist/client"

[dev]
  command = "pnpm run dev"
  port = 3000
```

### 3. pnpm Workspace Build Permissions

To support **pnpm v11+** workspace security controls, we configured `pnpm-workspace.yaml` to explicitly permit local script builds for key packages (like `lightningcss`, `esbuild`, and `sharp`):

```yaml
allowBuilds:
  '@clerk/shared': true
  '@parcel/watcher': true
  'esbuild': true
  'lightningcss': true
  'sharp': true
```

### 4. Netlify Dashboard Environment Variables

To complete the build and runtime pipeline, navigate to **Site configuration > Environment variables** in your Netlify Dashboard and define the following variables:

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk's public key.
- `CLERK_SECRET_KEY`: Clerk's private API key.
- `VITE_CLERK_SIGN_IN_URL`: `/sign-in`
- `VITE_CLERK_SIGN_UP_URL`: `/sign-up`
- `VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL`: final post-login target, usually `/dashboard`.
- `VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL`: final post-registration target, usually `/onboarding`.
- `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: `/dashboard`
- `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`: `/onboarding`
- `TURSO_DATABASE_URL`: Turso/libSQL database URL, for example `libsql://...`.
- `TURSO_AUTH_TOKEN`: Turso database auth token.

The app sends Clerk's immediate force redirect back through the client-side auth page with a small app-owned target parameter. A shared redirect utility strips auth query parameters from the URL and then performs a second clean redirect to the configured final target.

### 5. Strict Dependency Resolution (`unctx`)

To resolve Rolldown/Vite compilation errors under pnpm's strict dependency model, `unctx` was added as a direct dependency in `package.json`. This guarantees that our Nitro context-retrieval shims inside `src/shim.ts` resolve perfectly during production bundler compilation on Netlify.

---

---

## Security & Permissions Matrix

- **Profile Settings:** Both athletes and trainers can use `/settings` to manage their profile details (height, fitness goal, activity level) or trainer credentials (specialization, gym/studio name, experience).
- **Athletes:** Complete control over personal health metrics, workout history, and personal logging. Athletes can review or revoke trainer access at any time from `/my-trainers`.
- **Trainers:** Access is strictly read-only for metrics unless the client grants explicit write permissions (`canAddSessions = true`). All database writes are signed with `recordedByUserId` for full accountability.
- **Program Templates:** Trainers can edit or delete only templates they created. Athletes can view assigned program content only through their own assignment records.
- **Assignment Completion:** Workout assignment completion is validated server-side against the current athlete, the assignment ID, and `status = 'pending'`.

---

## Documentation Maintenance Rule

When adding or changing product features, routes, server actions, database schema, permissions, environment variables, deployment behavior, or developer tooling, update both `README.md` and `AGENTS.md` in the same branch. New features are not considered complete until the user-facing overview and the agent implementation guide both reflect the change.
