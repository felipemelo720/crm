import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") || ""
  const estado = searchParams.get("estado") || undefined

  const leads = await prisma.lead.findMany({
    where: {
      AND: [
        estado ? { estado } : {},
        search
          ? {
              OR: [
                { nombre: { contains: search } },
                { empresa: { contains: search } },
              ],
            }
          : {},
      ],
    },
    include: { cliente: { select: { id: true, empresa: true } } },
    orderBy: { creadoEn: "desc" },
  })
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.nombre || !body.empresa || !body.clienteId) {
      return NextResponse.json({ error: "Campos requeridos: nombre, empresa, clienteId" }, { status: 400 })
    }
    const lead = await prisma.lead.create({ data: body })
    return NextResponse.json(lead, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear lead" }, { status: 500 })
  }
}
