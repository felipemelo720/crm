import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") || ""
  const estado = searchParams.get("estado") || undefined

  const clientes = await prisma.cliente.findMany({
    where: {
      AND: [
        estado ? { estado } : {},
        search
          ? {
              OR: [
                { empresa: { contains: search } },
                { contactoNombre: { contains: search } },
                { email: { contains: search } },
                { rut: { contains: search } },
              ],
            }
          : {},
      ],
    },
    include: {
      _count: { select: { proyectos: true, leads: true, tareas: true } },
    },
    orderBy: { empresa: "asc" },
  })
  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.empresa || !body.contactoNombre) {
      return NextResponse.json({ error: "Campos requeridos: empresa, contactoNombre" }, { status: 400 })
    }
    const cliente = await prisma.cliente.create({ data: body })
    return NextResponse.json(cliente, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear cliente" }, { status: 500 })
  }
}
