import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/prisma"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET: Obtener información de la biblioteca
export async function GET() {
  try {
    // Buscar la información de la biblioteca (asumimos que solo hay un registro)
    const libraryInfo = await prisma.libraryInfo.findFirst()

    return NextResponse.json(libraryInfo || {})
  } catch (error) {
    console.error("Error fetching library info:", error)
    return NextResponse.json({ error: "Error fetching library info" }, { status: 500 })
  }
}

// POST: Crear o actualizar información de la biblioteca
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar si el usuario está autenticado y tiene permisos
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validar datos
    if (!data.name) {
      return NextResponse.json({ error: "Library name is required" }, { status: 400 })
    }

    // Buscar si ya existe información de la biblioteca
    const existingInfo = await prisma.libraryInfo.findFirst()

    let libraryInfo

    if (existingInfo) {
      // Actualizar información existente
      libraryInfo = await prisma.libraryInfo.update({
        where: { id: existingInfo.id },
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          openingHours: data.openingHours,
        },
      })
    } else {
      // Crear nueva información
      libraryInfo = await prisma.libraryInfo.create({
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          openingHours: data.openingHours,
        },
      })
    }

    return NextResponse.json(libraryInfo)
  } catch (error) {
    console.error("Error saving library info:", error)
    return NextResponse.json({ error: "Error saving library info" }, { status: 500 })
  }
}
