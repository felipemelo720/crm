import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const nota = await prisma.nota.findUnique({ where: { id } })
  if (!nota) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(nota)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const nota = await prisma.nota.update({ where: { id }, data: body })
    return NextResponse.json(nota)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al actualizar nota" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.nota.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al eliminar nota" }, { status: 500 })
  }
}
