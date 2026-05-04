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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ESTADOS_TAREA, PRIORIDADES_TAREA, TIPOS_TAREA, formatDate, isOverdue } from "@/lib/constants"
import { Plus, Search, Pencil, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type Tarea = {
  id: string
  titulo: string
  descripcion?: string | null
  tipo: string
  prioridad: string
  estado: string
  fechaLimite?: string | null
  tiempoEstimado?: number | null
  tiempoReal?: number | null
  comentarios?: string | null
  clienteId?: string | null
  proyectoId?: string | null
  cliente?: { id: string; empresa: string } | null
  proyecto?: { id: string; nombre: string } | null
}

const EMPTY: Partial<Tarea> = { estado: "PENDIENTE", prioridad: "MEDIA", tipo: "DESARROLLO" }

export default function TareasPage() {
  const [items, setItems] = useState<Tarea[]>([])
  const [clientes, setClientes] = useState<{ id: string; empresa: string }[]>([])
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([])
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("ALL")
  const [prioFilter, setPrioFilter] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Tarea>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (estadoFilter !== "ALL") params.set("estado", estadoFilter)
    if (prioFilter !== "ALL") params.set("prioridad", prioFilter)
    const [r1, r2, r3] = await Promise.all([
      fetch(`/api/tareas?${params}`),
      fetch("/api/clientes"),
      fetch("/api/proyectos"),
    ])
    setItems(await r1.json())
    setClientes(await r2.json())
    setProyectos(await r3.json())
  }, [search, estadoFilter, prioFilter])

  useEffect(() => { load() }, [load])

  async function save() {
    setLoading(true)
    try {
      const method = editing.id ? "PATCH" : "POST"
      const url = editing.id ? `/api/tareas/${editing.id}` : "/api/tareas"
      const { cliente: _c, proyecto: _p, ...data } = editing as Tarea
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editing.id ? "Tarea actualizada" : "Tarea creada")
      setOpen(false); setEditing(EMPTY); load()
    } catch { toast.error("Error al guardar") }
    finally { setLoading(false) }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar tarea?")) return
    await fetch(`/api/tareas/${id}`, { method: "DELETE" })
    toast.success("Tarea eliminada"); load()
  }

  async function complete(id: string) {
    await fetch(`/api/tareas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "COMPLETADA" }) })
    toast.success("Tarea completada"); load()
  }

  const atrasadas = items.filter(t => !["COMPLETADA","CANCELADA"].includes(t.estado) && t.fechaLimite && isOverdue(t.fechaLimite))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tareas"
        description={atrasadas.length > 0 ? `${atrasadas.length} tarea(s) atrasada(s)` : `${items.filter(t => !["COMPLETADA","CANCELADA"].includes(t.estado)).length} pendientes`}
        action={
          <Button size="sm" onClick={() => { setEditing(EMPTY); setOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nueva Tarea
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar tarea..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos estados</SelectItem>
            {Object.entries(ESTADOS_TAREA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prioFilter} onValueChange={v => setPrioFilter(v ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toda prioridad</SelectItem>
            {Object.entries(PRIORIDADES_TAREA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Tarea</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-zinc-400">Sin tareas</TableCell></TableRow>
            )}
            {items.map(t => {
              const atrasada = !["COMPLETADA","CANCELADA"].includes(t.estado) && t.fechaLimite && isOverdue(t.fechaLimite)
              return (
                <TableRow key={t.id} className={`hover:bg-zinc-50 ${atrasada ? "bg-red-50" : ""}`}>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium text-zinc-900">
                      {atrasada && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                      {t.titulo}
                    </div>
                    {t.descripcion && <div className="text-xs text-zinc-400 truncate max-w-[200px]">{t.descripcion}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">{TIPOS_TAREA[t.tipo as keyof typeof TIPOS_TAREA] ?? t.tipo}</TableCell>
                  <TableCell className="text-sm text-zinc-600">{t.proyecto?.nombre ?? "—"}</TableCell>
                  <TableCell className="text-sm text-zinc-600">{t.cliente?.empresa ?? "—"}</TableCell>
                  <TableCell>
                    {PRIORIDADES_TAREA[t.prioridad as keyof typeof PRIORIDADES_TAREA] && (
                      <StatusBadge {...PRIORIDADES_TAREA[t.prioridad as keyof typeof PRIORIDADES_TAREA]} />
                    )}
                  </TableCell>
                  <TableCell>
                    {ESTADOS_TAREA[t.estado as keyof typeof ESTADOS_TAREA] && (
                      <StatusBadge {...ESTADOS_TAREA[t.estado as keyof typeof ESTADOS_TAREA]} />
                    )}
                  </TableCell>
                  <TableCell className={`text-sm ${atrasada ? "text-red-600 font-medium" : "text-zinc-600"}`}>
                    {formatDate(t.fechaLimite)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!["COMPLETADA","CANCELADA"].includes(t.estado) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-800" onClick={() => complete(t.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(t); setOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => del(t.id)}>
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

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(EMPTY) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="col-span-2 space-y-1">
              <Label>Título *</Label>
              <Input value={editing.titulo ?? ""} onChange={e => setEditing(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={editing.tipo ?? "DESARROLLO"} onValueChange={v => setEditing(p => ({ ...p, tipo: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_TAREA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prioridad</Label>
              <Select value={editing.prioridad ?? "MEDIA"} onValueChange={v => setEditing(p => ({ ...p, prioridad: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDADES_TAREA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={editing.estado ?? "PENDIENTE"} onValueChange={v => setEditing(p => ({ ...p, estado: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_TAREA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha Límite</Label>
              <Input type="date" value={editing.fechaLimite ? new Date(editing.fechaLimite).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, fechaLimite: e.target.value || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Select value={editing.clienteId ?? "none"} onValueChange={v => setEditing(p => ({ ...p, clienteId: v === "none" ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.empresa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Proyecto</Label>
              <Select value={editing.proyectoId ?? "none"} onValueChange={v => setEditing(p => ({ ...p, proyectoId: v === "none" ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {proyectos.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tiempo Estimado (h)</Label>
              <Input type="number" step="0.5" value={editing.tiempoEstimado ?? ""} onChange={e => setEditing(p => ({ ...p, tiempoEstimado: Number(e.target.value) || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Tiempo Real (h)</Label>
              <Input type="number" step="0.5" value={editing.tiempoReal ?? ""} onChange={e => setEditing(p => ({ ...p, tiempoReal: Number(e.target.value) || undefined }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Descripción</Label>
              <Textarea value={editing.descripcion ?? ""} onChange={e => setEditing(p => ({ ...p, descripcion: e.target.value }))} rows={2} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Comentarios</Label>
              <Textarea value={editing.comentarios ?? ""} onChange={e => setEditing(p => ({ ...p, comentarios: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !editing.titulo}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
