import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado") || undefined
  const search = searchParams.get("q") || ""

  const proyectos = await prisma.proyecto.findMany({
    where: {
      AND: [
        estado ? { estado } : {},
        search ? { OR: [{ nombre: { contains: search } }, { cliente: { empresa: { contains: search } } }] } : {},
      ],
    },
    include: {
      cliente: { select: { id: true, empresa: true } },
      _count: { select: { tareas: true } },
    },
    orderBy: { creadoEn: "desc" },
  })
  return NextResponse.json(proyectos)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.nombre || !body.clienteId) {
      return NextResponse.json({ error: "Campos requeridos: nombre, clienteId" }, { status: 400 })
    }
    const proyecto = await prisma.proyecto.create({ data: body })
    return NextResponse.json(proyecto, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear proyecto" }, { status: 500 })
  }
}
