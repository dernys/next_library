import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)
const prisma = new PrismaClient()

// Directorio para almacenar backups
const BACKUP_DIR = path.join(process.cwd(), "backups")

// Asegurar que el directorio de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const backups = await prisma.backup.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(backups)
  } catch (error) {
    console.error("Error fetching backups:", error)
    return NextResponse.json(
      { error: "Error fetching backups" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { description } = await request.json()
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `backup-${timestamp}.sql`
    const backupPath = path.join(BACKUP_DIR, filename)

    // Verificar permisos del directorio
    try {
      await fs.promises.access(BACKUP_DIR, fs.constants.W_OK)
    } catch (error) {
      console.error("Directory permission error:", error)
      throw new Error("No write permission for backup directory")
    }

    // Obtener la URL de la base de datos desde las variables de entorno
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("Database URL not found in environment variables")
    }

    // Verificar si pg_dump está disponible
    try {
      await execAsync("pg_dump --version")
    } catch (error) {
      console.error("pg_dump not found:", error)
      throw new Error("pg_dump command not found. Please ensure PostgreSQL tools are installed")
    }

    // Escapar caracteres especiales en la URL de la base de datos
    const escapedDatabaseUrl = databaseUrl.replace(/"/g, '\\"')

    // Crear el respaldo usando pg_dump con mejor manejo de errores
    const { stdout, stderr } = await execAsync(
      `pg_dump "${escapedDatabaseUrl}" > "${backupPath}"`
    )

    if (stderr) {
      console.error("Error creating backup:", stderr)
      throw new Error(`Failed to create database backup: ${stderr}`)
    }

    // Verificar si el archivo se creó correctamente
    if (!fs.existsSync(backupPath)) {
      throw new Error("Backup file was not created")
    }

    // Obtener el tamaño del archivo
    const stats = fs.statSync(backupPath)
    const fileSize = stats.size

    if (fileSize === 0) {
      fs.unlinkSync(backupPath) // Eliminar archivo vacío
      throw new Error("Backup file is empty")
    }

    // Guardar el registro del respaldo en la base de datos
    const backup = await prisma.backup.create({
      data: {
        filename,
        description: description || null,
        size: fileSize,
        path: backupPath,
        createdBy: session.user?.email || null,
      },
    })

    return NextResponse.json(backup)
  } catch (error) {
    console.error("Error creating backup:", error)
    // Limpiar archivo de backup si existe y hubo error
    if (error instanceof Error && error.message.includes("Failed to create database backup")) {
      const backupPath = path.join(BACKUP_DIR, `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`)
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating backup" },
      { status: 500 }
    )
  }
}
