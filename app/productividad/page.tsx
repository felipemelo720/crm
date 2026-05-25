"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Star,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Sparkles,
  ChevronDown,
  Inbox,
  History,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AREAS_PRODUCTIVIDAD, formatDate } from "@/lib/constants"
import { BASE_PATH } from "@/lib/api"

type AreaKey = keyof typeof AREAS_PRODUCTIVIDAD

interface TareaProductividad {
  id: string
  titulo: string
  area: string
  peso: number
  completada: boolean
  esCritica: boolean
  planDiaId: string
  creadoEn: string
}

interface AreaStat {
  area: string
  total: number
  completado: number
  pct: number | null
}

interface Stats {
  porArea: AreaStat[]
  pctTotal: number
  criticaDone: boolean
  totalTareas: number
  completadas: number
}

interface PlanDia {
  id: string
  fecha: string
  tareas: TareaProductividad[]
  stats: Stats
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcLocalStats(tareas: TareaProductividad[]): Stats {
  const areas = ["TRABAJO", "CARRERA", "CRECIMIENTO", "NEGOCIO", "TRADING", "SALUD", "RELACIONES"]
  const porArea = areas
    .map((area) => {
      const t = tareas.filter((x) => x.area === area)
      const total = t.reduce((s, x) => s + x.peso, 0)
      const completado = t.reduce((s, x) => s + (x.completada ? x.peso : 0), 0)
      return { area, total, completado, pct: total ? Math.round((completado / total) * 100) : null }
    })
    .filter((a) => a.total > 0)

  const totalPeso = tareas.reduce((s, x) => s + x.peso, 0)
  const completadoPeso = tareas.reduce((s, x) => s + (x.completada ? x.peso : 0), 0)
  const pctTotal = totalPeso ? Math.round((completadoPeso / totalPeso) * 100) : 0
  const criticas = tareas.filter((x) => x.esCritica)
  const criticaDone = criticas.length > 0 && criticas.every((x) => x.completada)
  return {
    porArea,
    pctTotal,
    criticaDone,
    totalTareas: tareas.length,
    completadas: tareas.filter((x) => x.completada).length,
  }
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-emerald-600"
  if (pct >= 60) return "text-amber-600"
  if (pct >= 30) return "text-orange-500"
  return "text-rose-500"
}

function scoreBg(pct: number) {
  if (pct >= 80) return "bg-emerald-500"
  if (pct >= 60) return "bg-amber-400"
  if (pct >= 30) return "bg-orange-400"
  return "bg-rose-500"
}

function scoreRing(pct: number) {
  if (pct >= 80) return "stroke-emerald-500"
  if (pct >= 60) return "stroke-amber-400"
  if (pct >= 30) return "stroke-orange-400"
  return "stroke-rose-500"
}

function scoreGradient(pct: number) {
  if (pct >= 80) return "from-emerald-50 via-white to-white"
  if (pct >= 60) return "from-amber-50 via-white to-white"
  if (pct >= 30) return "from-orange-50 via-white to-white"
  return "from-rose-50 via-white to-white"
}

function motivacional(pct: number, completadas: number, total: number) {
  if (total === 0) return "Define tu día. Agrega tareas para empezar."
  if (pct === 100) return "Día perfecto. Sigue así."
  if (pct >= 80) return "Gran ritmo. Cierra fuerte."
  if (pct >= 60) return "Vas bien. No te detengas."
  if (pct >= 30) return "Aún hay tiempo. Enfócate."
  if (completadas === 0) return "Empieza por la tarea crítica."
  return "Acelera. El día no espera."
}

function todayDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function diasSemanaCorto(d: Date) {
  return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.getDay()]
}

function fechaLarga(d: Date) {
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
}

// ─── Circular progress ring ─────────────────────────────────────────────────

function RingScore({ pct, size = 160 }: { pct: number; size?: number }) {
  const compact = size < 80
  const stroke = compact ? 5 : 12
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-zinc-100 fill-none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`fill-none transition-all duration-500 ${scoreRing(pct)}`}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      {!compact && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black tabular-nums ${scoreColor(pct)}`}>{pct}%</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">ejecución</span>
        </div>
      )}
    </div>
  )
}

// ─── Tab Hoy ────────────────────────────────────────────────────────────────

function TabHoy({ planes, onRefresh }: { planes: PlanDia[]; onRefresh: () => void }) {
  const hoy = todayDate()
  const planHoy = planes.find((p) => isSameDay(new Date(p.fecha), hoy))

  const [tareas, setTareas] = useState<TareaProductividad[]>(planHoy?.tareas ?? [])
  const [titulo, setTitulo] = useState("")
  const [area, setArea] = useState<AreaKey>("CARRERA")
  const [peso, setPeso] = useState(1)
  const [esCritica, setEsCritica] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agrupar, setAgrupar] = useState<"orden" | "area">("orden")

  useEffect(() => {
    setTareas(planHoy?.tareas ?? [])
  }, [planHoy?.id, planes.length])

  const stats = calcLocalStats(tareas)
  const tareaCritica = tareas.find((t) => t.esCritica)

  async function crearPlan() {
    setLoading(true)
    try {
      const ymd = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`
      const res = await fetch(`${BASE_PATH}/api/productividad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: ymd }),
      })
      if (!res.ok) {
        const e = await res.json()
        toast.error(e.error)
        return
      }
      onRefresh()
      toast.success("Plan de hoy creado")
    } finally {
      setLoading(false)
    }
  }

  async function agregarTarea() {
    if (!titulo.trim() || !planHoy) return
    const res = await fetch(`${BASE_PATH}/api/productividad/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planDiaId: planHoy.id, titulo: titulo.trim(), area, peso, esCritica }),
    })
    if (!res.ok) {
      toast.error("Error al agregar tarea")
      return
    }
    const nueva = await res.json()
    setTareas((prev) => [...prev, nueva])
    setTitulo("")
    setEsCritica(false)
  }

  async function toggleCompletada(tarea: TareaProductividad) {
    const actualizado = { ...tarea, completada: !tarea.completada }
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizado : t)))
    await fetch(`${BASE_PATH}/api/productividad/tareas/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completada: actualizado.completada }),
    })
    onRefresh()
  }

  async function toggleCritica(tarea: TareaProductividad) {
    const actualizado = { ...tarea, esCritica: !tarea.esCritica }
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizado : t)))
    await fetch(`${BASE_PATH}/api/productividad/tareas/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ esCritica: actualizado.esCritica }),
    })
    onRefresh()
  }

  async function eliminarTarea(id: string) {
    setTareas((prev) => prev.filter((t) => t.id !== id))
    await fetch(`${BASE_PATH}/api/productividad/tareas/${id}`, { method: "DELETE" })
    onRefresh()
  }

  async function limpiarCompletadas() {
    const completadas = tareas.filter((t) => t.completada)
    if (completadas.length === 0) return
    if (!confirm(`¿Eliminar ${completadas.length} tarea(s) completada(s)?`)) return
    setTareas((prev) => prev.filter((t) => !t.completada))
    await Promise.all(
      completadas.map((t) =>
        fetch(`${BASE_PATH}/api/productividad/tareas/${t.id}`, { method: "DELETE" }),
      ),
    )
    onRefresh()
  }

  if (!planHoy) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-800">Sin plan para hoy</p>
          <p className="text-xs text-zinc-500">Crea tu plan diario y define qué importa.</p>
        </div>
        <Button onClick={crearPlan} disabled={loading} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Crear plan
        </Button>
      </div>
    )
  }

  // Agrupado por área
  const tareasPorArea: Record<string, TareaProductividad[]> = {}
  for (const t of tareas) {
    if (!tareasPorArea[t.area]) tareasPorArea[t.area] = []
    tareasPorArea[t.area].push(t)
  }

  const tareasOrdenadas = [...tareas].sort((a, b) => {
    if (a.esCritica !== b.esCritica) return a.esCritica ? -1 : 1
    if (a.completada !== b.completada) return a.completada ? 1 : -1
    return 0
  })

  return (
    <div className="space-y-3">
      {/* Toolbar — toggle agrupar + counter */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-700">Tareas</span>
          <span className="text-zinc-400">{tareas.length}</span>
          {stats.completadas > 0 && (
            <button
              onClick={limpiarCompletadas}
              className="ml-2 inline-flex items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-rose-500"
              title="Eliminar tareas completadas"
            >
              <Trash2 className="h-3 w-3" />
              Limpiar {stats.completadas} completada{stats.completadas !== 1 ? "s" : ""}
            </button>
          )}
        </div>
        <div className="flex gap-0.5 rounded-md bg-zinc-100 p-0.5">
          <button
            onClick={() => setAgrupar("orden")}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
              agrupar === "orden" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setAgrupar("area")}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
              agrupar === "area" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Por área
          </button>
        </div>
      </div>

      {/* Lista densa — sin card */}
      {tareas.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">Sin tareas. Agrega la primera abajo.</p>
      ) : agrupar === "orden" ? (
        <ul className="divide-y divide-zinc-100">
          {tareasOrdenadas.map((t) => (
            <TareaItem
              key={t.id}
              tarea={t}
              onToggle={toggleCompletada}
              onCritica={toggleCritica}
              onDelete={eliminarTarea}
            />
          ))}
        </ul>
      ) : (
        <div>
          {(Object.keys(tareasPorArea) as string[]).map((areaKey) => {
            const cfg = AREAS_PRODUCTIVIDAD[areaKey as AreaKey]
            const grupo = tareasPorArea[areaKey]
            const done = grupo.filter((t) => t.completada).length
            return (
              <div key={areaKey} className="mb-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 py-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg?.color ?? "bg-zinc-400"}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {cfg?.label ?? areaKey}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {done}/{grupo.length}
                  </span>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {grupo.map((t) => (
                    <TareaItem
                      key={t.id}
                      tarea={t}
                      onToggle={toggleCompletada}
                      onCritica={toggleCritica}
                      onDelete={eliminarTarea}
                    />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {/* Inline add row — minimal */}
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        <Plus className="h-3.5 w-3.5 text-zinc-400" />
        <Input
          className="h-8 min-w-[200px] flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          placeholder="Nueva tarea…"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarTarea()}
        />
        <Select value={area} onValueChange={(v) => setArea((v ?? "CARRERA") as AreaKey)}>
          <SelectTrigger className="h-7 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(AREAS_PRODUCTIVIDAD) as AreaKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {AREAS_PRODUCTIVIDAD[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(peso)} onValueChange={(v) => setPeso(Number(v ?? "1"))}>
          <SelectTrigger className="h-7 w-[64px] text-xs" title="Peso">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 5, 8, 10].map((n) => (
              <SelectItem key={n} value={String(n)}>
                ×{n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setEsCritica((v) => !v)}
          title="Crítica"
          className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
            esCritica
              ? "border-amber-300 bg-amber-50 text-amber-500"
              : "border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${esCritica ? "fill-amber-400" : ""}`} />
        </button>
        <Button onClick={agregarTarea} disabled={!titulo.trim()} size="sm" className="h-7 px-2.5 text-xs">
          Agregar
        </Button>
      </div>
    </div>
  )
}

// ─── Chip ────────────────────────────────────────────────────────────────────

function Chip({
  icon,
  label,
  tone = "zinc",
}: {
  icon: React.ReactNode
  label: string
  tone?: "zinc" | "emerald" | "rose" | "amber"
}) {
  const tones = {
    zinc: "bg-white/80 text-zinc-700 ring-zinc-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  )
}

// ─── Tarea item ──────────────────────────────────────────────────────────────

function TareaItem({
  tarea: t,
  onToggle,
  onCritica,
  onDelete,
}: {
  tarea: TareaProductividad
  onToggle: (t: TareaProductividad) => void
  onCritica: (t: TareaProductividad) => void
  onDelete: (id: string) => void
}) {
  const cfg = AREAS_PRODUCTIVIDAD[t.area as AreaKey]
  return (
    <li
      className={`group flex items-center gap-2.5 py-1.5 text-sm transition-colors hover:bg-zinc-50 ${
        t.completada ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggle(t)}
        className="shrink-0 text-zinc-300 transition-colors hover:text-zinc-600"
        title={t.completada ? "Desmarcar" : "Marcar lista"}
      >
        {t.completada ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={() => onCritica(t)}
        className={`shrink-0 transition-colors ${
          t.esCritica
            ? "text-amber-400"
            : "text-zinc-200 opacity-0 group-hover:opacity-100 hover:text-amber-300"
        }`}
        title={t.esCritica ? "Es crítica" : "Marcar como crítica"}
      >
        <Star className={`h-3.5 w-3.5 ${t.esCritica ? "fill-amber-400" : ""}`} />
      </button>
      <span
        className={`flex-1 truncate ${
          t.completada ? "text-zinc-400 line-through" : "text-zinc-800"
        }`}
      >
        {t.titulo}
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-zinc-500 sm:inline-flex">
        <span className={`h-1.5 w-1.5 rounded-full ${cfg?.color ?? "bg-zinc-400"}`} />
        {cfg?.label ?? t.area}
      </span>
      <span className="shrink-0 w-8 text-right text-[11px] font-medium text-zinc-400 tabular-nums">
        ×{t.peso}
      </span>
      <button
        onClick={() => onDelete(t.id)}
        className="shrink-0 text-zinc-300 transition-colors hover:text-rose-500"
        title="Eliminar tarea"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

// ─── Tab Historial ───────────────────────────────────────────────────────────

function TabHistorial({ planes }: { planes: PlanDia[] }) {
  const [expandido, setExpandido] = useState<string | null>(null)
  const hoy = todayDate()
  const historico = planes
    .filter((p) => !isSameDay(new Date(p.fecha), hoy))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  if (historico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 py-20 text-center">
        <Calendar className="h-8 w-8 text-zinc-300" />
        <p className="text-sm text-zinc-500">Sin historial aún. Vuelve mañana.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {historico.map((p) => {
        const s = p.stats
        const isOpen = expandido === p.id
        const fecha = new Date(p.fecha)
        return (
          <div
            key={p.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              onClick={() => setExpandido(isOpen ? null : p.id)}
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left"
            >
              {/* Fecha */}
              <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-zinc-50 py-1.5">
                <span className="text-[10px] font-bold uppercase text-zinc-500">
                  {diasSemanaCorto(fecha)}
                </span>
                <span className="text-xl font-black text-zinc-800 tabular-nums">
                  {fecha.getDate()}
                </span>
                <span className="text-[9px] text-zinc-400">
                  {fecha.toLocaleDateString("es-CL", { month: "short" })}
                </span>
              </div>

              {/* Score grande */}
              <div className="flex shrink-0 flex-col items-center">
                <span className={`text-2xl font-black tabular-nums ${scoreColor(s.pctTotal)}`}>
                  {s.pctTotal}%
                </span>
                <span className="text-[10px] text-zinc-400">
                  {s.completadas}/{s.totalTareas}
                </span>
              </div>

              {/* Progress + áreas */}
              <div className="flex-1 space-y-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-2 rounded-full ${scoreBg(s.pctTotal)}`}
                    style={{ width: `${s.pctTotal}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.porArea.map((a) => {
                    const cfg = AREAS_PRODUCTIVIDAD[a.area as AreaKey]
                    return (
                      <span
                        key={a.area}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          cfg?.badge ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {cfg?.label} {a.pct}%
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Críticas */}
              <div className="hidden shrink-0 sm:block">
                {p.tareas.some((t) => t.esCritica) ? (
                  s.criticaDone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Crítica
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                      <Circle className="h-3.5 w-3.5" /> Crítica
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-zinc-300">—</span>
                )}
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-3">
                <ul className="space-y-1.5">
                  {p.tareas.map((t) => {
                    const cfg = AREAS_PRODUCTIVIDAD[t.area as AreaKey]
                    return (
                      <li key={t.id} className="flex items-center gap-2 text-xs">
                        {t.completada ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                        )}
                        <span
                          className={
                            t.completada ? "text-zinc-400 line-through" : "font-medium text-zinc-700"
                          }
                        >
                          {t.titulo}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            cfg?.badge ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {cfg?.label}
                        </span>
                        {t.esCritica && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                        <span className="text-zinc-400 tabular-nums">×{t.peso}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab Estadísticas ────────────────────────────────────────────────────────

function TabEstadisticas({ planes }: { planes: PlanDia[] }) {
  const calcs = useMemo(() => {
    const sorted = [...planes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    // Racha
    let rachaActual = 0
    let mejorRacha = 0
    let racha = 0
    let prevFecha: Date | null = null

    for (const p of sorted) {
      const f = new Date(p.fecha)
      const consec = prevFecha
        ? Math.round((prevFecha.getTime() - f.getTime()) / 86400000) === 1
        : true

      if (p.stats.pctTotal >= 80 && consec) {
        racha++
        if (racha > mejorRacha) mejorRacha = racha
      } else {
        racha = p.stats.pctTotal >= 80 ? 1 : 0
      }
      if (prevFecha === null) rachaActual = racha
      prevFecha = f
    }
    if (rachaActual === 0 && sorted[0]?.stats.pctTotal >= 80) rachaActual = 1

    const ultimos7 = sorted.slice(0, 7)
    const ultimos30 = sorted.slice(0, 30)
    const avg7 = ultimos7.length
      ? Math.round(ultimos7.reduce((s, p) => s + p.stats.pctTotal, 0) / ultimos7.length)
      : 0
    const avg30 = ultimos30.length
      ? Math.round(ultimos30.reduce((s, p) => s + p.stats.pctTotal, 0) / ultimos30.length)
      : 0

    // Por área
    const areaStats: Record<string, { total: number; completado: number; dias: number }> = {}
    for (const p of planes) {
      for (const a of p.stats.porArea) {
        if (!areaStats[a.area]) areaStats[a.area] = { total: 0, completado: 0, dias: 0 }
        areaStats[a.area].total += a.total
        areaStats[a.area].completado += a.completado
        areaStats[a.area].dias++
      }
    }

    const areaList = Object.entries(areaStats)
      .map(([area, s]) => ({
        area,
        pct: s.total ? Math.round((s.completado / s.total) * 100) : 0,
        dias: s.dias,
      }))
      .sort((a, b) => b.pct - a.pct)

    const graf14 = sorted.slice(0, 14).reverse()

    return { rachaActual, mejorRacha, avg7, avg30, areaList, graf14, sorted }
  }, [planes])

  if (planes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 py-20 text-center">
        <TrendingUp className="h-8 w-8 text-zinc-300" />
        <p className="text-sm text-zinc-500">Sin datos. Completa tu primer día.</p>
      </div>
    )
  }

  const { rachaActual, mejorRacha, avg7, avg30, areaList, graf14, sorted } = calcs

  // Heatmap 49 días (7 semanas)
  const heatmap: { fecha: Date; pct: number | null }[] = []
  const hoy = todayDate()
  for (let i = 48; i >= 0; i--) {
    const d = new Date(hoy)
    d.setDate(d.getDate() - i)
    const plan = sorted.find((p) => isSameDay(new Date(p.fecha), d))
    heatmap.push({ fecha: d, pct: plan ? plan.stats.pctTotal : null })
  }

  function heatColor(pct: number | null) {
    if (pct === null) return "bg-zinc-100"
    if (pct === 0) return "bg-zinc-200"
    if (pct >= 80) return "bg-emerald-500"
    if (pct >= 60) return "bg-emerald-300"
    if (pct >= 30) return "bg-amber-300"
    return "bg-rose-300"
  }

  const kpis = [
    { label: "Racha actual", value: `${rachaActual}d`, sub: "días ≥80%", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Mejor racha", value: `${mejorRacha}d`, sub: "récord", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Promedio 7d", value: `${avg7}%`, sub: "última semana", icon: TrendingUp, color: scoreColor(avg7), bg: "bg-blue-50" },
    { label: "Promedio 30d", value: `${avg30}%`, sub: "último mes", icon: Calendar, color: scoreColor(avg30), bg: "bg-purple-50" },
  ]

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div
              key={k.label}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`absolute right-3 top-3 rounded-lg ${k.bg} p-1.5`}>
                <Icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                {k.label}
              </p>
              <p className={`mt-2 text-3xl font-black tabular-nums ${k.color}`}>{k.value}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Heatmap 7 semanas */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-800">Últimas 7 semanas</p>
            <p className="text-[11px] text-zinc-400">Cada cuadro es un día</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span>menos</span>
            <span className="h-3 w-3 rounded-sm bg-zinc-200" />
            <span className="h-3 w-3 rounded-sm bg-rose-300" />
            <span className="h-3 w-3 rounded-sm bg-amber-300" />
            <span className="h-3 w-3 rounded-sm bg-emerald-300" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span>más</span>
          </div>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {heatmap.map((d, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-sm ${heatColor(d.pct)} transition-transform hover:scale-125`}
              title={`${formatDate(d.fecha)}: ${d.pct === null ? "sin datos" : `${d.pct}%`}`}
            />
          ))}
        </div>
      </div>

      {/* Gráfico barras */}
      {graf14.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-zinc-800">
            Últimos {graf14.length} días
          </p>
          <div className="flex items-end gap-1.5" style={{ height: 100 }}>
            {graf14.map((p) => {
              const fecha = new Date(p.fecha)
              return (
                <div key={p.id} className="group flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`text-[9px] font-bold opacity-0 transition-opacity group-hover:opacity-100 ${scoreColor(
                      p.stats.pctTotal,
                    )}`}
                  >
                    {p.stats.pctTotal}%
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all ${scoreBg(p.stats.pctTotal)} hover:opacity-80`}
                    style={{ height: `${Math.max(4, p.stats.pctTotal * 0.7)}px` }}
                    title={`${formatDate(p.fecha)}: ${p.stats.pctTotal}%`}
                  />
                  <span className="text-[9px] font-medium text-zinc-400 tabular-nums">
                    {fecha.getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Por área */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-sm font-bold text-zinc-800">Rendimiento por área</h3>
          <p className="text-[11px] text-zinc-400">Promedio histórico ponderado</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {areaList.map(({ area, pct, dias }) => {
            const cfg = AREAS_PRODUCTIVIDAD[area as AreaKey]
            return (
              <div key={area} className="flex items-center gap-4 px-5 py-3">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    cfg?.badge ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {cfg?.label ?? area}
                </span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-2 rounded-full transition-all ${cfg?.color ?? "bg-zinc-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className={`w-12 shrink-0 text-right text-base font-black tabular-nums ${scoreColor(pct)}`}>
                  {pct}%
                </span>
                <span className="hidden w-16 shrink-0 text-right text-[11px] text-zinc-400 sm:block">
                  {dias} {dias === 1 ? "día" : "días"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductividadPage() {
  const [planes, setPlanes] = useState<PlanDia[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlanes = useCallback(async () => {
    const res = await fetch(`${BASE_PATH}/api/productividad`)
    if (res.ok) setPlanes(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlanes()
  }, [fetchPlanes])

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  const hoy = todayDate()
  const planHoy = planes.find((p) => isSameDay(new Date(p.fecha), hoy))

  return (
    <div className="pb-12">
      {/* Top bar — title + meta + score */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-zinc-900">Productividad</h1>
          <p className="text-xs capitalize text-zinc-500">{fechaLarga(hoy)}</p>
        </div>
        {planHoy && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500">Score</span>
            <span className={`text-base font-semibold tabular-nums ${scoreColor(planHoy.stats.pctTotal)}`}>
              {planHoy.stats.pctTotal}%
            </span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-500 tabular-nums">
              {planHoy.stats.completadas}/{planHoy.stats.totalTareas} tareas
            </span>
            {planHoy.tareas.some((t) => t.esCritica) && (
              <>
                <span className="text-zinc-300">·</span>
                <span
                  className={`inline-flex items-center gap-1 ${
                    planHoy.stats.criticaDone ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  <Star className={`h-3 w-3 ${planHoy.stats.criticaDone ? "fill-emerald-500" : ""}`} />
                  {planHoy.stats.criticaDone ? "Crítica lista" : "Crítica pendiente"}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="hoy" orientation="vertical">
        <div className="grid grid-cols-[180px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <TabsList className="h-auto w-full flex-col items-stretch gap-0.5 bg-transparent p-0">
              <TabsTrigger
                value="hoy"
                className="justify-start gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 data-active:bg-zinc-100 data-active:text-zinc-900 data-active:shadow-none"
              >
                <Inbox className="h-4 w-4" />
                Hoy
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="justify-start gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 data-active:bg-zinc-100 data-active:text-zinc-900 data-active:shadow-none"
              >
                <History className="h-4 w-4" />
                Historial
              </TabsTrigger>
              <TabsTrigger
                value="estadisticas"
                className="justify-start gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 data-active:bg-zinc-100 data-active:text-zinc-900 data-active:shadow-none"
              >
                <BarChart3 className="h-4 w-4" />
                Estadísticas
              </TabsTrigger>
            </TabsList>

            {planHoy && planHoy.stats.porArea.length > 0 && (
              <div>
                <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Áreas
                </p>
                <div className="space-y-1">
                  {planHoy.stats.porArea.map((a) => {
                    const cfg = AREAS_PRODUCTIVIDAD[a.area as AreaKey]
                    const pct = a.pct ?? 0
                    return (
                      <div key={a.area} className="space-y-1 px-2.5 py-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg?.color ?? "bg-zinc-400"}`} />
                            <span className="truncate text-zinc-700">{cfg?.label ?? a.area}</span>
                          </div>
                          <span className={`shrink-0 font-semibold tabular-nums ${scoreColor(pct)}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-0.5 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-0.5 rounded-full transition-all duration-500 ${cfg?.color ?? "bg-zinc-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <TabsContent value="hoy">
              <TabHoy planes={planes} onRefresh={fetchPlanes} />
            </TabsContent>
            <TabsContent value="historial">
              <TabHistorial planes={planes} />
            </TabsContent>
            <TabsContent value="estadisticas">
              <TabEstadisticas planes={planes} />
            </TabsContent>
          </main>
        </div>
      </Tabs>
    </div>
  )
}
