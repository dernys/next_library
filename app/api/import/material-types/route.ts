import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { parse } from "csv-parse/sync"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  // Solo los bibliotecarios pueden importar tipos de materiales
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
    const fileBuffer = await file.arrayBuffer()
    const fileContent = new TextDecoder().decode(fileBuffer)

    // Parsear el CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    // Validar que haya registros
    if (!records.length) {
      return NextResponse.json({ error: "No records found in the file" }, { status: 400 })
    }

    // Importar los tipos de materiales
    let importedCount = 0
    const existingTypes = await prisma.materialType.findMany()
    const existingNames = new Set(existingTypes.map((t) => t.name.toLowerCase()))

    for (const record of records) {
      try {
        if (!record.name) continue // Saltar registros sin nombre

        // Verificar si el tipo ya existe
        if (existingNames.has(record.name.toLowerCase())) {
          // Actualizar tipo existente
          await prisma.materialType.updateMany({
            where: { name: { equals: record.name, mode: "insensitive" } },
            data: { description: record.description || null },
          })
        } else {
          // Crear nuevo tipo
          await prisma.materialType.create({
            data: {
              name: record.name,
              description: record.description || null,
            },
          })
          existingNames.add(record.name.toLowerCase())
        }

        importedCount++
      } catch (error) {
        console.error("Error importing material type:", error, record)
        // Continuar con el siguiente registro
      }
    }

    return NextResponse.json({ success: true, count: importedCount })
  } catch (error) {
    console.error("Error importing material types:", error)
    return NextResponse.json({ error: "Error importing material types" }, { status: 500 })
  }
}
