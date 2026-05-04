import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado") || undefined
  const tipo = searchParams.get("tipo") || undefined
  const search = searchParams.get("q") || ""

  const pagos = await prisma.pago.findMany({
    where: {
      AND: [
        estado ? { estado } : {},
        tipo ? { tipo } : {},
        search
          ? {
              OR: [
                { descripcion: { contains: search } },
                { cliente: { empresa: { contains: search } } },
              ],
            }
          : {},
      ],
    },
    include: {
      cliente: { select: { id: true, empresa: true } },
      proyecto: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaEmision: "desc" },
  })
  return NextResponse.json(pagos)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.descripcion || body.monto == null || !body.tipo || !body.clienteId) {
      return NextResponse.json({ error: "Campos requeridos: descripcion, monto, tipo, clienteId" }, { status: 400 })
    }
    const pago = await prisma.pago.create({ data: body })
    return NextResponse.json(pago, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear pago" }, { status: 500 })
  }
}
