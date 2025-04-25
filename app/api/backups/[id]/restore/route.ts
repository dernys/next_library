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

// Actualizar la función POST para usar async/await con params
export async function POST(
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

    // Obtener la URL de la base de datos desde las variables de entorno
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("Database URL not found in environment variables")
    }

    // Crear un backup temporal antes de restaurar
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const tempBackupPath = path.join(process.cwd(), "backups", `pre-restore-${timestamp}.sql`)

    // Crear backup temporal
    const { stderr: backupError } = await execAsync(
      `pg_dump "${databaseUrl}" > "${tempBackupPath}"`
    )

    if (backupError) {
      console.error("Error creating temporary backup:", backupError)
      throw new Error("Failed to create temporary backup")
    }

    try {
      // Restaurar el backup
      const { stderr: restoreError } = await execAsync(
        `psql "${databaseUrl}" < "${backup.path}"`
      )

      if (restoreError) {
        console.error("Error restoring backup:", restoreError)
        throw new Error("Failed to restore backup")
      }

      // Eliminar el backup temporal si la restauración fue exitosa
      fs.unlinkSync(tempBackupPath)

      return NextResponse.json({ success: true })
    } catch (error) {
      // Si hay un error durante la restauración, intentar restaurar el backup temporal
      console.error("Error during restoration, attempting to restore temporary backup:", error)

      try {
        const { stderr: rollbackError } = await execAsync(
          `psql "${databaseUrl}" < "${tempBackupPath}"`
        )

        if (rollbackError) {
          console.error("Error rolling back to temporary backup:", rollbackError)
          throw new Error("Failed to rollback to temporary backup")
        }

        // Eliminar el backup temporal después de la restauración
        fs.unlinkSync(tempBackupPath)

        throw new Error("Failed to restore backup, but successfully rolled back to previous state")
      } catch (rollbackError) {
        console.error("Critical error during rollback:", rollbackError)
        throw new Error("Critical error: Failed to restore backup and failed to rollback")
      }
    }
  } catch (error) {
    console.error("Error restoring backup:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error restoring backup" },
      { status: 500 }
    )
  }
}
