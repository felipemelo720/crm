'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, ChevronDown } from 'lucide-react'

export type BlockType = 'text' | 'todo' | 'h1' | 'h2' | 'label' | 'bullet' | 'numbered' | 'toggle' | 'code' | 'divider'

export type Block = {
  id: string
  type: BlockType
  content: string
  checked?: boolean
  collapsed?: boolean
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function parseContent(raw: string): Block[] {
  if (!raw || raw.trim() === '') return [{ id: genId(), type: 'text', content: '' }]
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    // not JSON — parse as markdown-ish plain text
  }
  const lines = raw.split('\n')
  const blocks: Block[] = []
  for (const line of lines) {
    if (line.match(/^# /)) blocks.push({ id: genId(), type: 'h1', content: line.slice(2) })
    else if (line.match(/^## /)) blocks.push({ id: genId(), type: 'h2', content: line.slice(3) })
    else if (line.match(/^[-*] /)) blocks.push({ id: genId(), type: 'bullet', content: line.slice(2) })
    else if (line.match(/^\d+\. /)) blocks.push({ id: genId(), type: 'numbered', content: line.replace(/^\d+\. /, '') })
    else if (line.match(/^\[[ x]\] /i)) blocks.push({ id: genId(), type: 'todo', content: line.slice(4), checked: line.toLowerCase().startsWith('[x]') })
    else if (line.trim() === '---') blocks.push({ id: genId(), type: 'divider', content: '' })
    else blocks.push({ id: genId(), type: 'text', content: line })
  }
  return blocks.length > 0 ? blocks : [{ id: genId(), type: 'text', content: '' }]
}

export function serializeContent(blocks: Block[]): string {
  return JSON.stringify(blocks)
}

const SLASH_COMMANDS = [
  { cmd: 'text',     label: 'Texto',       desc: 'Párrafo normal',     icon: '¶',   type: 'text'     as BlockType },
  { cmd: 'h1',       label: 'Título',       desc: 'Encabezado grande',  icon: 'H1',  type: 'h1'       as BlockType },
  { cmd: 'h2',       label: 'Subtítulo',    desc: 'Encabezado mediano', icon: 'H2',  type: 'h2'       as BlockType },
  { cmd: 'todo',     label: 'Tarea',        desc: 'Lista con checkbox', icon: '☑',  type: 'todo'     as BlockType },
  { cmd: 'bullet',   label: 'Lista',        desc: 'Lista con puntos',   icon: '•',   type: 'bullet'   as BlockType },
  { cmd: 'numbered', label: 'Numerada',     desc: 'Lista numerada',     icon: '1.',  type: 'numbered' as BlockType },
  { cmd: 'toggle',   label: 'Desplegable',  desc: 'Bloque colapsable',  icon: '▶',  type: 'toggle'   as BlockType },
  { cmd: 'code',     label: 'Código',       desc: 'Bloque de código',   icon: '</>',type: 'code'     as BlockType },
  { cmd: 'divider',  label: 'Divisor',      desc: 'Línea separadora',   icon: '—',  type: 'divider'  as BlockType },
]

const AT_OPTIONS = [
  { label: 'Hoy',    getValue: () => new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) },
  { label: 'Mañana', getValue: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) } },
  { label: 'Esta semana', getValue: () => { const d = new Date(); const end = new Date(d); end.setDate(d.getDate() + (7 - d.getDay())); return `semana del ${d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} al ${end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}` } },
]

function isFullyBold(el: Element): boolean {
  const plain = el.textContent?.trim() ?? ''
  if (!plain) return false
  const boldText = Array.from(el.querySelectorAll('strong, b'))
    .map(n => n.textContent ?? '')
    .join('')
    .trim()
  return boldText === plain
}

function inlineHtmlToText(el: Element): string {
  let result = ''
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toLowerCase()
      const inner = inlineHtmlToText(node as Element)
      if (tag === 'strong' || tag === 'b') result += inner
      else if (tag === 'em' || tag === 'i') result += inner
      else if (tag === 'code') result += `\`${inner}\``
      else if (tag === 's' || tag === 'del') result += inner
      else result += inner
    }
  }
  return result
}

function parseHtmlToBlocks(html: string): Block[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const blocks: Block[] = []

  function walk(el: Element) {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent ?? '').trim()
        if (text) blocks.push({ id: genId(), type: 'text', content: text })
        continue
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      const el2 = node as Element
      const tag = el2.tagName.toLowerCase()

      if (tag === 'h1') {
        blocks.push({ id: genId(), type: 'h1', content: inlineHtmlToText(el2).trim() })
      } else if (tag === 'h2' || tag === 'h3') {
        blocks.push({ id: genId(), type: 'h2', content: inlineHtmlToText(el2).trim() })
      } else if (tag === 'ul') {
        for (const li of Array.from(el2.querySelectorAll(':scope > li'))) {
          const text = inlineHtmlToText(li).trim()
          if (text) blocks.push({ id: genId(), type: 'bullet', content: text })
          // recurse nested lists
          const nested = li.querySelector('ul, ol')
          if (nested) walk(nested)
        }
      } else if (tag === 'ol') {
        for (const li of Array.from(el2.querySelectorAll(':scope > li'))) {
          const text = inlineHtmlToText(li).trim()
          if (text) blocks.push({ id: genId(), type: 'numbered', content: text })
          const nested = li.querySelector('ul, ol')
          if (nested) walk(nested)
        }
      } else if (tag === 'pre' || tag === 'code' && el2.closest('pre')) {
        const text = el2.textContent?.trim() ?? ''
        if (text) blocks.push({ id: genId(), type: 'code', content: text })
      } else if (tag === 'hr') {
        blocks.push({ id: genId(), type: 'divider', content: '' })
      } else if (tag === 'h4' || tag === 'h5' || tag === 'h6') {
        const text = el2.textContent?.trim() ?? ''
        if (text) blocks.push({ id: genId(), type: 'h2', content: text })
      } else if (tag === 'p' || tag === 'div' || tag === 'li') {
        if (tag === 'li') { walk(el2); continue }
        const text = inlineHtmlToText(el2).trim()
        if (!text) { walk(el2); continue }
        if (isFullyBold(el2)) {
          blocks.push({ id: genId(), type: 'label', content: text })
        } else {
          blocks.push({ id: genId(), type: 'text', content: text })
        }
      } else if (['table', 'tbody', 'thead'].includes(tag)) {
        for (const row of Array.from(el2.querySelectorAll('tr'))) {
          const cells = Array.from(row.querySelectorAll('td, th')).map(c => inlineHtmlToText(c).trim())
          if (cells.some(Boolean)) blocks.push({ id: genId(), type: 'text', content: cells.join(' | ') })
        }
      } else {
        walk(el2)
      }
    }
  }

  walk(doc.body)
  return blocks.filter(b => b.content.trim() !== '' || b.type === 'divider')
}

function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, content: string) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content, ref])
}

interface BlockEditorProps {
  block: Block
  numberedIndex: number
  onChange: (id: string, changes: Partial<Block>) => void
  onEnter: (id: string, caretPos: number) => void
  onBackspace: (id: string) => void
  onInsertBlocks: (afterId: string, newBlocks: Block[]) => void
  registerRef: (id: string, el: HTMLTextAreaElement | null) => void
}

function BlockEditor({ block, numberedIndex, onChange, onEnter, onBackspace, onInsertBlocks, registerRef }: BlockEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  useAutoResize(taRef, block.content)

  useEffect(() => {
    registerRef(block.id, taRef.current)
    return () => registerRef(block.id, null)
  }, [block.id, registerRef])

  const [slashMenu, setSlashMenu] = useState({ visible: false, filter: '', selectedIdx: 0 })
  const [atMenu, setAtMenu] = useState({ visible: false, filter: '', selectedIdx: 0, startPos: -1 })
  const [linkMenu, setLinkMenu] = useState({ visible: false, url: '' })

  const filteredSlash = slashMenu.filter
    ? SLASH_COMMANDS.filter(c =>
        c.cmd.startsWith(slashMenu.filter) ||
        c.label.toLowerCase().includes(slashMenu.filter) ||
        c.desc.toLowerCase().includes(slashMenu.filter)
      )
    : [...SLASH_COMMANDS]

  const filteredAt = atMenu.filter
    ? AT_OPTIONS.filter(o => o.label.toLowerCase().includes(atMenu.filter.toLowerCase()))
    : [...AT_OPTIONS]

  function applySlashCommand(type: BlockType) {
    const val = block.content
    const caret = taRef.current?.selectionStart ?? val.length
    const lineStart = val.lastIndexOf('\n', caret - 1) + 1
    const slashPos = val.lastIndexOf('/', caret)
    const newContent = slashPos >= lineStart
      ? val.slice(0, slashPos) + val.slice(caret)
      : val.slice(0, lineStart) + val.slice(caret)
    onChange(block.id, { type, content: newContent })
    setSlashMenu({ visible: false, filter: '', selectedIdx: 0 })
    setTimeout(() => taRef.current?.focus(), 0)
  }

  function applyAtOption(opt: typeof AT_OPTIONS[number]) {
    const val = block.content
    const newContent = val.slice(0, atMenu.startPos) + opt.getValue() + val.slice(taRef.current?.selectionStart ?? atMenu.startPos)
    onChange(block.id, { content: newContent })
    setAtMenu({ visible: false, filter: '', selectedIdx: 0, startPos: -1 })
    setTimeout(() => taRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const val = block.content
    const caret = taRef.current?.selectionStart ?? 0

    if (slashMenu.visible) {
      const len = filteredSlash.length || 1
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashMenu(m => ({ ...m, selectedIdx: (m.selectedIdx + 1) % len })); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashMenu(m => ({ ...m, selectedIdx: (m.selectedIdx - 1 + len) % len })); return }
      if (e.key === 'Enter') { e.preventDefault(); if (filteredSlash[slashMenu.selectedIdx]) applySlashCommand(filteredSlash[slashMenu.selectedIdx].type); return }
      if (e.key === 'Escape') { e.preventDefault(); setSlashMenu({ visible: false, filter: '', selectedIdx: 0 }); return }
    }

    if (atMenu.visible) {
      const len = filteredAt.length || 1
      if (e.key === 'ArrowDown') { e.preventDefault(); setAtMenu(m => ({ ...m, selectedIdx: (m.selectedIdx + 1) % len })); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAtMenu(m => ({ ...m, selectedIdx: (m.selectedIdx - 1 + len) % len })); return }
      if (e.key === 'Enter') { e.preventDefault(); if (filteredAt[atMenu.selectedIdx]) applyAtOption(filteredAt[atMenu.selectedIdx]); return }
      if (e.key === 'Escape') { e.preventDefault(); setAtMenu({ visible: false, filter: '', selectedIdx: 0, startPos: -1 }); return }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'code') return
      e.preventDefault()
      onEnter(block.id, caret)
      return
    }

    if (e.key === 'Backspace' && val === '') {
      e.preventDefault()
      onBackspace(block.id)
      return
    }

    if (e.key === ' ') {
      const lineStart = val.lastIndexOf('\n', caret - 1) + 1
      const lineBeforeCaret = val.slice(lineStart, caret)
      const shortcuts: Record<string, BlockType> = {
        '-': 'bullet', '*': 'bullet',
        '[]': 'todo', '[ ]': 'todo',
        '#': 'h1', '##': 'h2',
        '>': 'toggle', '```': 'code', '---': 'divider',
      }
      if (lineBeforeCaret in shortcuts) {
        e.preventDefault()
        const newContent = val.slice(0, lineStart) + val.slice(caret)
        onChange(block.id, { type: shortcuts[lineBeforeCaret], content: newContent.trim() })
        return
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    const caret = e.target.selectionStart ?? 0

    // [[ quick page shortcut
    const lineStart = val.lastIndexOf('\n', caret - 1) + 1
    const lineBeforeCaret = val.slice(lineStart, caret)
    if (lineBeforeCaret.endsWith('[[')) {
      onChange(block.id, { content: val.slice(0, caret - 2) + '📄 ' + val.slice(caret) })
      return
    }

    onChange(block.id, { content: val })

    // @ menu
    const atIdx = lineBeforeCaret.lastIndexOf('@')
    if (atIdx !== -1 && !lineBeforeCaret.slice(atIdx + 1).includes(' ')) {
      setAtMenu({ visible: true, filter: lineBeforeCaret.slice(atIdx + 1), selectedIdx: 0, startPos: lineStart + atIdx })
    } else {
      if (atMenu.visible) setAtMenu(m => ({ ...m, visible: false }))
    }

    // slash menu
    const slashIdx = lineBeforeCaret.lastIndexOf('/')
    if (slashIdx !== -1 && !lineBeforeCaret.slice(0, slashIdx).trim()) {
      setSlashMenu({ visible: true, filter: lineBeforeCaret.slice(slashIdx + 1).toLowerCase(), selectedIdx: 0 })
    } else {
      if (slashMenu.visible) setSlashMenu(m => ({ ...m, visible: false }))
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const plainText = e.clipboardData.getData('text/plain')
    const html = e.clipboardData.getData('text/html')

    // URL → link menu
    if (plainText && /^https?:\/\/\S+$/.test(plainText.trim())) {
      e.preventDefault()
      setLinkMenu({ visible: true, url: plainText.trim() })
      return
    }

    // HTML paste (ChatGPT, Google Docs, etc.) → parse into blocks
    if (html) {
      const blocks = parseHtmlToBlocks(html)
      if (blocks.length > 0) {
        e.preventDefault()
        onInsertBlocks(block.id, blocks)
        return
      }
    }

    // Markdown plain text → parse into blocks
    if (plainText) {
      const lines = plainText.split('\n')
      const hasMarkdown = lines.some(l =>
        l.match(/^#{1,2} /) || l.match(/^[-*] /) || l.match(/^\d+\. /) || l.match(/^\[[ x]\] /i) || l.trim() === '---'
      )
      if (!hasMarkdown) return

      e.preventDefault()
      const newBlocks: Block[] = []
      for (const line of lines) {
        if (!line.trim()) continue
        if (line.match(/^# /)) newBlocks.push({ id: genId(), type: 'h1', content: line.slice(2) })
        else if (line.match(/^## /)) newBlocks.push({ id: genId(), type: 'h2', content: line.slice(3) })
        else if (line.match(/^[-*] /)) newBlocks.push({ id: genId(), type: 'bullet', content: line.slice(2) })
        else if (line.match(/^\d+\. /)) newBlocks.push({ id: genId(), type: 'numbered', content: line.replace(/^\d+\. /, '') })
        else if (line.match(/^\[[ x]\] /i)) newBlocks.push({ id: genId(), type: 'todo', content: line.slice(4), checked: line.toLowerCase().startsWith('[x]') })
        else if (line.trim() === '---') newBlocks.push({ id: genId(), type: 'divider', content: '' })
        else newBlocks.push({ id: genId(), type: 'text', content: line })
      }
      if (newBlocks.length > 0) onInsertBlocks(block.id, newBlocks)
    }
  }

  function insertLink(mode: 'bookmark' | 'embed' | 'mention') {
    const url = linkMenu.url
    setLinkMenu({ visible: false, url: '' })
    const caret = taRef.current?.selectionStart ?? block.content.length
    if (mode === 'bookmark') {
      const newContent = block.content.slice(0, caret) + `[enlace](${url})` + block.content.slice(caret)
      onChange(block.id, { content: newContent })
    } else if (mode === 'embed') {
      onInsertBlocks(block.id, [{ id: genId(), type: 'text', content: `🔗 ${url}` }])
    } else {
      const newContent = block.content.slice(0, caret) + url + block.content.slice(caret)
      onChange(block.id, { content: newContent })
    }
  }

  if (block.type === 'divider') {
    return <div className="py-2 select-none"><hr className="border-zinc-200" /></div>
  }

  const baseClass = 'w-full resize-none bg-transparent outline-none overflow-hidden py-0.5'
  const typeClass = cn(
    block.type === 'h1'     && 'text-2xl font-bold text-zinc-900 leading-tight',
    block.type === 'h2'     && 'text-xl font-semibold text-zinc-800 leading-snug',
    block.type === 'label'  && 'text-[11px] font-semibold uppercase tracking-widest text-zinc-400 leading-relaxed',
    block.type === 'code'   && 'font-mono text-sm text-emerald-300 leading-relaxed',
    !['h1', 'h2', 'label', 'code'].includes(block.type) && 'text-sm text-zinc-700 leading-relaxed',
    block.type === 'todo' && block.checked && 'line-through opacity-50',
  )

  return (
    <div className="relative">
      <div className={cn(
        'flex items-start gap-2',
        block.type === 'code'   && 'bg-zinc-900 rounded-lg px-4 py-3 my-1',
        block.type === 'h1'     && 'mt-2',
        block.type === 'h2'     && 'mt-1',
        block.type === 'label'  && 'mt-3',
      )}>
        {block.type === 'todo' && (
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => onChange(block.id, { checked: !block.checked })}
            className={cn(
              'mt-1 flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
              block.checked ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-400 hover:border-zinc-600'
            )}
          >
            {block.checked && <Check className="h-2.5 w-2.5 text-white" />}
          </button>
        )}
        {block.type === 'bullet' && (
          <span className="mt-[6px] flex-shrink-0 text-zinc-500 select-none text-[9px]">●</span>
        )}
        {block.type === 'numbered' && (
          <span className="mt-0.5 flex-shrink-0 text-zinc-500 select-none text-sm min-w-[1.25rem]">{numberedIndex}.</span>
        )}
        {block.type === 'toggle' && (
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => onChange(block.id, { collapsed: !block.collapsed })}
            className="mt-1 flex-shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {block.collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />
            }
          </button>
        )}
        <textarea
          ref={taRef}
          value={block.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            block.type === 'h1'      ? 'Título' :
            block.type === 'h2'      ? 'Subtítulo' :
            block.type === 'label'   ? 'Etiqueta...' :
            block.type === 'todo'    ? 'Pendiente...' :
            block.type === 'toggle'  ? 'Título del desplegable...' :
            block.type === 'code'    ? '// escribe código aquí...' :
            'Escribe algo, o / para comandos'
          }
          className={cn(
            baseClass,
            typeClass,
            'flex-1',
            block.type === 'toggle' && block.collapsed && 'max-h-6 overflow-hidden',
          )}
          rows={1}
        />
      </div>

      {/* Slash command menu */}
      {slashMenu.visible && filteredSlash.length > 0 && (
        <div className="absolute z-50 left-0 top-full mt-1 w-64 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
            Bloques
          </div>
          {filteredSlash.map((cmd, i) => (
            <button
              key={cmd.cmd}
              onMouseDown={e => { e.preventDefault(); applySlashCommand(cmd.type) }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                slashMenu.selectedIdx === i ? 'bg-zinc-100' : 'hover:bg-zinc-50'
              )}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 text-xs font-mono font-semibold text-zinc-600">
                {cmd.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{cmd.label}</p>
                <p className="text-xs text-zinc-500">{cmd.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* @ date menu */}
      {atMenu.visible && filteredAt.length > 0 && (
        <div className="absolute z-50 left-0 top-full mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
            Fecha
          </div>
          {filteredAt.map((opt, i) => (
            <button
              key={opt.label}
              onMouseDown={e => { e.preventDefault(); applyAtOption(opt) }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                atMenu.selectedIdx === i ? 'bg-zinc-100' : 'hover:bg-zinc-50'
              )}
            >
              <span className="text-sm text-zinc-500">📅</span>
              <span className="text-sm font-medium text-zinc-900">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Link paste menu */}
      {linkMenu.visible && (
        <div className="absolute z-50 left-0 top-full mt-1 w-72 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Pegar enlace</p>
            <p className="text-xs text-zinc-600 truncate">{linkMenu.url}</p>
          </div>
          {([
            { mode: 'bookmark', icon: '🔖', label: 'Bookmark' },
            { mode: 'embed',    icon: '📎', label: 'Embed' },
            { mode: 'mention',  icon: '🔗', label: 'Mention' },
          ] as const).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onMouseDown={e => { e.preventDefault(); insertLink(mode) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
            >
              <span>{icon}</span>
              <span className="text-sm font-medium text-zinc-900">{label}</span>
            </button>
          ))}
          <button
            onMouseDown={e => { e.preventDefault(); setLinkMenu({ visible: false, url: '' }) }}
            className="flex w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="text-sm text-zinc-400">Cancelar</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface NotionEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function NotionEditor({ value, onChange, className }: NotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseContent(value))
  const refs = useRef<Map<string, HTMLTextAreaElement>>(new Map())

  function updateBlocks(newBlocks: Block[]) {
    setBlocks(newBlocks)
    onChange(serializeContent(newBlocks))
  }

  // Compute numbered list indices (reset on non-numbered block)
  const numberedIndices = new Map<string, number>()
  let counter = 0
  for (const b of blocks) {
    if (b.type === 'numbered') numberedIndices.set(b.id, ++counter)
    else counter = 0
  }

  function handleBlockChange(id: string, changes: Partial<Block>) {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, ...changes } : b))
  }

  function handleEnter(id: string, caretPos: number) {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return
    const block = blocks[idx]
    const before = block.content.slice(0, caretPos)
    const after = block.content.slice(caretPos)

    // Empty list item → escape to text
    if (['bullet', 'numbered', 'todo'].includes(block.type) && before === '' && after === '') {
      updateBlocks(blocks.map((b, i) => i === idx ? { ...b, type: 'text' } : b))
      return
    }

    let newType: BlockType = 'text'
    if (block.type === 'bullet')   newType = 'bullet'
    if (block.type === 'numbered') newType = 'numbered'
    if (block.type === 'todo')     newType = 'todo'

    const newBlock: Block = { id: genId(), type: newType, content: after }
    updateBlocks([
      ...blocks.slice(0, idx),
      { ...block, content: before },
      newBlock,
      ...blocks.slice(idx + 1),
    ])

    setTimeout(() => {
      const el = refs.current.get(newBlock.id)
      if (el) { el.focus(); el.setSelectionRange(0, 0) }
    }, 0)
  }

  function handleBackspace(id: string) {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return

    if (idx === 0) {
      if (blocks[0].type !== 'text') updateBlocks([{ ...blocks[0], type: 'text' }, ...blocks.slice(1)])
      return
    }

    const prev = blocks[idx - 1]
    const curr = blocks[idx]

    if (curr.type === 'divider') {
      updateBlocks(blocks.filter((_, i) => i !== idx))
      setTimeout(() => refs.current.get(prev.id)?.focus(), 0)
      return
    }

    const mergedContent = prev.content + curr.content
    const newBlocks = blocks.filter((_, i) => i !== idx)
    newBlocks[idx - 1] = { ...prev, content: mergedContent }
    updateBlocks(newBlocks)

    setTimeout(() => {
      const el = refs.current.get(prev.id)
      if (el) { el.focus(); el.setSelectionRange(prev.content.length, prev.content.length) }
    }, 0)
  }

  function handleInsertBlocks(afterId: string, newBlocks: Block[]) {
    const idx = blocks.findIndex(b => b.id === afterId)
    if (idx === -1) return
    updateBlocks([...blocks.slice(0, idx + 1), ...newBlocks, ...blocks.slice(idx + 1)])
    setTimeout(() => refs.current.get(newBlocks[newBlocks.length - 1].id)?.focus(), 0)
  }

  function registerRef(id: string, el: HTMLTextAreaElement | null) {
    if (el) refs.current.set(id, el)
    else refs.current.delete(id)
  }

  return (
    <div
      className={cn('min-h-[200px] cursor-text', className)}
      onClick={e => {
        if (e.target === e.currentTarget) {
          const lastId = blocks[blocks.length - 1]?.id
          if (lastId) refs.current.get(lastId)?.focus()
        }
      }}
    >
      {blocks.map(block => (
        <BlockEditor
          key={block.id}
          block={block}
          numberedIndex={numberedIndices.get(block.id) ?? 1}
          onChange={handleBlockChange}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          onInsertBlocks={handleInsertBlocks}
          registerRef={registerRef}
        />
      ))}
    </div>
  )
}
