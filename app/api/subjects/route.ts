import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Error fetching subjects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Verificar si ya existe una materia con el mismo nombre
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    })

    if (existingSubject) {
      return NextResponse.json({ error: "A subject with this name already exists" }, { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Error creating subject" }, { status: 500 })
  }
}
