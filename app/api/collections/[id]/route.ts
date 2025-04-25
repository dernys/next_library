import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Actualizar todas las funciones para usar async/await con params
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const collection = await prisma.collection.findUnique({
      where: {
        id: id,
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json({ error: "Error fetching collection" }, { status: 500 })
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

    const collection = await prisma.collection.update({
      where: {
        id: id,
      },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error("Error updating collection:", error)
    return NextResponse.json({ error: "Error updating collection" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if collection has materials
    const materialsCount = await prisma.material.count({
      where: {
        collectionId: id,
      },
    })

    if (materialsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete collection with materials. Remove materials first." },
        { status: 400 },
      )
    }

    await prisma.collection.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting collection:", error)
    return NextResponse.json({ error: "Error deleting collection" }, { status: 500 })
  }
}
