"use client"

import { BASE_PATH } from "@/lib/api"

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
import { ESTADOS_PAGO, TIPOS_PAGO, TIPOS_SERVICIO, FORMAS_PAGO, formatCLP, formatDate, isOverdue } from "@/lib/constants"
import { Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type Pago = {
  id: string
  descripcion: string
  tipo: string
  servicio?: string | null
  monto: number
  fechaEmision: string
  fechaPago?: string | null
  estado: string
  metodoPago?: string | null
  utilidadEstimada?: number | null
  numeroDocumento?: string | null
  notas?: string | null
  clienteId?: string | null
  proyectoId?: string | null
  cliente?: { id: string; empresa: string } | null
  proyecto?: { id: string; nombre: string } | null
}

const EMPTY: Partial<Pago> = { tipo: "INGRESO", estado: "PENDIENTE" }

export default function FinanzasPage() {
  const [items, setItems] = useState<Pago[]>([])
  const [clientes, setClientes] = useState<{ id: string; empresa: string }[]>([])
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([])
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("ALL")
  const [tipoFilter, setTipoFilter] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Pago>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (estadoFilter !== "ALL") params.set("estado", estadoFilter)
    if (tipoFilter !== "ALL") params.set("tipo", tipoFilter)
    const [r1, r2, r3] = await Promise.all([
      fetch(`${BASE_PATH}/api/finanzas?${params}`),
      fetch(`${BASE_PATH}/api/clientes`),
      fetch(`${BASE_PATH}/api/proyectos`),
    ])
    setItems(await r1.json())
    setClientes(await r2.json())
    setProyectos(await r3.json())
  }, [search, estadoFilter, tipoFilter])

  useEffect(() => { load() }, [load])

  async function save() {
    setLoading(true)
    try {
      const method = editing.id ? "PATCH" : "POST"
      const url = editing.id ? `${BASE_PATH}/api/finanzas/${editing.id}` : `${BASE_PATH}/api/finanzas`
      const { cliente: _c, proyecto: _p, ...data } = editing as Pago
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editing.id ? "Registro actualizado" : "Registro creado")
      setOpen(false); setEditing(EMPTY); load()
    } catch { toast.error("Error al guardar") }
    finally { setLoading(false) }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar registro?")) return
    await fetch(`${BASE_PATH}/api/finanzas/${id}`, { method: "DELETE" })
    toast.success("Registro eliminado"); load()
  }

  const totalIngresos = items.filter(p => p.tipo === "INGRESO" && p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0)
  const totalPendiente = items.filter(p => p.tipo === "INGRESO" && ["PENDIENTE","VENCIDO"].includes(p.estado)).reduce((s, p) => s + p.monto, 0)
  const totalGastos = items.filter(p => p.tipo === "GASTO" && p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finanzas"
        description="Ingresos, gastos y pagos"
        action={
          <Button size="sm" onClick={() => { setEditing(EMPTY); setOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo Registro
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Ingresos cobrados
          </div>
          <div className="mt-1 text-xl font-semibold text-zinc-900">{formatCLP(totalIngresos)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Por cobrar
          </div>
          <div className="mt-1 text-xl font-semibold text-zinc-900">{formatCLP(totalPendiente)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Gastos
          </div>
          <div className="mt-1 text-xl font-semibold text-zinc-900">{formatCLP(totalGastos)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar descripción, cliente..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={tipoFilter} onValueChange={v => setTipoFilter(v ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Ingreso/Gasto</SelectItem>
            <SelectItem value="INGRESO">Ingreso</SelectItem>
            <SelectItem value="GASTO">Gasto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos estados</SelectItem>
            {Object.entries(ESTADOS_PAGO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Descripción</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Emisión</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-zinc-400">Sin registros</TableCell></TableRow>
            )}
            {items.map(p => {
              const vencido = p.estado === "PENDIENTE" && p.tipo === "INGRESO" && isOverdue(p.fechaEmision)
              return (
                <TableRow key={p.id} className={`hover:bg-zinc-50 ${vencido ? "bg-red-50" : ""}`}>
                  <TableCell>
                    <div className="font-medium text-zinc-900">{p.descripcion}</div>
                    {p.numeroDocumento && <div className="text-xs text-zinc-400">#{p.numeroDocumento}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">{p.cliente?.empresa ?? "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.tipo === "INGRESO" ? "text-green-700" : "text-red-700"}`}>
                      {p.tipo === "INGRESO" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {TIPOS_PAGO[p.tipo as keyof typeof TIPOS_PAGO]}
                    </span>
                  </TableCell>
                  <TableCell className={`text-sm font-medium ${p.tipo === "INGRESO" ? "text-green-700" : "text-red-700"}`}>
                    {formatCLP(p.monto)}
                  </TableCell>
                  <TableCell>
                    {ESTADOS_PAGO[p.estado as keyof typeof ESTADOS_PAGO] && (
                      <StatusBadge {...ESTADOS_PAGO[p.estado as keyof typeof ESTADOS_PAGO]} />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">{formatDate(p.fechaEmision)}</TableCell>
                  <TableCell className="text-sm text-zinc-600">{formatDate(p.fechaPago)}</TableCell>
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
            <DialogTitle>{editing.id ? "Editar Registro" : "Nuevo Registro"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="col-span-2 space-y-1">
              <Label>Descripción *</Label>
              <Input value={editing.descripcion ?? ""} onChange={e => setEditing(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={editing.tipo ?? "INGRESO"} onValueChange={v => setEditing(p => ({ ...p, tipo: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGRESO">Ingreso</SelectItem>
                  <SelectItem value="GASTO">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Monto (CLP) *</Label>
              <Input type="number" value={editing.monto ?? ""} onChange={e => setEditing(p => ({ ...p, monto: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={editing.estado ?? "PENDIENTE"} onValueChange={v => setEditing(p => ({ ...p, estado: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_PAGO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Método de Pago</Label>
              <Select value={editing.metodoPago ?? "none"} onValueChange={v => setEditing(p => ({ ...p, metodoPago: v === "none" ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {Object.entries(FORMAS_PAGO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha Emisión</Label>
              <Input type="date" value={editing.fechaEmision ? new Date(editing.fechaEmision).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} onChange={e => setEditing(p => ({ ...p, fechaEmision: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Fecha de Pago</Label>
              <Input type="date" value={editing.fechaPago ? new Date(editing.fechaPago).toISOString().split("T")[0] : ""} onChange={e => setEditing(p => ({ ...p, fechaPago: e.target.value || undefined }))} />
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
              <Label>N° Documento</Label>
              <Input value={editing.numeroDocumento ?? ""} onChange={e => setEditing(p => ({ ...p, numeroDocumento: e.target.value }))} placeholder="Factura, boleta..." />
            </div>
            <div className="space-y-1">
              <Label>Utilidad Estimada (CLP)</Label>
              <Input type="number" value={editing.utilidadEstimada ?? ""} onChange={e => setEditing(p => ({ ...p, utilidadEstimada: Number(e.target.value) || undefined }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notas</Label>
              <Textarea value={editing.notas ?? ""} onChange={e => setEditing(p => ({ ...p, notas: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !editing.descripcion || !editing.monto}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
