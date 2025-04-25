import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stringify } from "csv-stringify/sync"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  // Solo los bibliotecarios pueden exportar tipos de materiales
  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Obtener todos los tipos de materiales
    const materialTypes = await prisma.materialType.findMany()

    // Transformar los datos para el CSV
    const csvData = materialTypes.map((type) => ({
      name: type.name,
      description: type.description || "",
    }))

    // Generar el CSV
    const csv = stringify(csvData, { header: true })

    // Crear una respuesta con el CSV
    const response = new NextResponse(csv)

    // Establecer los headers para la descarga
    response.headers.set("Content-Type", "text/csv")
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=material-types-export-${new Date().toISOString().slice(0, 10)}.csv`,
    )

    return response
  } catch (error) {
    console.error("Error exporting material types:", error)
    return NextResponse.json({ error: "Error exporting material types" }, { status: 500 })
  }
}
