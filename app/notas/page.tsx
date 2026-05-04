"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Trash2, FileText, Tag } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/constants"

type Nota = {
  id: string
  titulo: string
  contenido: string
  tags: string
  editadoEn: string
  creadoEn: string
}

export default function NotasPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Nota | null>(null)
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)
  const pendingSaveRef = useRef<{ id: string; patch: { titulo: string; contenido: string; tags: string }; timer: ReturnType<typeof setTimeout> } | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    const r = await fetch(`/api/notas?${params}`)
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
    await fetch(`/api/notas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
  }

  function select(nota: Nota) {
    flushPending()
    setSelected(nota)
    setTitulo(nota.titulo)
    setContenido(nota.contenido)
    setTags(nota.tags)
  }

  async function create() {
    try {
      const r = await fetch("/api/notas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: "Sin título", contenido: "", tags: "" }) })
      const nota = await r.json()
      if (!r.ok) { toast.error(nota.error ?? "Error al crear nota"); return }
      const updated = await load()
      const fresh = updated.find((n: Nota) => n.id === nota.id) ?? nota
      select(fresh)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear nota")
    }
  }

  function scheduleAutoSave(patch: { titulo: string; contenido: string; tags: string }) {
    if (!selected) return
    const id = selected.id

    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current.timer)
      if (pendingSaveRef.current.id !== id) {
        // switching notes — flush old save immediately, fire-and-forget
        const { id: oldId, patch: oldPatch } = pendingSaveRef.current
        fetch(`/api/notas/${oldId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(oldPatch) })
      }
    }

    const timer = setTimeout(async () => {
      setSaving(true)
      await fetch(`/api/notas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
      setSaving(false)
      pendingSaveRef.current = null
      load()
    }, 600)

    pendingSaveRef.current = { id, patch, timer }
  }

  function handleTitulo(v: string) {
    setTitulo(v)
    scheduleAutoSave({ titulo: v, contenido, tags })
  }

  function handleContenido(v: string) {
    setContenido(v)
    scheduleAutoSave({ titulo, contenido: v, tags })
  }

  function handleTags(v: string) {
    setTags(v)
    scheduleAutoSave({ titulo, contenido, tags: v })
  }

  async function remove(id: string) {
    await fetch(`/api/notas/${id}`, { method: "DELETE" })
    toast.success("Nota eliminada")
    setSelected(null)
    load()
  }

  const tagList = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar lista */}
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
          {notas.map(nota => (
            <li key={nota.id}>
              <button
                onClick={() => select(nota)}
                className={cn(
                  "w-full rounded-md px-3 py-2.5 text-left transition-colors",
                  selected?.id === nota.id
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100"
                )}
              >
                <p className={cn("truncate text-sm font-medium", selected?.id === nota.id ? "text-white" : "text-zinc-900")}>
                  {nota.titulo || "Sin título"}
                </p>
                <p className={cn("mt-0.5 truncate text-xs", selected?.id === nota.id ? "text-zinc-300" : "text-zinc-400")}>
                  {formatDate(nota.editadoEn)}
                  {nota.tags && <span className="ml-2 opacity-70">{nota.tags.split(",")[0].trim()}</span>}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Editor */}
      {selected ? (
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
            <input
              value={titulo}
              onChange={e => handleTitulo(e.target.value)}
              placeholder="Sin título"
              className="flex-1 bg-transparent text-xl font-semibold text-zinc-900 outline-none placeholder:text-zinc-300"
            />
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-zinc-400">Guardando...</span>}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500" onClick={() => remove(selected.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-2">
            <Tag className="h-3.5 w-3.5 text-zinc-400" />
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
          <Textarea
            value={contenido}
            onChange={e => handleContenido(e.target.value)}
            placeholder="Escribe aquí..."
            className="flex-1 resize-none rounded-none border-0 p-6 text-sm leading-relaxed text-zinc-700 shadow-none focus-visible:ring-0"
          />
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
