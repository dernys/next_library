import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// Actualizar la función GET para usar async/await con params
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verificar si el backup existe
    const backup = await prisma.backup.findUnique({
      where: { id: params.id },
    })

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      )
    }

    // Verificar si el archivo de backup existe
    if (!fs.existsSync(backup.path)) {
      return NextResponse.json(
        { error: "Backup file not found" },
        { status: 404 }
      )
    }

    // Leer el archivo de backup
    const fileBuffer = fs.readFileSync(backup.path)

    // Crear la respuesta con el archivo
    const response = new NextResponse(fileBuffer)
    
    // Establecer los headers apropiados
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${path.basename(backup.path)}"`
    )
    response.headers.set("Content-Type", "application/octet-stream")
    response.headers.set("Content-Length", fileBuffer.length.toString())

    return response
  } catch (error) {
    console.error("Error downloading backup:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error downloading backup" },
      { status: 500 }
    )
  }
}
