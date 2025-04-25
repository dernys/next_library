import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const materialTypes = await prisma.materialType.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(materialTypes)
  } catch (error) {
    console.error("Error fetching material types:", error)
    return NextResponse.json({ error: "Error fetching material types" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description } = body

    const materialType = await prisma.materialType.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(materialType)
  } catch (error) {
    console.error("Error creating material type:", error)
    return NextResponse.json({ error: "Error creating material type" }, { status: 500 })
  }
}
