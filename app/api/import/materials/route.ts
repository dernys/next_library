import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { parse } from "papaparse"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  // Solo los bibliotecarios pueden importar materiales
  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Verificar el tipo de archivo
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 })
    }

    // Leer el archivo
    const fileContent = await file.text()

    // Parsear el CSV
    const { data, errors } = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    })

    if (errors.length > 0) {
      return NextResponse.json({ error: "Error parsing CSV file", details: errors }, { status: 400 })
    }

    // Validar que el CSV tenga los campos requeridos
    const requiredFields = ["title", "author", "categoryId"]
    const missingFields = requiredFields.filter((field) => !Object.keys(data[0]).includes(field))

    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Missing required fields in CSV file", missingFields }, { status: 400 })
    }

    // Importar los materiales
    const importedMaterials = []
    const errors2 = []

    for (const row of data as any[]) {
      try {
        // Verificar si la categoría existe
        const category = await prisma.category.findUnique({
          where: { id: row.categoryId },
        })

        if (!category) {
          errors2.push({ row, error: `Category with ID ${row.categoryId} not found` })
          continue
        }

        // Crear el material
        const material = await prisma.material.create({
          data: {
            title: row.title,
            subtitle: row.subtitle || null,
            author: row.author,
            isbn: row.isbn || null,
            description: row.description || null,
            quantity: Number.parseInt(row.quantity || "1"),
            editionInfo: row.editionInfo || null,
            isOpac: row.isOpac === "true",
            categoryId: row.categoryId,
            materialTypeId: row.materialTypeId || null,
            collectionId: row.collectionId || null,
            language: row.language || null,
            publisher: row.publisher || null,
            country: row.country || null,
            publicationPlace: row.publicationPlace || null,
            price: row.price ? Number.parseFloat(row.price) : null,
            dimensions: row.dimensions || null,
            pages: row.pages ? Number.parseInt(row.pages) : null,
            registrationNumber: row.registrationNumber || null,
            opac: row.opac || null,
            entry1: row.entry1 || null,
            entry2: row.entry2 || null,
            entry3: row.entry3 || null,
            coverImage: row.coverImage || null,
          },
        })

        // Crear copias si se especifican
        if (row.copies) {
          try {
            const copies = JSON.parse(row.copies)
            if (Array.isArray(copies)) {
              for (const copy of copies) {
                await prisma.copy.create({
                  data: {
                    registrationNumber: copy.registrationNumber,
                    notes: copy.notes || null,
                    materialId: material.id,
                    status: "available",
                  },
                })
              }
            }
          } catch (error) {
            console.error("Error parsing copies:", error)
          }
        }

        // Asociar materias si se especifican
        if (row.subjects) {
          try {
            const subjects = JSON.parse(row.subjects)
            if (Array.isArray(subjects)) {
              for (const subjectId of subjects) {
                // Verificar si la materia existe
                const subject = await prisma.subject.findUnique({
                  where: { id: subjectId },
                })

                if (subject) {
                  await prisma.materialToSubject.create({
                    data: {
                      materialId: material.id,
                      subjectId,
                    },
                  })
                }
              }
            }
          } catch (error) {
            console.error("Error parsing subjects:", error)
          }
        }

        importedMaterials.push(material)
      } catch (error) {
        console.error("Error importing material:", error)
        errors2.push({ row, error: (error as Error).message })
      }
    }

    return NextResponse.json({
      success: true,
      count: importedMaterials.length,
      errors: errors2,
    })
  } catch (error) {
    console.error("Error importing materials:", error)
    return NextResponse.json({ error: "Error importing materials" }, { status: 500 })
  }
}
