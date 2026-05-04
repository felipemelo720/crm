import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const propuesta = await prisma.propuesta.findUnique({
    where: { id },
    include: { cliente: true, lead: true, proyectos: true },
  })
  if (!propuesta) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(propuesta)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const propuesta = await prisma.propuesta.update({ where: { id }, data: body })
    return NextResponse.json(propuesta)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al actualizar propuesta" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.propuesta.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al eliminar propuesta" }, { status: 500 })
  }
}
