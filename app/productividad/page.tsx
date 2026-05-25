"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Star, StarOff, Trash2, Plus, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AREAS_PRODUCTIVIDAD } from "@/lib/constants"
import { formatDate } from "@/lib/constants"

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

function calcLocalStats(tareas: TareaProductividad[]): Stats {
  const areas = ["CARRERA", "CRECIMIENTO", "NEGOCIO", "SALUD", "OTRO"]
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
  return { porArea, pctTotal, criticaDone, totalTareas: tareas.length, completadas: tareas.filter((x) => x.completada).length }
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-green-600"
  if (pct >= 60) return "text-yellow-600"
  return "text-red-500"
}

function scoreBg(pct: number) {
  if (pct >= 80) return "bg-green-500"
  if (pct >= 60) return "bg-yellow-400"
  return "bg-red-500"
}

function todayDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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

  useEffect(() => {
    setTareas(planHoy?.tareas ?? [])
  }, [planHoy?.id, planes.length])

  const stats = calcLocalStats(tareas)

  async function crearPlan() {
    setLoading(true)
    try {
      const res = await fetch("/api/productividad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      if (!res.ok) { const e = await res.json(); toast.error(e.error); return }
      onRefresh()
      toast.success("Plan de hoy creado")
    } finally { setLoading(false) }
  }

  async function agregarTarea() {
    if (!titulo.trim() || !planHoy) return
    const res = await fetch("/api/productividad/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planDiaId: planHoy.id, titulo: titulo.trim(), area, peso, esCritica }),
    })
    if (!res.ok) { toast.error("Error al agregar tarea"); return }
    const nueva = await res.json()
    setTareas((prev) => [...prev, nueva])
    setTitulo("")
    setEsCritica(false)
  }

  async function toggleCompletada(tarea: TareaProductividad) {
    const actualizado = { ...tarea, completada: !tarea.completada }
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizado : t)))
    await fetch(`/api/productividad/tareas/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completada: actualizado.completada }),
    })
    onRefresh()
  }

  async function toggleCritica(tarea: TareaProductividad) {
    const actualizado = { ...tarea, esCritica: !tarea.esCritica }
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizado : t)))
    await fetch(`/api/productividad/tareas/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ esCritica: actualizado.esCritica }),
    })
    onRefresh()
  }

  async function eliminarTarea(id: string) {
    setTareas((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/productividad/tareas/${id}`, { method: "DELETE" })
    onRefresh()
  }

  if (!planHoy) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-5xl font-bold text-zinc-200">—</div>
        <p className="text-zinc-500">No hay plan para hoy.</p>
        <Button onClick={crearPlan} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          Crear plan de hoy
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score global */}
      <div className="flex items-start gap-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col items-center">
          <span className={`text-7xl font-black tabular-nums ${scoreColor(stats.pctTotal)}`}>{stats.pctTotal}%</span>
          <span className="mt-1 text-xs text-zinc-400">tasa de ejecución</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Tarea crítica:</span>
            {tareas.filter((t) => t.esCritica).length === 0 ? (
              <span className="text-zinc-400">sin asignar</span>
            ) : stats.criticaDone ? (
              <span className="font-semibold text-green-600">✅ Completada</span>
            ) : (
              <span className="font-semibold text-red-500">❌ Pendiente</span>
            )}
          </div>
          <div className="text-sm text-zinc-500">
            {stats.completadas} / {stats.totalTareas} tareas completadas
          </div>
          {/* Progress bar total */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${scoreBg(stats.pctTotal)}`}
              style={{ width: `${stats.pctTotal}%` }}
            />
          </div>
          {/* Por área */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 sm:grid-cols-3">
            {stats.porArea.map((a) => {
              const cfg = AREAS_PRODUCTIVIDAD[a.area as AreaKey]
              return (
                <div key={a.area} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">{cfg?.label ?? a.area}</span>
                    <span className={`font-semibold ${scoreColor(a.pct ?? 0)}`}>{a.pct ?? 0}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-1.5 rounded-full ${cfg?.color ?? "bg-zinc-400"}`}
                      style={{ width: `${a.pct ?? 0}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-700">Tareas del día</h2>
        </div>
        <ul className="divide-y divide-zinc-50">
          {tareas.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-400">Sin tareas. Agrega una abajo.</li>
          )}
          {tareas.map((t) => {
            const cfg = AREAS_PRODUCTIVIDAD[t.area as AreaKey]
            return (
              <li key={t.id} className={`flex items-center gap-3 px-4 py-2.5 ${t.completada ? "opacity-60" : ""}`}>
                <button onClick={() => toggleCompletada(t)} className="shrink-0 text-zinc-400 hover:text-zinc-700">
                  {t.completada ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
                </button>
                <span className={`flex-1 text-sm ${t.completada ? "line-through text-zinc-400" : "text-zinc-800"}`}>
                  {t.titulo}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg?.badge ?? "bg-gray-100 text-gray-700"}`}>
                  {cfg?.label ?? t.area}
                </span>
                <span className="shrink-0 w-6 text-center text-xs font-bold text-zinc-400" title="Peso">
                  ×{t.peso}
                </span>
                <button
                  onClick={() => toggleCritica(t)}
                  className={`shrink-0 ${t.esCritica ? "text-yellow-400" : "text-zinc-200 hover:text-yellow-300"}`}
                  title={t.esCritica ? "Es crítica" : "Marcar como crítica"}
                >
                  {t.esCritica ? <Star className="h-4 w-4 fill-yellow-400" /> : <StarOff className="h-4 w-4" />}
                </button>
                <button onClick={() => eliminarTarea(t.id)} className="shrink-0 text-zinc-200 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>

        {/* Agregar tarea */}
        <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
          <Input
            className="min-w-[220px] flex-1"
            placeholder="Nueva tarea..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarTarea()}
          />
          <Select value={area} onValueChange={(v) => setArea((v ?? "OTRO") as AreaKey)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(AREAS_PRODUCTIVIDAD) as AreaKey[]).map((k) => (
                <SelectItem key={k} value={k}>{AREAS_PRODUCTIVIDAD[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(peso)} onValueChange={(v) => setPeso(Number(v ?? "1"))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 8, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>×{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={esCritica ? "default" : "outline"}
            size="icon"
            title="Marcar como crítica"
            onClick={() => setEsCritica((v) => !v)}
          >
            <Star className={`h-4 w-4 ${esCritica ? "fill-white" : ""}`} />
          </Button>
          <Button onClick={agregarTarea} disabled={!titulo.trim()}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Historial ───────────────────────────────────────────────────────────

function TabHistorial({ planes }: { planes: PlanDia[] }) {
  const [expandido, setExpandido] = useState<string | null>(null)
  const hoy = todayDate()
  const historico = planes.filter((p) => !isSameDay(new Date(p.fecha), hoy))

  if (historico.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-400">Sin historial aún.</p>
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs text-zinc-500">
            <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
            <th className="px-4 py-2.5 text-center font-medium">Tareas</th>
            <th className="px-4 py-2.5 text-center font-medium">%</th>
            <th className="px-4 py-2.5 text-center font-medium">Crítica</th>
            <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Áreas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {historico.map((p) => {
            const s = p.stats
            const isOpen = expandido === p.id
            return (
              <>
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-zinc-50"
                  onClick={() => setExpandido(isOpen ? null : p.id)}
                >
                  <td className="px-4 py-2.5 font-medium text-zinc-800">{formatDate(p.fecha)}</td>
                  <td className="px-4 py-2.5 text-center text-zinc-500">
                    {s.completadas}/{s.totalTareas}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`font-bold ${scoreColor(s.pctTotal)}`}>{s.pctTotal}%</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {p.tareas.some((t) => t.esCritica) ? (s.criticaDone ? "✅" : "❌") : "—"}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.porArea.map((a) => {
                        const cfg = AREAS_PRODUCTIVIDAD[a.area as AreaKey]
                        return (
                          <span key={a.area} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg?.badge ?? "bg-gray-100 text-gray-700"}`}>
                            {cfg?.label ?? a.area} {a.pct}%
                          </span>
                        )
                      })}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr key={`${p.id}-expand`}>
                    <td colSpan={5} className="bg-zinc-50 px-4 pb-3 pt-1">
                      <ul className="space-y-1">
                        {p.tareas.map((t) => {
                          const cfg = AREAS_PRODUCTIVIDAD[t.area as AreaKey]
                          return (
                            <li key={t.id} className="flex items-center gap-2 text-xs">
                              {t.completada ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Circle className="h-3.5 w-3.5 text-zinc-300" />}
                              <span className={t.completada ? "text-zinc-500 line-through" : "text-zinc-700"}>{t.titulo}</span>
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cfg?.badge ?? "bg-gray-100 text-gray-700"}`}>{cfg?.label}</span>
                              {t.esCritica && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                              <span className="text-zinc-400">×{t.peso}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab Estadísticas ────────────────────────────────────────────────────────

function TabEstadisticas({ planes }: { planes: PlanDia[] }) {
  if (planes.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-400">Sin datos aún.</p>
  }

  // Racha actual (días consecutivos ≥80% desde hoy hacia atrás)
  const sorted = [...planes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

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
      if (rachaActual === 0 && prevFecha === null) rachaActual = 0
      racha = p.stats.pctTotal >= 80 ? 1 : 0
    }
    if (prevFecha === null) rachaActual = racha
    prevFecha = f
  }
  if (rachaActual === 0 && sorted[0]?.stats.pctTotal >= 80) rachaActual = 1

  const ultimos7 = sorted.slice(0, 7)
  const ultimos30 = sorted.slice(0, 30)
  const avg7 = ultimos7.length ? Math.round(ultimos7.reduce((s, p) => s + p.stats.pctTotal, 0) / ultimos7.length) : 0
  const avg30 = ultimos30.length ? Math.round(ultimos30.reduce((s, p) => s + p.stats.pctTotal, 0) / ultimos30.length) : 0

  // Por área histórico
  const areaStats: Record<string, { total: number; completado: number; dias: number }> = {}
  for (const p of planes) {
    for (const a of p.stats.porArea) {
      if (!areaStats[a.area]) areaStats[a.area] = { total: 0, completado: 0, dias: 0 }
      areaStats[a.area].total += a.total
      areaStats[a.area].completado += a.completado
      areaStats[a.area].dias++
    }
  }

  // Últimos 14 días para gráfico
  const graf14 = sorted.slice(0, 14).reverse()

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Racha actual", value: `${rachaActual}d`, sub: "días ≥80%" },
          { label: "Mejor racha", value: `${mejorRacha}d`, sub: "días ≥80%" },
          { label: "Promedio 7d", value: `${avg7}%`, sub: "últimos 7 días" },
          { label: "Promedio 30d", value: `${avg30}%`, sub: "últimos 30 días" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-400">{k.label}</p>
            <p className={`mt-1 text-3xl font-black tabular-nums ${scoreColor(parseInt(k.value) || 0)}`}>{k.value}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico barras CSS — últimos 14 días */}
      {graf14.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-4 text-xs font-semibold text-zinc-500">Últimos {graf14.length} días</p>
          <div className="flex items-end gap-1" style={{ height: 80 }}>
            {graf14.map((p) => (
              <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
                <span className={`text-[9px] font-bold ${scoreColor(p.stats.pctTotal)}`}>{p.stats.pctTotal}%</span>
                <div
                  className={`w-full rounded-t ${scoreBg(p.stats.pctTotal)}`}
                  style={{ height: `${Math.max(4, p.stats.pctTotal * 0.56)}px` }}
                  title={`${formatDate(p.fecha)}: ${p.stats.pctTotal}%`}
                />
                <span className="text-[8px] text-zinc-400">{new Date(p.fecha).getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla por área */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-700">Rendimiento por área</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-50 text-xs text-zinc-500">
              <th className="px-4 py-2 text-left font-medium">Área</th>
              <th className="px-4 py-2 text-center font-medium">% Promedio</th>
              <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Barra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {Object.entries(areaStats)
              .map(([area, s]) => ({ area, pct: Math.round((s.completado / s.total) * 100) }))
              .sort((a, b) => b.pct - a.pct)
              .map(({ area, pct }) => {
                const cfg = AREAS_PRODUCTIVIDAD[area as AreaKey]
                return (
                  <tr key={area}>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg?.badge ?? "bg-gray-100 text-gray-700"}`}>
                        {cfg?.label ?? area}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`font-bold ${scoreColor(pct)}`}>{pct}%</span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div className={`h-2 rounded-full ${cfg?.color ?? "bg-zinc-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductividadPage() {
  const [planes, setPlanes] = useState<PlanDia[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlanes = useCallback(async () => {
    const res = await fetch("/api/productividad")
    if (res.ok) setPlanes(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlanes() }, [fetchPlanes])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-400 text-sm">Cargando...</div>
    )
  }

  const hoy = todayDate()
  const planHoy = planes.find((p) => isSameDay(new Date(p.fecha), hoy))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Productividad</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Tasa de ejecución diaria · tareas importantes completadas / planificadas
        </p>
      </div>

      <Tabs defaultValue="hoy">
        <TabsList>
          <TabsTrigger value="hoy">
            Hoy {planHoy && <span className={`ml-1.5 text-xs font-bold ${scoreColor(planHoy.stats.pctTotal)}`}>{planHoy.stats.pctTotal}%</span>}
          </TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="hoy" className="mt-4">
          <TabHoy planes={planes} onRefresh={fetchPlanes} />
        </TabsContent>
        <TabsContent value="historial" className="mt-4">
          <TabHistorial planes={planes} />
        </TabsContent>
        <TabsContent value="estadisticas" className="mt-4">
          <TabEstadisticas planes={planes} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
