import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Actualizar todas las funciones para usar async/await con params
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const materialType = await prisma.materialType.findUnique({
      where: {
        id: id,
      },
    })

    if (!materialType) {
      return NextResponse.json({ error: "Material type not found" }, { status: 404 })
    }

    return NextResponse.json(materialType)
  } catch (error) {
    console.error("Error fetching material type:", error)
    return NextResponse.json({ error: "Error fetching material type" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description } = body

    const materialType = await prisma.materialType.update({
      where: {
        id: id,
      },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(materialType)
  } catch (error) {
    console.error("Error updating material type:", error)
    return NextResponse.json({ error: "Error updating material type" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if material type has materials
    const materialsCount = await prisma.material.count({
      where: {
        materialTypeId: id,
      },
    })

    if (materialsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete material type with materials. Remove materials first." },
        { status: 400 },
      )
    }

    await prisma.materialType.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material type:", error)
    return NextResponse.json({ error: "Error deleting material type" }, { status: 500 })
  }
}
