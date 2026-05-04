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
import { ESTADOS_PROPUESTA, TIPOS_SERVICIO, FORMAS_PAGO, formatCLP, formatDate, isOverdue } from "@/lib/constants"
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type Propuesta = {
  id: string
  titulo: string
  servicio: string
  valor: number
  formaPago: string
  fechaEnvio?: string | null
  fechaVencimiento?: string | null
  estado: string
  comentarios?: string | null
  clienteId: string
  cliente?: { id: string; empresa: string }
  leadId?: string | null
}

const EMPTY: Partial<Propuesta> = { estado: "BORRADOR", formaPago: "TRANSFERENCIA" }

export default function PropuestasPage() {
  const [items, setItems] = useState<Propuesta[]>([])
  const [clientes, setClientes] = useState<{ id: string; empresa: string }[]>([])
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Propuesta>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (estadoFilter !== "ALL") params.set("estado", estadoFilter)
    const [r1, r2] = await Promise.all([fetch(`/api/propuestas?${params}`), fetch("/api/clientes")])
    setItems(await r1.json())
    setClientes(await r2.json())
  }, [search, estadoFilter])

  useEffect(() => { load() }, [load])

  async function save() {
    setLoading(true)
    try {
      const method = editing.id ? "PATCH" : "POST"
      const url = editing.id ? `/api/propuestas/${editing.id}` : "/api/propuestas"
      const { cliente: _c, ...data } = editing as Propuesta
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editing.id ? "Propuesta actualizada" : "Propuesta creada")
      setOpen(false); setEditing(EMPTY); load()
    } catch { toast.error("Error al guardar") }
    finally { setLoading(false) }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar propuesta?")) return
    await fetch(`/api/propuestas/${id}`, { method: "DELETE" })
    toast.success("Propuesta eliminada"); load()
  }

  const totalActivas = items.filter(p => ["ENVIADA", "NEGOCIACION"].includes(p.estado)).reduce((s, p) => s + p.valor, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Propuestas"
        description={`${items.filter(p => ["ENVIADA","NEGOCIACION"].includes(p.estado)).length} activas · ${formatCLP(totalActivas)} en pipeline`}
        action={
          <Button size="sm" onClick={() => { setEditing(EMPTY); setOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nueva Propuesta
          </Button>
        }
      />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar título, empresa..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(ESTADOS_PROPUESTA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-zinc-400">Sin propuestas</TableCell></TableRow>
            )}
            {items.map(p => {
              const vencida = p.fechaVencimiento && isOverdue(p.fechaVencimiento) && !["APROBADA","RECHAZADA","VENCIDA"].includes(p.estado)
              return (
                <TableRow key={p.id} className={`hover:bg-zinc-50 ${vencida ? "bg-orange-50" : ""}`}>
                  <TableCell>
                    <div className="font-medium text-zinc-900 flex items-center gap-1">
                      {vencida && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
                      {p.titulo}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">{p.cliente?.empresa ?? "—"}</TableCell>
                  <TableCell className="text-sm text-zinc-600">{TIPOS_SERVICIO[p.servicio as keyof typeof TIPOS_SERVICIO] ?? p.servicio}</TableCell>
                  <TableCell className="text-sm font-medium text-zinc-700">{formatCLP(p.valor)}</TableCell>
                  <TableCell>
                    {ESTADOS_PROPUESTA[p.estado as keyof typeof ESTADOS_PROPUESTA] && (
                      <StatusBadge {...ESTADOS_PROPUESTA[p.estado as keyof typeof ESTADOS_PROPUESTA]} />
                    )}
                  </TableCell>
                  <TableCell className={`text-sm ${vencida ? "text-orange-600 font-medium" : "text-zinc-600"}`}>
                    {formatDate(p.fechaVencimiento)}
                  </TableCell>
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

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(EMPTY) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar Propuesta" : "Nueva Propuesta"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="col-span-2 space-y-1">
              <Label>Título *</Label>
              <Input value={editing.titulo ?? ""} onChange={e => setEditing(p => ({ ...p, titulo: e.target.value }))} />
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
              <Label>Valor (CLP) *</Label>
              <Input type="number" value={editing.valor ?? ""} onChange={e => setEditing(p => ({ ...p, valor: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Forma de Pago</Label>
              <Select value={editing.formaPago ?? "TRANSFERENCIA"} onValueChange={v => setEditing(p => ({ ...p, formaPago: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAS_PAGO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={editing.estado ?? "BORRADOR"} onValueChange={v => setEditing(p => ({ ...p, estado: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_PROPUESTA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha de Envío</Label>
              <Input type="date" value={editing.fechaEnvio ? new Date(editing.fechaEnvio).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, fechaEnvio: e.target.value || undefined }))} />
            </div>
            <div className="space-y-1">
              <Label>Vencimiento</Label>
              <Input type="date" value={editing.fechaVencimiento ? new Date(editing.fechaVencimiento).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, fechaVencimiento: e.target.value || undefined }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Comentarios</Label>
              <Textarea value={editing.comentarios ?? ""} onChange={e => setEditing(p => ({ ...p, comentarios: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !editing.titulo || !editing.clienteId || !editing.servicio}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
