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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ESTADOS_PROYECTO, PRIORIDADES_PROYECTO, TIPOS_SERVICIO, formatCLP, formatDate, isOverdue } from "@/lib/constants"
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type Proyecto = {
  id: string
  nombre: string
  descripcion?: string | null
  servicio: string
  estado: string
  prioridad: string
  fechaInicio?: string | null
  fechaEntrega?: string | null
  valor?: number | null
  horasEstimadas?: number | null
  horasReales?: number | null
  riesgos?: string | null
  proximosPasos?: string | null
  repositorio?: string | null
  urlProduccion?: string | null
  clienteId: string
  cliente?: { id: string; empresa: string }
  _count?: { tareas: number }
}

const EMPTY: Partial<Proyecto> = { estado: "PLANIFICADO", prioridad: "MEDIA" }
const KANBAN_COLS = ["PENDIENTE_INFO", "PLANIFICADO", "DESARROLLO", "REVISION", "CORRECCIONES"] as const

export default function ProyectosPage() {
  const [items, setItems] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<{ id: string; empresa: string }[]>([])
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Proyecto>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (estadoFilter !== "ALL") params.set("estado", estadoFilter)
    const [r1, r2] = await Promise.all([fetch(`/api/proyectos?${params}`), fetch("/api/clientes")])
    setItems(await r1.json())
    setClientes(await r2.json())
  }, [search, estadoFilter])

  useEffect(() => { load() }, [load])

  async function save() {
    setLoading(true)
    try {
      const method = editing.id ? "PATCH" : "POST"
      const url = editing.id ? `/api/proyectos/${editing.id}` : "/api/proyectos"
      const { cliente: _c, _count, ...data } = editing as Proyecto & { _count?: unknown }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editing.id ? "Proyecto actualizado" : "Proyecto creado")
      setOpen(false); setEditing(EMPTY); load()
    } catch { toast.error("Error al guardar") }
    finally { setLoading(false) }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar proyecto?")) return
    await fetch(`/api/proyectos/${id}`, { method: "DELETE" })
    toast.success("Proyecto eliminado"); load()
  }

  async function changeEstado(id: string, estado: string) {
    await fetch(`/api/proyectos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
    load()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Proyectos"
        description={`${items.filter(p => ["DESARROLLO","REVISION","CORRECCIONES"].includes(p.estado)).length} en curso`}
        action={
          <Button size="sm" onClick={() => { setEditing(EMPTY); setOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo Proyecto
          </Button>
        }
      />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar proyecto, empresa..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v ?? "")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
              const colItems = items.filter(p => p.estado === col)
              const info = ESTADOS_PROYECTO[col]
              return (
                <div key={col} className="flex-shrink-0 w-60">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">{info.label}</span>
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">{colItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colItems.map(p => {
                      const atrasado = p.fechaEntrega && isOverdue(p.fechaEntrega)
                      const prioInfo = PRIORIDADES_PROYECTO[p.prioridad as keyof typeof PRIORIDADES_PROYECTO]
                      return (
                        <div key={p.id} className={`rounded-lg border bg-white p-3 shadow-sm ${atrasado ? "border-orange-300" : "border-zinc-200"}`}>
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-medium text-sm text-zinc-900 leading-snug">{p.nombre}</div>
                            {atrasado && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" />}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">{p.cliente?.empresa}</div>
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {prioInfo && <StatusBadge {...prioInfo} />}
                            {p.fechaEntrega && <span className={`text-xs ${atrasado ? "text-orange-600 font-medium" : "text-zinc-400"}`}>↗ {formatDate(p.fechaEntrega)}</span>}
                          </div>
                          <div className="mt-2">
                            <Select value={p.estado} onValueChange={v => v && changeEstado(p.id, v)}>
                              <SelectTrigger className="h-6 text-xs px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {(["ENTREGADO","CERRADO","PAUSADO"] as const).map(col => {
              const colItems = items.filter(p => p.estado === col)
              const info = ESTADOS_PROYECTO[col]
              return (
                <div key={col} className="flex-shrink-0 w-60">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{info.label}</span>
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-400">{colItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colItems.map(p => (
                      <div key={p.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 opacity-60">
                        <div className="font-medium text-sm text-zinc-700">{p.nombre}</div>
                        <div className="text-xs text-zinc-400">{p.cliente?.empresa}</div>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-zinc-400">Sin proyectos</TableCell></TableRow>
                )}
                {items.map(p => {
                  const atrasado = p.fechaEntrega && isOverdue(p.fechaEntrega) && !["ENTREGADO","CERRADO"].includes(p.estado)
                  return (
                    <TableRow key={p.id} className={`hover:bg-zinc-50 ${atrasado ? "bg-orange-50" : ""}`}>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium text-zinc-900">
                          {atrasado && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
                          {p.nombre}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">{p.cliente?.empresa ?? "—"}</TableCell>
                      <TableCell className="text-sm text-zinc-600">{TIPOS_SERVICIO[p.servicio as keyof typeof TIPOS_SERVICIO] ?? p.servicio}</TableCell>
                      <TableCell>
                        {ESTADOS_PROYECTO[p.estado as keyof typeof ESTADOS_PROYECTO] && (
                          <StatusBadge {...ESTADOS_PROYECTO[p.estado as keyof typeof ESTADOS_PROYECTO]} />
                        )}
                      </TableCell>
                      <TableCell>
                        {PRIORIDADES_PROYECTO[p.prioridad as keyof typeof PRIORIDADES_PROYECTO] && (
                          <StatusBadge {...PRIORIDADES_PROYECTO[p.prioridad as keyof typeof PRIORIDADES_PROYECTO]} />
                        )}
                      </TableCell>
                      <TableCell className={`text-sm ${atrasado ? "text-orange-600 font-medium" : "text-zinc-600"}`}>{formatDate(p.fechaEntrega)}</TableCell>
                      <TableCell className="text-sm text-zinc-600">{p.valor ? formatCLP(p.valor) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(p); setOpen(true) }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => del(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(EMPTY) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="col-span-2 space-y-1">
              <Label>Nombre *</Label>
              <Input value={editing.nombre ?? ""} onChange={e => setEditing(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Select value={editing.clienteId ?? ""} onValueChange={v => setEditing(p => ({ ...p, clienteId: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.empresa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Servicio *</Label>
              <Select value={editing.servicio ?? ""} onValueChange={v => setEditing(p => ({ ...p, servicio: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_SERVICIO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={editing.estado ?? "PLANIFICADO"} onValueChange={v => setEditing(p => ({ ...p, estado: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prioridad</Label>
              <Select value={editing.prioridad ?? "MEDIA"} onValueChange={v => setEditing(p => ({ ...p, prioridad: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDADES_PROYECTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha Inicio</Label>
              <Input type="date" value={editing.fechaInicio ? new Date(editing.fechaInicio).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, fechaInicio: e.target.value || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Fecha Entrega</Label>
              <Input type="date" value={editing.fechaEntrega ? new Date(editing.fechaEntrega).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, fechaEntrega: e.target.value || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Valor (CLP)</Label>
              <Input type="number" value={editing.valor ?? ""} onChange={e => setEditing(p => ({ ...p, valor: Number(e.target.value) || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Horas Estimadas</Label>
              <Input type="number" value={editing.horasEstimadas ?? ""} onChange={e => setEditing(p => ({ ...p, horasEstimadas: Number(e.target.value) || undefined }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Descripción</Label>
              <Textarea value={editing.descripcion ?? ""} onChange={e => setEditing(p => ({ ...p, descripcion: e.target.value }))} rows={2} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Próximos Pasos</Label>
              <Textarea value={editing.proximosPasos ?? ""} onChange={e => setEditing(p => ({ ...p, proximosPasos: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Repositorio</Label>
              <Input value={editing.repositorio ?? ""} onChange={e => setEditing(p => ({ ...p, repositorio: e.target.value }))} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-1">
              <Label>URL Producción</Label>
              <Input value={editing.urlProduccion ?? ""} onChange={e => setEditing(p => ({ ...p, urlProduccion: e.target.value }))} placeholder="https://" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !editing.nombre || !editing.clienteId || !editing.servicio}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
