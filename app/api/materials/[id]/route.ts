import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const material = await prisma.material.findUnique({
      where: { id },
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
    })

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error fetching material:", error)
    return NextResponse.json({ error: "Error fetching material" }, { status: 500 })
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

    // Actualizar el material
    const material = await prisma.material.update({
      where: { id },
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

    // Actualizar las copias
    // Primero, obtener las copias existentes
    const existingCopies = await prisma.copy.findMany({
      where: { materialId: id },
    })

    // Crear un mapa de las copias existentes por número de registro
    const existingCopiesMap = new Map(existingCopies.map((copy) => [copy.registrationNumber, copy]))

    // Crear un conjunto de números de registro de las copias nuevas
    const newRegistrationNumbers = new Set(
      copies?.map((copy: { registrationNumber: string }) => copy.registrationNumber) || [],
    )

    // Eliminar las copias que ya no existen
    for (const existingCopy of existingCopies) {
      if (!newRegistrationNumbers.has(existingCopy.registrationNumber)) {
        await prisma.copy.delete({
          where: { id: existingCopy.id },
        })
      }
    }

    // Crear o actualizar las copias
    if (copies && Array.isArray(copies)) {
      for (const copy of copies) {
        const existingCopy = existingCopiesMap.get(copy.registrationNumber)

        if (existingCopy) {
          // Actualizar la copia existente
          await prisma.copy.update({
            where: { id: existingCopy.id },
            data: {
              notes: copy.notes,
            },
          })
        } else {
          // Crear una nueva copia
          await prisma.copy.create({
            data: {
              registrationNumber: copy.registrationNumber,
              notes: copy.notes,
              materialId: id,
              status: "available",
            },
          })
        }
      }
    }

    // Actualizar las materias
    // Primero, eliminar todas las relaciones existentes
    await prisma.materialToSubject.deleteMany({
      where: { materialId: id },
    })

    // Luego, crear las nuevas relaciones
    if (subjects && Array.isArray(subjects)) {
      await Promise.all(
        subjects.map(async (subjectId: string) => {
          await prisma.materialToSubject.create({
            data: {
              materialId: id,
              subjectId,
            },
          })
        }),
      )
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error updating material:", error)
    return NextResponse.json({ error: "Error updating material" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Eliminar el material (las relaciones se eliminarán automáticamente por las restricciones de clave foránea)
    await prisma.material.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json({ error: "Error deleting material" }, { status: 500 })
  }
}
