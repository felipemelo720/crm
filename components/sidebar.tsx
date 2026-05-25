"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  FolderKanban,
  CheckSquare,
  Wallet,
  Building2,
  NotebookPen,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/leads", icon: TrendingUp, label: "Leads / Ventas" },
  { href: "/propuestas", icon: FileText, label: "Propuestas" },
  { href: "/proyectos", icon: FolderKanban, label: "Proyectos" },
  { href: "/tareas", icon: CheckSquare, label: "Tareas" },
  { href: "/finanzas", icon: Wallet, label: "Finanzas" },
  { href: "/notas", icon: NotebookPen, label: "Notas" },
  { href: "/productividad", icon: Target, label: "Productividad" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4">
        <Building2 className="h-5 w-5 text-zinc-800" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-zinc-900">IntegraSistemas</span>
          <span className="text-[10px] text-zinc-400">CRM interno</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-zinc-200 px-4 py-3">
        <p className="text-[10px] text-zinc-400">FelipeMelo.cl · IntegraSistemas.cl</p>
      </div>
    </aside>
  )
}
