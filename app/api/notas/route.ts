import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") || ""

  const notas = await prisma.nota.findMany({
    where: search ? { OR: [{ titulo: { contains: search } }, { contenido: { contains: search } }] } : undefined,
    orderBy: { editadoEn: "desc" },
  })
  return NextResponse.json(notas)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nota = await prisma.nota.create({ data: body })
    return NextResponse.json(nota, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear nota" }, { status: 500 })
  }
}
