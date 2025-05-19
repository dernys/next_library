import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  console.log("Starting loans import...")

  try {
    // Connect to MySQL database
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
    })

    // Import historical loans
    console.log("Importing historical loans...")
    const [historyRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        bibid, copyid, status_cd, status_begin_dt, due_back_dt, 
        mbrid, renewal_count
      FROM 
        biblio_status_hist
      WHERE 
        status_cd = 'LOA'
      ORDER BY status_begin_dt DESC
    `)

    let importedHistorical = 0

    for (const loan of historyRows) {
      // Find the material
      const material = await prisma.material.findUnique({
        where: { externalId: `biblio_${loan.bibid}` },
      })

      if (!material) continue

      // Find the copy
      const copy = await prisma.copy.findUnique({
        where: { externalId: `copy_${loan.bibid}_${loan.copyid}` },
      })

      // Find the user
      const user = loan.mbrid
        ? await prisma.user.findUnique({
            where: { externalId: `member_${loan.mbrid}` },
          })
        : null

      // Create the loan
      await prisma.loan.upsert({
        where: { externalId: `loan_${loan.bibid}_${loan.copyid}_${new Date(loan.status_begin_dt).getTime()}` },
        update: {
          loanDate: new Date(loan.status_begin_dt),
          dueDate: loan.due_back_dt ? new Date(loan.due_back_dt) : new Date(loan.status_begin_dt),
          returnDate: new Date(), // Assuming historical loans are returned
          status: "returned",
          notes: `Imported from legacy system. Renewals: ${loan.renewal_count}`,
        },
        create: {
          externalId: `loan_${loan.bibid}_${loan.copyid}_${new Date(loan.status_begin_dt).getTime()}`,
          userId: user?.id,
          guestName: user ? null : "Legacy User",
          materialId: material.id,
          copyId: copy?.id,
          loanDate: new Date(loan.status_begin_dt),
          dueDate: loan.due_back_dt ? new Date(loan.due_back_dt) : new Date(loan.status_begin_dt),
          returnDate: new Date(), // Assuming historical loans are returned
          status: "returned",
          notes: `Imported from legacy system. Renewals: ${loan.renewal_count}`,
        },
      })

      importedHistorical++
    }

    console.log(`Imported ${importedHistorical} historical loans`)

    // Import active loans
    console.log("Importing active loans...")
    const [activeRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        bibid, copyid, status_begin_dt, due_back_dt, 
        mbrid, renewal_count
      FROM 
        biblio_copy
      WHERE 
        status_cd = 'LOA'
    `)

    let importedActive = 0

    for (const loan of activeRows) {
      // Find the material
      const material = await prisma.material.findUnique({
        where: { externalId: `biblio_${loan.bibid}` },
      })

      if (!material) continue

      // Find the copy
      const copy = await prisma.copy.findUnique({
        where: { externalId: `copy_${loan.bibid}_${loan.copyid}` },
      })

      // Find the user
      const user = loan.mbrid
        ? await prisma.user.findUnique({
            where: { externalId: `member_${loan.mbrid}` },
          })
        : null

      // Determine if loan is overdue
      const isOverdue = loan.due_back_dt && new Date() > new Date(loan.due_back_dt)

      // Create the loan
      await prisma.loan.upsert({
        where: { externalId: `active_loan_${loan.bibid}_${loan.copyid}` },
        update: {
          loanDate: new Date(loan.status_begin_dt),
          dueDate: loan.due_back_dt ? new Date(loan.due_back_dt) : new Date(loan.status_begin_dt),
          status: isOverdue ? "overdue" : "active",
          notes: `Imported from legacy system. Renewals: ${loan.renewal_count}`,
        },
        create: {
          externalId: `active_loan_${loan.bibid}_${loan.copyid}`,
          userId: user?.id,
          guestName: user ? null : "Legacy User",
          materialId: material.id,
          copyId: copy?.id,
          loanDate: new Date(loan.status_begin_dt),
          dueDate: loan.due_back_dt ? new Date(loan.due_back_dt) : new Date(loan.status_begin_dt),
          status: isOverdue ? "overdue" : "active",
          notes: `Imported from legacy system. Renewals: ${loan.renewal_count}`,
        },
      })

      importedActive++
    }

    console.log(`Imported ${importedActive} active loans`)

    // Close connections
    await db.end()
    await prisma.$disconnect()

    console.log("✅ Loans import completed successfully!")
  } catch (error) {
    console.error("❌ Error during import:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the import
main()
