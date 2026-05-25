"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatCLP, formatDate, ESTADOS_LEAD } from "@/lib/constants"
import { StatusBadge } from "@/components/status-badge"
import { BASE_PATH } from "@/lib/api"
import {
  Users, TrendingUp, FileText, FolderKanban,
  AlertTriangle, Wallet, CalendarClock, ArrowRight,
  CheckSquare
} from "lucide-react"

type DashboardData = {
  leadsNuevos: number
  propuestasActivas: number
  proyectosActivos: number
  tareasAtrasadas: number
  pagosPendientes: { total: number; count: number }
  ingresosDelMes: number
  proximosSeguimientos: Array<{
    id: string
    nombre: string
    empresa: string | null
    proximoSeguimiento: string
    estado: string
  }>
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  alert,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  href: string
  alert?: boolean
}) {
  return (
    <Link href={href} className={`group block rounded-lg border bg-white p-5 transition-shadow hover:shadow-md ${alert ? "border-orange-300 bg-orange-50" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-md p-2 ${alert ? "bg-orange-100" : "bg-zinc-100"}`}>
          <Icon className={`h-5 w-5 ${alert ? "text-orange-600" : "text-zinc-600"}`} />
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
      </div>
      <div className={`mt-3 text-2xl font-bold ${alert ? "text-orange-700" : "text-zinc-900"}`}>{value}</div>
      <div className="mt-0.5 text-sm font-medium text-zinc-600">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </Link>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch(`${BASE_PATH}/api/dashboard`).then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cargando métricas...</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg border border-zinc-200 bg-zinc-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const now = new Date()
  const monthName = now.toLocaleDateString("es-CL", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">{monthName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          icon={TrendingUp}
          label="Leads nuevos"
          value={data.leadsNuevos}
          sub="Sin contactar"
          href="/leads"
        />
        <KPICard
          icon={FileText}
          label="Propuestas activas"
          value={data.propuestasActivas}
          sub="Enviadas o en negociación"
          href="/propuestas"
        />
        <KPICard
          icon={FolderKanban}
          label="Proyectos activos"
          value={data.proyectosActivos}
          sub="En desarrollo"
          href="/proyectos"
        />
        <KPICard
          icon={CheckSquare}
          label="Tareas atrasadas"
          value={data.tareasAtrasadas}
          sub="Vencimiento superado"
          href="/tareas"
          alert={data.tareasAtrasadas > 0}
        />
        <KPICard
          icon={AlertTriangle}
          label="Pagos pendientes"
          value={data.pagosPendientes.count}
          sub={formatCLP(data.pagosPendientes.total)}
          href="/finanzas"
          alert={data.pagosPendientes.count > 0}
        />
        <KPICard
          icon={Wallet}
          label="Ingresos del mes"
          value={formatCLP(data.ingresosDelMes)}
          sub="Cobros recibidos"
          href="/finanzas"
        />
        <KPICard
          icon={Users}
          label="Seguimientos"
          value={data.proximosSeguimientos.length}
          sub="Próximos 7 días"
          href="/leads"
        />
      </div>

      {data.proximosSeguimientos.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3">
            <CalendarClock className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-800">Próximos seguimientos</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {data.proximosSeguimientos.map(s => {
              const estadoInfo = ESTADOS_LEAD[s.estado as keyof typeof ESTADOS_LEAD]
              return (
                <Link key={s.id} href="/leads" className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{s.nombre}</div>
                    {s.empresa && <div className="text-xs text-zinc-400">{s.empresa}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    {estadoInfo && <StatusBadge {...estadoInfo} />}
                    <span className="text-xs text-zinc-500">{formatDate(s.proximoSeguimiento)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {data.proximosSeguimientos.length === 0 && data.tareasAtrasadas === 0 && data.leadsNuevos === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
          <div className="text-zinc-400 text-sm">Todo al día. Sin alertas pendientes.</div>
        </div>
      )}
    </div>
  )
}
