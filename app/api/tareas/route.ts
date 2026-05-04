import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado") || undefined
  const prioridad = searchParams.get("prioridad") || undefined
  const tipo = searchParams.get("tipo") || undefined
  const proyectoId = searchParams.get("proyectoId") || undefined
  const search = searchParams.get("q") || ""

  const tareas = await prisma.tarea.findMany({
    where: {
      AND: [
        estado ? { estado } : {},
        prioridad ? { prioridad } : {},
        tipo ? { tipo } : {},
        proyectoId ? { proyectoId } : {},
        search ? { titulo: { contains: search } } : {},
      ],
    },
    include: {
      cliente: { select: { id: true, empresa: true } },
      proyecto: { select: { id: true, nombre: true } },
    },
    orderBy: [{ prioridad: "desc" }, { fechaLimite: "asc" }],
  })
  return NextResponse.json(tareas)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.titulo || !body.clienteId) {
      return NextResponse.json({ error: "Campos requeridos: titulo, clienteId" }, { status: 400 })
    }
    const tarea = await prisma.tarea.create({ data: body })
    return NextResponse.json(tarea, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear tarea" }, { status: 500 })
  }
}
