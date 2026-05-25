import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.planDiaId || !body.titulo) {
      return NextResponse.json({ error: "Campos requeridos: planDiaId, titulo" }, { status: 400 })
    }
    const tarea = await prisma.tareaProductividad.create({
      data: {
        planDiaId: body.planDiaId,
        titulo: body.titulo,
        area: body.area ?? "OTRO",
        peso: body.peso ?? 1,
        completada: body.completada ?? false,
        esCritica: body.esCritica ?? false,
      },
    })
    return NextResponse.json(tarea, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
