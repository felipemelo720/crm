import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pago = await prisma.pago.findUnique({
    where: { id },
    include: { cliente: true, proyecto: true },
  })
  if (!pago) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(pago)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const pago = await prisma.pago.update({ where: { id }, data: body })
    return NextResponse.json(pago)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al actualizar pago" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.pago.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al eliminar pago" }, { status: 500 })
  }
}
