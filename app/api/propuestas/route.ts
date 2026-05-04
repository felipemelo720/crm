import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado") || undefined
  const search = searchParams.get("q") || ""

  const propuestas = await prisma.propuesta.findMany({
    where: {
      AND: [
        estado ? { estado } : {},
        search ? { OR: [{ titulo: { contains: search } }, { cliente: { empresa: { contains: search } } }] } : {},
      ],
    },
    include: { cliente: { select: { id: true, empresa: true } }, lead: { select: { id: true, nombre: true } } },
    orderBy: { creadoEn: "desc" },
  })
  return NextResponse.json(propuestas)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.titulo || !body.clienteId || body.monto == null) {
      return NextResponse.json({ error: "Campos requeridos: titulo, clienteId, monto" }, { status: 400 })
    }
    const propuesta = await prisma.propuesta.create({ data: body })
    return NextResponse.json(propuesta, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear propuesta" }, { status: 500 })
  }
}
