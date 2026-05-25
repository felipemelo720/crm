import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function calcStats(tareas: { peso: number; completada: boolean; area: string; esCritica: boolean }[]) {
  const areas = ["CARRERA", "CRECIMIENTO", "NEGOCIO", "SALUD", "OTRO"] as const
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

  return { porArea, pctTotal, criticaDone, totalTareas: tareas.length, completadas: tareas.filter((x) => x.completada).length }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plan = await prisma.planDia.findUnique({
    where: { id },
    include: { tareas: { orderBy: { creadoEn: "asc" } } },
  })
  if (!plan) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ...plan, stats: calcStats(plan.tareas) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.planDia.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
