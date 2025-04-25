import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stringify } from "papaparse"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  // Solo los bibliotecarios pueden exportar materiales
  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Obtener todos los materiales con sus relaciones
    const materials = await prisma.material.findMany({
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

    // Transformar los datos para el CSV
    const csvData = materials.map((material) => {
      // Convertir las copias a formato JSON para el CSV
      const copies = material.copies.map((copy) => ({
        registrationNumber: copy.registrationNumber,
        notes: copy.notes,
      }))

      // Convertir las materias a formato JSON para el CSV
      const subjects = material.subjects.map((ms) => ms.subject.id)

      return {
        id: material.id,
        title: material.title,
        subtitle: material.subtitle,
        author: material.author,
        isbn: material.isbn,
        description: material.description,
        quantity: material.quantity,
        editionInfo: material.editionInfo,
        isOpac: material.isOpac,
        categoryId: material.categoryId,
        categoryName: material.category.name,
        materialTypeId: material.materialTypeId,
        materialTypeName: material.materialType?.name,
        collectionId: material.collectionId,
        collectionName: material.collection?.name,
        language: material.language,
        publisher: material.publisher,
        country: material.country,
        publicationPlace: material.publicationPlace,
        price: material.price,
        dimensions: material.dimensions,
        pages: material.pages,
        registrationNumber: material.registrationNumber,
        opac: material.opac,
        entry1: material.entry1,
        entry2: material.entry2,
        entry3: material.entry3,
        coverImage: material.coverImage,
        copies: JSON.stringify(copies),
        subjects: JSON.stringify(subjects),
        createdAt: material.createdAt.toISOString(),
        updatedAt: material.updatedAt.toISOString(),
      }
    })

    // Convertir a CSV
    const csv = stringify(csvData, {
      header: true,
    })

    // Crear la respuesta con el CSV
    const response = new NextResponse(csv)
    response.headers.set("Content-Type", "text/csv")
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="materials-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    )

    return response
  } catch (error) {
    console.error("Error exporting materials:", error)
    return NextResponse.json({ error: "Error exporting materials" }, { status: 500 })
  }
}
