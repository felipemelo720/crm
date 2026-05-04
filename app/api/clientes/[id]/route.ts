import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      leads: { orderBy: { creadoEn: "desc" } },
      propuestas: { orderBy: { creadoEn: "desc" } },
      proyectos: { orderBy: { creadoEn: "desc" } },
      tareas: { orderBy: { fechaLimite: "asc" } },
      pagos: { orderBy: { fechaEmision: "desc" } },
    },
  })
  if (!cliente) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const cliente = await prisma.cliente.update({ where: { id }, data: body })
    return NextResponse.json(cliente)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al actualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.cliente.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al eliminar cliente" }, { status: 500 })
  }
}
