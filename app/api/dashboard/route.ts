import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    leadsNuevos,
    propuestasActivas,
    proyectosActivos,
    tareasAtrasadas,
    pagosPendientes,
    ingresosDelMes,
    proximosSeguimientos,
  ] = await Promise.all([
    prisma.lead.count({ where: { estado: "NUEVO" } }),
    prisma.propuesta.count({ where: { estado: { in: ["ENVIADA", "NEGOCIACION"] } } }),
    prisma.proyecto.count({ where: { estado: { in: ["PLANIFICADO", "DESARROLLO", "REVISION", "CORRECCIONES"] } } }),
    prisma.tarea.count({
      where: { estado: { notIn: ["COMPLETADA", "CANCELADA"] }, fechaLimite: { lt: now } },
    }),
    prisma.pago.aggregate({
      where: { estado: { in: ["PENDIENTE", "VENCIDO"] }, tipo: "INGRESO" },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.pago.aggregate({
      where: { tipo: "INGRESO", estado: "PAGADO", fechaPago: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { monto: true },
    }),
    prisma.lead.findMany({
      where: {
        estado: { notIn: ["GANADO", "PERDIDO"] },
        proximoSeguimiento: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, nombre: true, empresa: true, proximoSeguimiento: true, estado: true },
      orderBy: { proximoSeguimiento: "asc" },
      take: 5,
    }),
  ])

  return NextResponse.json({
    leadsNuevos,
    propuestasActivas,
    proyectosActivos,
    tareasAtrasadas,
    pagosPendientes: {
      total: pagosPendientes._sum.monto ?? 0,
      count: pagosPendientes._count,
    },
    ingresosDelMes: ingresosDelMes._sum.monto ?? 0,
    proximosSeguimientos,
  })
}
