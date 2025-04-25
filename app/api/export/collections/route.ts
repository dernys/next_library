import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stringify } from "csv-stringify/sync"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  // Solo los bibliotecarios pueden exportar colecciones
  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Obtener todas las colecciones
    const collections = await prisma.collection.findMany()

    // Transformar los datos para el CSV
    const csvData = collections.map((collection) => ({
      name: collection.name,
      description: collection.description || "",
    }))

    // Generar el CSV
    const csv = stringify(csvData, { header: true })

    // Crear una respuesta con el CSV
    const response = new NextResponse(csv)

    // Establecer los headers para la descarga
    response.headers.set("Content-Type", "text/csv")
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=collections-export-${new Date().toISOString().slice(0, 10)}.csv`,
    )

    return response
  } catch (error) {
    console.error("Error exporting collections:", error)
    return NextResponse.json({ error: "Error exporting collections" }, { status: 500 })
  }
}
