import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket, type Connection } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  console.log("Verificando préstamos activos (CRT)...")
  let db: Connection | null = null

  try {
    // Conectar a la base de datos MySQL
    db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
    })

    // Contar préstamos con estado CRT en la base de datos original
    const [crtLoansCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count 
      FROM biblio_copy 
      WHERE status_cd = 'CRT'
    `)

    const originalCrtCount = crtLoansCount[0].count
    console.log(`Préstamos con estado CRT en la base de datos original: ${originalCrtCount}`)

    // Contar préstamos activos en la base de datos de Prisma
    const activeLoansCount = await prisma.loan.count({
      where: { status: "active" },
    })
    console.log(`Préstamos activos en la base de datos de Prisma: ${activeLoansCount}`)

    // Contar préstamos vencidos en la base de datos de Prisma
    const overdueLoansCount = await prisma.loan.count({
      where: { status: "overdue" },
    })
    console.log(`Préstamos vencidos en la base de datos de Prisma: ${overdueLoansCount}`)

    // Total de préstamos activos + vencidos (ambos deberían corresponder a CRT)
    const totalActiveAndOverdue = activeLoansCount + overdueLoansCount
    console.log(`Total de préstamos activos + vencidos en Prisma: ${totalActiveAndOverdue}`)

    // Verificar si los números coinciden
    if (totalActiveAndOverdue >= originalCrtCount) {
      console.log("✅ La importación de préstamos activos (CRT) es correcta.")
    } else {
      console.log(`❌ Hay una discrepancia en la importación de préstamos activos (CRT).`)
      console.log(`   Faltan ${originalCrtCount - totalActiveAndOverdue} préstamos activos.`)

      // Listar algunos préstamos CRT de la base de datos original para verificación
      const [sampleCrtLoans] = await db.query<RowDataPacket[]>(`
        SELECT bibid, copyid, status_cd, status_begin_dt, due_back_dt, mbrid
        FROM biblio_copy
        WHERE status_cd = 'CRT'
        LIMIT 10
      `)

      console.log("\nMuestra de préstamos CRT en la base de datos original:")
      sampleCrtLoans.forEach((loan, index) => {
        console.log(
          `${index + 1}. Biblio ID: ${loan.bibid}, Copy ID: ${loan.copyid}, Status: ${loan.status_cd}, Due Date: ${loan.due_back_dt}`,
        )
      })

      // Verificar si estos préstamos existen en Prisma
      console.log("\nVerificando si estos préstamos existen en Prisma:")
      for (const loan of sampleCrtLoans) {
        const externalId = `current_loan_${loan.bibid}_${loan.copyid}`
        const prismaLoan = await prisma.loan.findUnique({
          where: { externalId },
          select: { id: true, status: true, dueDate: true },
        })

        if (prismaLoan) {
          console.log(`✅ Préstamo ${externalId} encontrado en Prisma con estado: ${prismaLoan.status}`)
        } else {
          console.log(`❌ Préstamo ${externalId} NO encontrado en Prisma`)
        }
      }
    }
  } catch (error) {
    console.error("Error durante la verificación:", error)
  } finally {
    if (db) await db.end()
    await prisma.$disconnect()
  }
}

main()
