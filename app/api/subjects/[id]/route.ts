import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
    })

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error fetching subject:", error)
    return NextResponse.json(
      { error: "Error fetching subject" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una materia con el mismo nombre (excluyendo la actual)
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: {
          not: params.id,
        },
      },
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: "A subject with this name already exists" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json(
      { error: "Error updating subject" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verificar si la materia está siendo utilizada
    const materialCount = await prisma.materialToSubject.count({
      where: { subjectId: params.id },
    })

    if (materialCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete subject that is being used by materials" },
        { status: 400 }
      )
    }

    await prisma.subject.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json(
      { error: "Error deleting subject" },
      { status: 500 }
    )
  }
}
