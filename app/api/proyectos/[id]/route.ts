import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: { cliente: true, propuesta: true, tareas: true, pagos: true },
  })
  if (!proyecto) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(proyecto)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const proyecto = await prisma.proyecto.update({ where: { id }, data: body })
    return NextResponse.json(proyecto)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al actualizar proyecto" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.proyecto.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al eliminar proyecto" }, { status: 500 })
  }
}
