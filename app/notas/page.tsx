"use client"

import { BASE_PATH } from "@/lib/api"
import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, FileText, Tag, ChevronRight, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/constants"
import { NotionEditor } from "@/components/notion-editor"

type Nota = {
  id: string
  titulo: string
  contenido: string
  tags: string
  parentId: string | null
  editadoEn: string
  creadoEn: string
}

type NotaTree = Nota & { hijos: NotaTree[] }

function buildTree(notas: Nota[], parentId: string | null = null): NotaTree[] {
  return notas
    .filter(n => n.parentId === parentId)
    .map(n => ({ ...n, hijos: buildTree(notas, n.id) }))
}

function getBreadcrumb(notas: Nota[], nota: Nota): Nota[] {
  const crumbs: Nota[] = []
  let current: Nota | undefined = nota
  while (current) {
    crumbs.unshift(current)
    current = notas.find(n => n.id === current!.parentId)
  }
  return crumbs
}

function NotaTreeItem({
  nota,
  depth,
  expanded,
  onToggle,
  onSelect,
  selectedId,
}: {
  nota: NotaTree
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onSelect: (nota: Nota) => void
  selectedId: string | null
}) {
  const hasChildren = nota.hijos.length > 0
  const isExpanded = expanded.has(nota.id)
  const isSelected = selectedId === nota.id

  return (
    <>
      <li>
        <div className="flex items-center pr-2" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          <button
            onClick={() => hasChildren && onToggle(nota.id)}
            className={cn(
              "flex-shrink-0 p-1 text-zinc-400",
              hasChildren ? "hover:text-zinc-600" : "cursor-default opacity-0 pointer-events-none"
            )}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onSelect(nota)}
            className={cn(
              "min-w-0 flex-1 rounded-md px-2 py-2 text-left transition-colors",
              isSelected ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
            )}
          >
            <p className={cn("truncate text-sm font-medium", isSelected ? "text-white" : "text-zinc-900")}>
              {nota.titulo || "Sin título"}
            </p>
            <p className={cn("mt-0.5 truncate text-xs", isSelected ? "text-zinc-300" : "text-zinc-400")}>
              {formatDate(nota.editadoEn)}
            </p>
          </button>
        </div>
      </li>
      {hasChildren && isExpanded && nota.hijos.map(hijo => (
        <NotaTreeItem
          key={hijo.id}
          nota={hijo}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </>
  )
}

export default function NotasPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Nota | null>(null)
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const pendingSaveRef = useRef<{ id: string; patch: { titulo: string; contenido: string; tags: string }; timer: ReturnType<typeof setTimeout> } | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    const r = await fetch(`${BASE_PATH}/api/notas?${params}`)
    const data = await r.json()
    setNotas(data)
    return data as Nota[]
  }, [search])

  useEffect(() => { load() }, [load])

  async function flushPending() {
    if (!pendingSaveRef.current) return
    clearTimeout(pendingSaveRef.current.timer)
    const { id, patch } = pendingSaveRef.current
    pendingSaveRef.current = null
    await fetch(`${BASE_PATH}/api/notas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
  }

  function select(nota: Nota, notasOverride?: Nota[]) {
    flushPending()
    setSelected(nota)
    setTitulo(nota.titulo)
    setContenido(nota.contenido)
    setTags(nota.tags)
    const list = notasOverride ?? notas
    const crumbs = getBreadcrumb(list, nota)
    setExpanded(prev => {
      const next = new Set(prev)
      crumbs.slice(0, -1).forEach(a => next.add(a.id))
      return next
    })
  }

  async function create() {
    try {
      const r = await fetch(`${BASE_PATH}/api/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: "Sin título", contenido: "", tags: "" }),
      })
      const nota = await r.json()
      if (!r.ok) { toast.error(nota.error ?? "Error al crear nota"); return }
      const updated = await load()
      const fresh = updated.find((n: Nota) => n.id === nota.id) ?? nota
      select(fresh, updated)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear nota")
    }
  }

  async function createSubpage() {
    if (!selected) return
    try {
      const r = await fetch(`${BASE_PATH}/api/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: "Sin título", contenido: "", tags: "", parentId: selected.id }),
      })
      const nota = await r.json()
      if (!r.ok) { toast.error(nota.error ?? "Error al crear subpágina"); return }
      const updated = await load()
      const fresh = updated.find((n: Nota) => n.id === nota.id) ?? nota
      setExpanded(prev => new Set([...prev, selected.id]))
      select(fresh, updated)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear subpágina")
    }
  }

  function scheduleAutoSave(patch: { titulo: string; contenido: string; tags: string }) {
    if (!selected) return
    const id = selected.id

    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current.timer)
      if (pendingSaveRef.current.id !== id) {
        const { id: oldId, patch: oldPatch } = pendingSaveRef.current
        fetch(`${BASE_PATH}/api/notas/${oldId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(oldPatch) })
      }
    }

    const timer = setTimeout(async () => {
      setSaving(true)
      await fetch(`${BASE_PATH}/api/notas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
      setSaving(false)
      pendingSaveRef.current = null
      load()
    }, 600)

    pendingSaveRef.current = { id, patch, timer }
  }

  function handleTitulo(v: string) { setTitulo(v); scheduleAutoSave({ titulo: v, contenido, tags }) }
  function handleContenido(v: string) { setContenido(v); scheduleAutoSave({ titulo, contenido: v, tags }) }
  function handleTags(v: string) { setTags(v); scheduleAutoSave({ titulo, contenido, tags: v }) }

  async function remove(id: string) {
    const hasChildren = notas.some(n => n.parentId === id)
    if (hasChildren && !confirm("Esta nota tiene subpáginas. ¿Eliminar todo?")) return
    const parentId = selected?.parentId
    await fetch(`${BASE_PATH}/api/notas/${id}`, { method: "DELETE" })
    toast.success("Nota eliminada")
    setSelected(null)
    setTitulo("")
    setContenido("")
    setTags("")
    const updated = await load()
    if (parentId) {
      const parent = (updated as Nota[]).find(n => n.id === parentId)
      if (parent) select(parent, updated as Nota[])
    }
  }

  const tagList = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : []
  const isSearching = search.length > 0
  const tree = buildTree(notas)
  const breadcrumb = selected ? getBreadcrumb(notas, selected) : []
  const directChildren = selected ? notas.filter(n => n.parentId === selected.id) : []

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h1 className="text-sm font-semibold text-zinc-900">Notas</h1>
          <Button size="sm" onClick={create} className="h-7 w-7 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Buscar notas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 pl-8 text-xs"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-2">
          {notas.length === 0 && (
            <li className="px-2 py-8 text-center text-xs text-zinc-400">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
              Sin notas
            </li>
          )}
          {isSearching
            ? notas.map(nota => (
                <li key={nota.id}>
                  <button
                    onClick={() => select(nota)}
                    className={cn(
                      "w-full rounded-md px-3 py-2.5 text-left transition-colors",
                      selected?.id === nota.id ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
                    )}
                  >
                    <p className={cn("truncate text-sm font-medium", selected?.id === nota.id ? "text-white" : "text-zinc-900")}>
                      {nota.titulo || "Sin título"}
                    </p>
                    <p className={cn("mt-0.5 truncate text-xs", selected?.id === nota.id ? "text-zinc-300" : "text-zinc-400")}>
                      {formatDate(nota.editadoEn)}
                    </p>
                  </button>
                </li>
              ))
            : tree.map(nota => (
                <NotaTreeItem
                  key={nota.id}
                  nota={nota}
                  depth={0}
                  expanded={expanded}
                  onToggle={id => setExpanded(prev => {
                    const next = new Set(prev)
                    next.has(id) ? next.delete(id) : next.add(id)
                    return next
                  })}
                  onSelect={select}
                  selectedId={selected?.id ?? null}
                />
              ))
          }
        </ul>
      </aside>

      {/* Editor */}
      {selected ? (
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Header: breadcrumb + title + actions */}
          <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {breadcrumb.slice(0, -1).map(b => (
                <span key={b.id} className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => select(b)}
                    className="max-w-[120px] truncate text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    {b.titulo || "Sin título"}
                  </button>
                  <ChevronRight className="h-3 w-3 text-zinc-300" />
                </span>
              ))}
              <input
                value={titulo}
                onChange={e => handleTitulo(e.target.value)}
                placeholder="Sin título"
                className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-zinc-900 outline-none placeholder:text-zinc-300"
              />
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {saving && <span className="text-xs text-zinc-400">Guardando...</span>}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                onClick={createSubpage}
              >
                <Plus className="h-3.5 w-3.5" />
                Subpágina
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500"
                onClick={() => remove(selected.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-2">
            <Tag className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
            <input
              value={tags}
              onChange={e => handleTags(e.target.value)}
              placeholder="tags separados por coma (ej: dns, cliente, proceso)"
              className="flex-1 bg-transparent text-xs text-zinc-500 outline-none placeholder:text-zinc-300"
            />
            {tagList.length > 0 && (
              <div className="flex gap-1">
                {tagList.map(t => (
                  <span key={t} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Content + subpages */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <NotionEditor
              key={selected.id}
              value={contenido}
              onChange={handleContenido}
              className="flex-1 p-6"
            />
            {directChildren.length > 0 && (
              <div className="flex-shrink-0 border-t border-zinc-100 px-6 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Subpáginas</p>
                <div className="flex flex-wrap gap-2">
                  {directChildren.map(hijo => (
                    <button
                      key={hijo.id}
                      onClick={() => select(hijo)}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-700">{hijo.titulo || "Sin título"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center text-zinc-400">
            <FileText className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p className="text-sm">Selecciona una nota o crea una nueva</p>
          </div>
        </main>
      )}
    </div>
  )
}
