@AGENTS.md

# CRM Felipe — Contexto del Proyecto

## Stack
- Next.js 16.2.4 (App Router), TypeScript, Tailwind CSS
- Prisma 7.8.0 + SQLite via `@prisma/adapter-better-sqlite3`
- shadcn/ui, lucide-react, Sonner (toasts)

## Prisma 7 — Cosas importantes
- Generated client en `app/generated/prisma/` (solo `.ts`, no `.js`)
- Import: `from "@/app/generated/prisma/client"` (NO sin `/client`)
- Requiere adapter explícito: `new PrismaBetterSqlite3({ url })` (objeto, no string)
- Config en `prisma.config.ts`, NO `url` en schema.prisma
- Singleton en `lib/prisma.ts`
- Seed: `npx tsx seed.ts` (raíz del proyecto)

## Módulos (Phase 1)
- Dashboard (`/`) — 7 KPIs + próximos seguimientos
- Clientes (`/clientes`) — CRUD tabla con búsqueda/filtro
- Leads (`/leads`) — Kanban + lista, 8 estados pipeline
- Propuestas (`/propuestas`) — Tabla, 6 estados, vencimiento visual
- Proyectos (`/proyectos`) — Kanban + lista, prioridad, horas
- Tareas (`/tareas`) — Tabla multi-filtro, quick-complete
- Finanzas (`/finanzas`) — Ingresos/gastos, estados de pago

## Estructura clave
- `lib/prisma.ts` — Prisma client singleton con adapter
- `lib/constants.ts` — Enums, labels, colores, helpers (formatCLP, formatDate, isOverdue)
- `app/api/[modulo]/route.ts` + `[id]/route.ts` — REST CRUD
- `app/[modulo]/page.tsx` — Páginas cliente (`'use client'`)
- `components/` — sidebar, status-badge, page-header
- `seed.ts` — Datos de ejemplo (4 clientes, 5 leads, etc.)

## shadcn/ui Select — Nota
`onValueChange` pasa `string | null` (no solo `string`). Usar `v => setX(v ?? "")`.
