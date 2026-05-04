import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tarea = await prisma.tarea.findUnique({
    where: { id },
    include: { cliente: true, proyecto: true },
  })
  if (!tarea) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(tarea)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const tarea = await prisma.tarea.update({ where: { id }, data: body })
    return NextResponse.json(tarea)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al actualizar tarea" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.tarea.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al eliminar tarea" }, { status: 500 })
  }
}
