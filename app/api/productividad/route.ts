import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function calcStats(tareas: { peso: number; completada: boolean; area: string; esCritica: boolean }[]) {
  const areas = ["TRABAJO", "CARRERA", "CRECIMIENTO", "NEGOCIO", "TRADING", "SALUD", "RELACIONES"] as const
  const porArea = areas
    .map((area) => {
      const t = tareas.filter((x) => x.area === area)
      const total = t.reduce((s, x) => s + x.peso, 0)
      const completado = t.reduce((s, x) => s + (x.completada ? x.peso : 0), 0)
      return { area, total, completado, pct: total ? Math.round((completado / total) * 100) : null }
    })
    .filter((a) => a.total > 0)

  const totalPeso = tareas.reduce((s, x) => s + x.peso, 0)
  const completadoPeso = tareas.reduce((s, x) => s + (x.completada ? x.peso : 0), 0)
  const pctTotal = totalPeso ? Math.round((completadoPeso / totalPeso) * 100) : 0
  const criticas = tareas.filter((x) => x.esCritica)
  const criticaDone = criticas.length > 0 && criticas.every((x) => x.completada)

  return {
    porArea,
    pctTotal,
    criticaDone,
    totalTareas: tareas.length,
    completadas: tareas.filter((x) => x.completada).length,
  }
}

export async function GET() {
  const planes = await prisma.planDia.findMany({
    include: { tareas: { orderBy: { creadoEn: "asc" } } },
    orderBy: { fecha: "desc" },
  })
  const result = planes.map((p) => ({ ...p, stats: calcStats(p.tareas) }))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const fecha = body.fecha ? new Date(body.fecha) : new Date()
    fecha.setHours(0, 0, 0, 0)

    const existe = await prisma.planDia.findUnique({ where: { fecha } })
    if (existe) return NextResponse.json({ error: "Ya existe un plan para esta fecha" }, { status: 409 })

    const plan = await prisma.planDia.create({ data: { fecha }, include: { tareas: true } })
    return NextResponse.json({ ...plan, stats: calcStats([]) }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
