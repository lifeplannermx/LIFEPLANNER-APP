# LifePlanner App

Aplicación móvil de desarrollo personal basada en la metodología de la **Rueda de la Vida**. Permite a los usuarios evaluar 8 áreas de su vida, recibir un diagnóstico personalizado, establecer metas y dar seguimiento a actividades diarias/semanales durante ciclos de 90 días.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Expo (React Native) + TypeScript strict |
| Navegación | Expo Router (file-based routing) |
| Backend | Supabase (Auth + Postgres + Storage + Edge Functions) |
| Estado cliente | Zustand (stores por dominio) |
| Estado servidor | TanStack Query |
| Formularios | React Hook Form + Zod |
| Análisis IA | OpenAI API (gpt-4.1) — llamada directa desde la app |
| Gráficas | react-native-svg (RadarChart custom) |
| Notificaciones | expo-notifications (locales) |
| Styling | StyleSheet + design tokens (constants/app.ts) |
| Package manager | pnpm |

## Estructura del proyecto

```
app/
├── (auth)/          Login, registro, verificar email, recuperar contraseña
├── (onboarding)/    Perfil (nombre, año, género) + Contexto (pareja, hijos, ocupación)
├── (diagnostic)/    Intro → Test (8 áreas × 4 preguntas) → Processing → Results
├── (plan)/          Metas sugeridas → Config recordatorios → Overview del plan
├── (modals)/        Check-in semanal
├── (tabs)/          Hoy, Progreso, Grupos, Asistente, Perfil
├── _layout.tsx      Root layout con bootstrap flow
└── index.tsx        Router basado en bootstrap state

components/
├── ui/              Screen, Button, TextField, SelectField, SwitchField, InlineError,
│                    LoadingState, Card, Badge, Tabs, Accordion, Avatar, Progress,
│                    Skeleton, Divider
└── diagnostic/      RadarChart (SVG), ScaleInput (1-5), ProgressBar

lib/
├── api/             Services (async puras, sin acceso a stores)
│   ├── auth.service.ts
│   ├── profile.service.ts
│   ├── diagnostic.service.ts
│   ├── plan.service.ts
│   ├── ai.service.ts          ← Llamadas a OpenAI
│   └── notifications.service.ts
├── stores/          Zustand stores
│   ├── session.store.ts       ← Auth + bootstrap state
│   ├── profile.store.ts
│   ├── diagnostic.store.ts    ← Respuestas del test en progreso
│   ├── plan.store.ts          ← Ciclo activo, metas, actividades
│   └── ui.store.ts
├── schemas/         Validación Zod (auth, profile, diagnostic, plan)
├── supabase.ts      Cliente Supabase con SecureStore
└── queryClient.ts   TanStack Query config

supabase/
├── migrations/      001-007 (ver detalle abajo)
└── functions/       Edge Functions (Deno) — creadas pero no desplegadas aún

types/               TypeScript types compartidos (diagnostic.ts, plan.ts)
constants/           Design tokens (app.ts) + límites de negocio (limits.ts)
scripts/             import-segment-averages.ts (poblar datos históricos)
```

## Base de datos (Supabase)

### Migraciones ejecutadas

| # | Archivo | Tablas/cambios |
|---|---------|---------------|
| 001 | profiles_settings_areas.sql | `profiles`, `user_settings`, `life_areas` (8 áreas), `diagnostic_questions` (seed), trigger auto-create on signup |
| 002 | real_diagnostic_questions.sql | Reemplaza preguntas de ejemplo con las 32 reales (3 scale + 1 open × 8 áreas) |
| 003 | diagnostic_responses.sql | `diagnostic_responses` (respuestas), `diagnostic_snapshots` (resultados inmutables) |
| 004 | ai_analysis_and_segments.sql | Campos IA en snapshots (`area_analyses`, `global_diagnosis`, `action_plan`, `strengths_weaknesses`, `segment_comparison`), tabla `segment_averages`, función `get_segment_averages()` con fallback progresivo |
| 005 | seed_segment_averages.sql | 224 filas de promedios históricos (688 registros del CSV) segmentados por género, generación, pareja, hijos |
| 006 | cycles_goals_kpis.sql | `cycles` (90 días, 1 activo por usuario), `goals` (máx 3 por ciclo), `kpis`, `kpi_versions` (append-only), `completion_logs` |
| 007 | kpi_reminders.sql | Campos de reminder en `kpi_versions` (`reminder_enabled`, `reminder_time`, `reminder_days`), tabla `weekly_checkins` |

### RLS (Row Level Security)
- Datos personales: owner-only (profiles, settings, responses, snapshots, cycles, goals, kpis, logs, checkins)
- Catálogos: read-only para authenticated (life_areas, diagnostic_questions, segment_averages)

## Flujo de la app (bootstrap)

```
loading → unauthenticated → unverified → needs_onboarding → needs_diagnostic → needs_plan → ready
```

1. **Auth**: Login/Registro → Verificar email
2. **Onboarding**: Nombre, año nacimiento, género → Pareja, hijos, ocupación, etapa de vida
3. **Diagnóstico**: Intro → 8 áreas (3 scale + 1 open cada una) → Processing (guarda respuestas + llama OpenAI + crea ciclo) → Results (radar + diagnóstico + fortalezas)
4. **Metas**: Metas sugeridas (seleccionar/descartar) → Config recordatorios → Overview del plan
5. **Tabs**: Hoy, Progreso, Grupos, Asistente, Perfil

## Sistema de análisis

### Prompt consolidado (1 sola llamada a OpenAI)
Recibe las 24 respuestas scale + 8 textos abiertos + perfil demográfico. Genera:
- **8 diagnósticos individuales**: interpretación + diagnóstico + 3 recomendaciones (con contexto cruzado)
- **Diagnóstico global**: resumen + 3 patrones entre áreas + 3 causas raíz
- **Fortalezas/debilidades**: 3 + 3
- **3 metas sugeridas**: con 2-3 actividades medibles cada una

### Puntaje relativo (no porcentaje)
En vez de mostrar "53%", el sistema compara al usuario contra su segmento demográfico:
- **Destacado**: 10%+ arriba del segmento
- **En equilibrio**: entre -5% y +10%
- **En crecimiento**: entre -15% y -5%
- **Gran oportunidad**: -15% abajo

### Comparativa por segmento
Función SQL con fallback progresivo:
1. Género + generación + pareja + hijos (si ≥30 muestras)
2. Género + generación + pareja
3. Género + generación
4. Solo generación
5. Todos los usuarios

## Reglas de negocio

```
MAX_ACTIVE_GOALS_PER_CYCLE: 3
MAX_ACTIVE_KPIS_PER_GOAL: 3    (se muestran como "actividades")
CYCLE_DURATION_DAYS: 90
EVALUATION_PERIOD_DAYS: 30
MAX_DAILY_ACTIONS_VISIBLE: 5
MIN_DAILY_ACTIONS_VISIBLE: 3
MAX_RETROACTIVE_DAYS: 3
```

## Convenciones de UI

- NO mencionar "IA" ni "inteligencia artificial" en la interfaz
- "KPI" se muestra como **"Actividad"** al usuario
- Frases motivacionales rotativas (cambian diario)
- Tono cálido, empático y motivador en todo el copy
- Emojis solo donde agreguen valor (iconos de áreas)

## Variables de entorno (.env)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_OPENAI_MODEL=gpt-4.1
```

## Comandos

```bash
pnpm start          # Expo dev server
pnpm run android    # Android
pnpm run ios        # iOS
```

---

## MÓDULOS PENDIENTES

### 1. Fix: Pantalla de recordatorios no aparece
- **Problema**: Después de aceptar metas sugeridas, debería mostrar `setup-reminders` pero salta directo al overview
- **Causa probable**: Navegación con `router.push` no resuelve correctamente la ruta dentro del stack `(plan)`
- **Acción**: Debuggear la navegación post-accept en `suggested-goals.tsx`

### 2. Pantalla "Hoy" (Today) con datos reales
- **Objetivo**: Mostrar las 3-5 actividades prioritarias del día derivadas de los KPIs activos
- **Requiere**:
  - Lógica de derivación de acciones diarias desde KPIs (frequency + target_value)
  - UI de check-in rápido (marcar actividad como completada)
  - Guardar en `completion_logs`
  - Mostrar progreso del día (X de Y completadas)
  - Streak/racha de días consecutivos

### 3. Módulo de Progreso y Evaluaciones
- **Objetivo**: Tab "Progreso" con historial y tendencias
- **Requiere**:
  - Radar chart comparativo (diagnóstico actual vs anterior)
  - Gráficas de progreso por meta/actividad (línea temporal)
  - Evaluación mensual (cada 30 días)
  - Historial de check-ins semanales
  - KPI performance metrics

### 4. Módulo de Grupos y Comunidad
- **Objetivo**: Tab "Grupos" para accountability social
- **Requiere**:
  - Tablas: `groups`, `group_members`, `posts`, `comments`, `reactions`
  - Crear/unirse a grupos (máx 3 grupos, 20-80 miembros ideal)
  - Feed de posts dentro del grupo
  - Comentarios y reacciones
  - RLS: member-only para datos de grupo

### 5. Pantalla de Perfil y Settings
- **Objetivo**: Tab "Perfil" funcional
- **Requiere**:
  - Ver/editar datos del perfil (nombre, avatar, ocupación)
  - Cambiar contraseña
  - Configurar zona horaria, idioma
  - Gestionar notificaciones
  - Eliminar cuenta
  - Cerrar sesión

### 6. Asistente (Tab)
- **Objetivo**: Chat de recomendaciones personalizadas
- **Requiere**:
  - Interfaz de chat
  - Contexto del diagnóstico + metas + progreso
  - Llamada a OpenAI con historial de conversación
  - Historial de conversaciones pasadas

### 7. Edge Functions (migrar llamadas IA)
- **Objetivo**: Mover las llamadas a OpenAI del cliente a Supabase Edge Functions
- **Razón**: Seguridad (API key no expuesta en el cliente)
- **Ya creadas** en `supabase/functions/` pero no desplegadas
- **Requiere**: Deploy con Supabase CLI + actualizar servicios para usar `supabase.functions.invoke()`

### 8. Actualización de segment_averages
- **Objetivo**: Que los promedios por segmento se actualicen automáticamente con cada nuevo diagnóstico
- **Requiere**: Trigger o Edge Function que recalcule el segmento del usuario después de completar el diagnóstico

### 9. Re-diagnóstico
- **Objetivo**: Permitir al usuario repetir el diagnóstico después de un ciclo
- **Requiere**: Flujo de "nuevo diagnóstico" que compare con el anterior
- **Radar**: superponer diagnóstico actual vs anterior

### 10. PDF de resultados
- **Objetivo**: Generar PDF descargable con el diagnóstico completo
- **Referencia**: El sistema anterior de Airtable generaba PDFs con Documint
