import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit

  try {
    const where = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } },
      ],
      ...(category ? { categoryId: category } : {}),
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          category: true,
          materialType: true,
          collection: true,
          copies: true,
          subjects: {
            include: {
              subject: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          title: "asc",
        },
      }),
      prisma.material.count({ where }),
    ])

    return NextResponse.json({
      materials,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json({ error: "Error fetching materials" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      subtitle,
      author,
      isbn,
      description,
      quantity,
      editionInfo,
      isOpac,
      categoryId,
      materialTypeId,
      collectionId,
      language,
      publisher,
      country,
      publicationPlace,
      price,
      dimensions,
      pages,
      registrationNumber,
      opac,
      entry1,
      entry2,
      entry3,
      coverImage,
      copies,
      subjects,
    } = body

    // Crear el material
    const material = await prisma.material.create({
      data: {
        title,
        subtitle,
        author,
        isbn,
        description,
        quantity,
        editionInfo,
        isOpac: isOpac || false,
        categoryId,
        materialTypeId: materialTypeId || null,
        collectionId: collectionId || null,
        language,
        publisher,
        country,
        publicationPlace,
        price,
        dimensions,
        pages,
        registrationNumber,
        opac,
        entry1,
        entry2,
        entry3,
        coverImage,
      },
    })

    // Crear las copias
    if (copies && Array.isArray(copies) && copies.length > 0) {
      await Promise.all(
        copies.map(async (copy: { registrationNumber: string; notes: string }) => {
          await prisma.copy.create({
            data: {
              registrationNumber: copy.registrationNumber,
              notes: copy.notes,
              materialId: material.id,
              status: "available",
            },
          })
        }),
      )
    }

    // Asociar materias
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      await Promise.all(
        subjects.map(async (subjectId: string) => {
          await prisma.materialToSubject.create({
            data: {
              materialId: material.id,
              subjectId,
            },
          })
        }),
      )
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error creating material:", error)
    return NextResponse.json({ error: "Error creating material" }, { status: 500 })
  }
}
