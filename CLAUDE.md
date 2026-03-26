# LIFEPLANNER APP

## Stack
- **Framework:** Expo (React Native) + TypeScript (strict)
- **Navigation:** Expo Router (file-based routing in `app/`)
- **Backend:** Supabase (Auth + Postgres + Storage)
- **State:** Zustand (stores in `store/`)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Forms:** React Hook Form + Zod
- **Data fetching:** TanStack Query
- **Package manager:** pnpm

## Project Structure
- `app/` — Screens (Expo Router)
- `components/` — Reusable UI components
- `lib/` — Supabase client, auth helpers, API functions
- `lib/api/` — API query/mutation functions
- `store/` — Zustand stores
- `types/` — TypeScript type definitions
- `hooks/` — Custom React hooks
- `constants/` — App constants
- `utils/` — Generic helper functions
- `assets/` — Images, fonts, static files

## Commands
- `pnpm start` — Start Expo dev server
- `pnpm run android` — Run on Android
- `pnpm run ios` — Run on iOS
- `pnpm run web` — Run on web

## Conventions
- Use TypeScript strict mode for all files
- Use Zustand for client-side state, TanStack Query for server state
- Validate forms with Zod schemas
- Store sensitive data with expo-secure-store
- Environment variables prefixed with `EXPO_PUBLIC_`
- Keep components small and focused
