"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ESTADOS_LEAD, FUENTES_LEAD, TIPOS_SERVICIO, formatCLP, formatDate } from "@/lib/constants"
import { Plus, Search, Pencil, Trash2, CalendarClock } from "lucide-react"
import { toast } from "sonner"

type Lead = {
  id: string
  nombre: string
  empresa?: string | null
  fuente: string
  servicio?: string | null
  dolorPrincipal?: string | null
  presupuesto?: number | null
  probabilidad?: number | null
  estado: string
  ultimoContacto?: string | null
  proximoSeguimiento?: string | null
  notas?: string | null
  clienteId?: string | null
  cliente?: { id: string; empresa: string } | null
}

const EMPTY: Partial<Lead> = { estado: "NUEVO", fuente: "WEB" }
const KANBAN_COLS = ["NUEVO", "CONTACTADO", "DIAGNOSTICO", "PROPUESTA_ENVIADA", "SEGUIMIENTO", "NEGOCIACION"] as const

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Lead>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (estadoFilter !== "ALL") params.set("estado", estadoFilter)
    const res = await fetch(`/api/leads?${params}`)
    setLeads(await res.json())
  }, [search, estadoFilter])

  useEffect(() => { load() }, [load])

  async function save() {
    setLoading(true)
    try {
      const method = editing.id ? "PATCH" : "POST"
      const url = editing.id ? `/api/leads/${editing.id}` : "/api/leads"
      const { cliente: _c, ...data } = editing as Lead
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editing.id ? "Lead actualizado" : "Lead creado")
      setOpen(false); setEditing(EMPTY); load()
    } catch { toast.error("Error al guardar") }
    finally { setLoading(false) }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar lead?")) return
    await fetch(`/api/leads/${id}`, { method: "DELETE" })
    toast.success("Lead eliminado"); load()
  }

  async function changeEstado(id: string, estado: string) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
    load()
  }

  const estado = (s: string) => ESTADOS_LEAD[s as keyof typeof ESTADOS_LEAD]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads / Ventas"
        description="Pipeline comercial"
        action={
          <Button size="sm" onClick={() => { setEditing(EMPTY); setOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo Lead
          </Button>
        }
      />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar nombre, empresa..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v ?? "")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {Object.entries(ESTADOS_LEAD).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLS.map(col => {
              const items = leads.filter(l => l.estado === col)
              const info = ESTADOS_LEAD[col]
              return (
                <div key={col} className="flex-shrink-0 w-56">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">{info.label}</span>
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(l => (
                      <div key={l.id} className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                        <div className="font-medium text-sm text-zinc-900">{l.nombre}</div>
                        {l.empresa && <div className="text-xs text-zinc-500">{l.empresa}</div>}
                        {l.presupuesto && <div className="mt-1 text-xs font-medium text-zinc-700">{formatCLP(l.presupuesto)}</div>}
                        {l.proximoSeguimiento && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                            <CalendarClock className="h-3 w-3" />
                            {formatDate(l.proximoSeguimiento)}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1">
                          <Select value={l.estado} onValueChange={v => v && changeEstado(l.id, v)}>
                            <SelectTrigger className="h-6 text-xs px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ESTADOS_LEAD).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => { setEditing(l); setOpen(true) }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Won/Lost column */}
            {(["GANADO", "PERDIDO"] as const).map(col => {
              const items = leads.filter(l => l.estado === col)
              const info = ESTADOS_LEAD[col]
              return (
                <div key={col} className="flex-shrink-0 w-56">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: col === "GANADO" ? "#16a34a" : "#dc2626" }}>{info.label}</span>
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(l => (
                      <div key={l.id} className={`rounded-lg border bg-white p-3 opacity-70 ${col === "GANADO" ? "border-green-200" : "border-red-200"}`}>
                        <div className="font-medium text-sm text-zinc-900">{l.nombre}</div>
                        {l.empresa && <div className="text-xs text-zinc-500">{l.empresa}</div>}
                        {l.presupuesto && <div className="mt-1 text-xs font-medium text-zinc-700">{formatCLP(l.presupuesto)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <div className="rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Fuente</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Presupuesto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Próximo Seguimiento</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-zinc-400">Sin leads</td></tr>
                )}
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{l.nombre}</div>
                      {l.empresa && <div className="text-xs text-zinc-400">{l.empresa}</div>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{FUENTES_LEAD[l.fuente as keyof typeof FUENTES_LEAD] ?? l.fuente}</td>
                    <td className="px-4 py-3 text-zinc-600">{l.servicio ? (TIPOS_SERVICIO[l.servicio as keyof typeof TIPOS_SERVICIO] ?? l.servicio) : "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{l.presupuesto ? formatCLP(l.presupuesto) : "—"}</td>
                    <td className="px-4 py-3">
                      {estado(l.estado) && <StatusBadge {...estado(l.estado)} />}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(l.proximoSeguimiento)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(l); setOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => del(l.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(EMPTY) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar Lead" : "Nuevo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={editing.nombre ?? ""} onChange={e => setEditing(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Empresa</Label>
              <Input value={editing.empresa ?? ""} onChange={e => setEditing(p => ({ ...p, empresa: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={editing.estado ?? "NUEVO"} onValueChange={v => setEditing(p => ({ ...p, estado: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_LEAD).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fuente</Label>
              <Select value={editing.fuente ?? "WEB"} onValueChange={v => setEditing(p => ({ ...p, fuente: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FUENTES_LEAD).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Servicio de Interés</Label>
              <Select value={editing.servicio ?? ""} onValueChange={v => setEditing(p => ({ ...p, servicio: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_SERVICIO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Presupuesto (CLP)</Label>
              <Input type="number" value={editing.presupuesto ?? ""} onChange={e => setEditing(p => ({ ...p, presupuesto: Number(e.target.value) || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Probabilidad (%)</Label>
              <Input type="number" min={0} max={100} value={editing.probabilidad ?? ""} onChange={e => setEditing(p => ({ ...p, probabilidad: Number(e.target.value) || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Próximo Seguimiento</Label>
              <Input type="date" value={editing.proximoSeguimiento ? new Date(editing.proximoSeguimiento).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, proximoSeguimiento: e.target.value || undefined }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Dolor Principal</Label>
              <Input value={editing.dolorPrincipal ?? ""} onChange={e => setEditing(p => ({ ...p, dolorPrincipal: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notas</Label>
              <Textarea value={editing.notas ?? ""} onChange={e => setEditing(p => ({ ...p, notas: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !editing.nombre}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
