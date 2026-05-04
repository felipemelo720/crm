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
import { ESTADOS_CLIENTE, TIPOS_SERVICIO } from "@/lib/constants"
import { Plus, Search, Pencil, Trash2, Phone, Globe } from "lucide-react"
import { toast } from "sonner"

type Cliente = {
  id: string
  empresa: string
  rut?: string | null
  rubro?: string | null
  ciudad?: string | null
  contactoNombre?: string | null
  email?: string | null
  telefono?: string | null
  sitioWeb?: string | null
  dominio?: string | null
  estado: string
  servicios?: string | null
  observaciones?: string | null
  _count?: { proyectos: number; leads: number; tareas: number }
}

const EMPTY: Partial<Cliente> = { estado: "ACTIVO" }

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Cliente>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (estadoFilter !== "ALL") params.set("estado", estadoFilter)
    const res = await fetch(`/api/clientes?${params}`)
    setClientes(await res.json())
  }, [search, estadoFilter])

  useEffect(() => { load() }, [load])

  async function save() {
    setLoading(true)
    try {
      const method = editing.id ? "PATCH" : "POST"
      const url = editing.id ? `/api/clientes/${editing.id}` : "/api/clientes"
      const { id: _id, _count, ...data } = editing as Cliente & { _count?: unknown }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing.id ? data : { ...data }) })
      if (!res.ok) throw new Error()
      toast.success(editing.id ? "Cliente actualizado" : "Cliente creado")
      setOpen(false)
      setEditing(EMPTY)
      load()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar cliente?")) return
    await fetch(`/api/clientes/${id}`, { method: "DELETE" })
    toast.success("Cliente eliminado")
    load()
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="Empresas y contactos activos"
        action={
          <Button size="sm" onClick={() => { setEditing(EMPTY); setOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo Cliente
          </Button>
        }
      />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar empresa, RUT, email..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(ESTADOS_CLIENTE).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Proyectos</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-zinc-400">Sin clientes</TableCell>
              </TableRow>
            )}
            {clientes.map(c => (
              <TableRow key={c.id} className="hover:bg-zinc-50">
                <TableCell>
                  <div className="font-medium text-zinc-900">{c.empresa}</div>
                  {c.rut && <div className="text-xs text-zinc-400">{c.rut}</div>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{c.contactoNombre ?? "—"}</div>
                  {c.email && <div className="text-xs text-zinc-400">{c.email}</div>}
                </TableCell>
                <TableCell className="text-sm text-zinc-600">{c.ciudad ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge {...ESTADOS_CLIENTE[c.estado as keyof typeof ESTADOS_CLIENTE]} />
                </TableCell>
                <TableCell className="text-sm text-zinc-600">{c._count?.proyectos ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`} className="text-zinc-400 hover:text-zinc-700">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {c.sitioWeb && (
                      <a href={c.sitioWeb} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => del(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(EMPTY) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="col-span-2 space-y-1">
              <Label>Empresa *</Label>
              <Input value={editing.empresa ?? ""} onChange={e => setEditing(p => ({ ...p, empresa: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>RUT</Label>
              <Input value={editing.rut ?? ""} onChange={e => setEditing(p => ({ ...p, rut: e.target.value }))} placeholder="12.345.678-9" />
            </div>
            <div className="space-y-1">
              <Label>Rubro</Label>
              <Input value={editing.rubro ?? ""} onChange={e => setEditing(p => ({ ...p, rubro: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Ciudad</Label>
              <Input value={editing.ciudad ?? ""} onChange={e => setEditing(p => ({ ...p, ciudad: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={editing.estado ?? "ACTIVO"} onValueChange={v => setEditing(p => ({ ...p, estado: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_CLIENTE).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nombre Contacto</Label>
              <Input value={editing.contactoNombre ?? ""} onChange={e => setEditing(p => ({ ...p, contactoNombre: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={editing.email ?? ""} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={editing.telefono ?? ""} onChange={e => setEditing(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Sitio Web</Label>
              <Input value={editing.sitioWeb ?? ""} onChange={e => setEditing(p => ({ ...p, sitioWeb: e.target.value }))} placeholder="https://" />
            </div>
            <div className="space-y-1">
              <Label>Dominio</Label>
              <Input value={editing.dominio ?? ""} onChange={e => setEditing(p => ({ ...p, dominio: e.target.value }))} placeholder="empresa.cl" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Observaciones</Label>
              <Textarea value={editing.observaciones ?? ""} onChange={e => setEditing(p => ({ ...p, observaciones: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !editing.empresa}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
