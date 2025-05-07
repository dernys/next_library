import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Actualizar todas las funciones para usar async/await con params
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const category = await prisma.category.findUnique({
      where: {
        id: id,
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json({ error: "Error fetching category" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description } = body

    const category = await prisma.category.update({
      where: {
        id: id,
      },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Error updating category" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if category has materials
    const materialsCount = await prisma.material.count({
      where: {
        categoryId: id,
      },
    })

    if (materialsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with materials. Remove materials first." },
        { status: 400 },
      )
    }

    await prisma.category.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 })
  }
}
