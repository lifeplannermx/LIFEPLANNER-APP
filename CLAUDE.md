# LIFEPLANNER APP

## Stack
- **Framework:** Expo (React Native) + TypeScript (strict)
- **Navigation:** Expo Router (file-based routing in `app/`)
- **Backend:** Supabase (Auth + Postgres + Storage + Edge Functions)
- **State:** Zustand (stores in `lib/stores/`)
- **Styling:** StyleSheet + constants/app.ts (design tokens)
- **Charts:** react-native-svg (RadarChart component)
- **Forms:** React Hook Form + Zod (schemas in `lib/schemas/`)
- **Data fetching:** TanStack Query
- **Package manager:** pnpm

## Project Structure
- `app/` — Screens and navigation (Expo Router file-based)
  - `(auth)/` — Login, register, verify-email, forgot-password
  - `(onboarding)/` — Profile setup, context
  - `(diagnostic)/` — Test, processing, results
  - `(tabs)/` — Main app (Hoy, Progreso, Grupos, Asistente, Perfil)
  - `(plan)/` — Goal/KPI setup and detail
  - `(groups)/` — Group detail, create post
  - `(progress)/` — Evaluations, history, comparisons
  - `(settings)/` — Config, reminders, account
  - `(modals)/` — Check-in, sync status
  - `(admin)/` — Moderation
- `components/ui/` — Reusable UI (Screen, Button, TextField, SelectField, SwitchField, InlineError, LoadingState)
- `components/diagnostic/` — Diagnostic components (RadarChart, ScaleInput, ProgressBar)
- `lib/api/` — Service files (async pure, no store access)
- `lib/stores/` — Zustand stores (one per domain)
- `lib/schemas/` — Zod validation schemas
- `lib/supabase.ts` — Supabase client
- `lib/queryClient.ts` — TanStack Query config
- `types/` — Shared TypeScript types
- `hooks/` — Custom React hooks
- `constants/` — App constants and limits
- `utils/` — Pure utility functions
- `assets/` — Images, fonts, static files

## Commands
- `pnpm start` — Start Expo dev server
- `pnpm run android` — Run on Android
- `pnpm run ios` — Run on iOS

## Architecture Rules
- Services (`lib/api/`) are async pure functions — no store access
- Stores (`lib/stores/`) manage UI state — no network calls
- Schemas (`lib/schemas/`) validate all inputs/outputs with Zod
- Actions (daily tasks) are derived at runtime, never persisted
- KPIs are versioned (append-only kpi_versions)
- Diagnostics are immutable snapshots
- completion_logs are the single source of truth for execution
- RLS: owner-only for personal data, member-only for community
- Edge Functions only where client + RLS isn't enough (AI, aggregations)
- Supabase Edge Functions: `supabase/functions/` (Deno, excluded from tsconfig)

## Styling
- All components use StyleSheet.create with design tokens from `constants/app.ts`
- Design tokens: COLORS, SPACING, FONT_SIZE, BORDER_RADIUS
- Dynamic styles (scores, charts) use inline style with values from constants

## Conventions
- TypeScript strict mode for all files
- Zustand for client-side state, TanStack Query for server state
- Validate forms with Zod schemas
- Store sensitive data with expo-secure-store
- Environment variables prefixed with `EXPO_PUBLIC_`
- One active cycle per user, max 3 goals, max 3 KPIs per goal
- Path aliases: `@/*` maps to project root
