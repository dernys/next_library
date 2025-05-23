import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket, type Connection } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  console.log("Verifying imports...")
  let db: Connection | null = null

  try {
    // Connect to MySQL database
    db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
    })

    // Verify users
    const [staffCount] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM staff`)
    const [memberCount] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM member`)
    const totalSourceUsers = staffCount[0].count + memberCount[0].count
    const targetUsers = await prisma.user.count()

    console.log(`Users: ${targetUsers}/${totalSourceUsers} (${Math.round((targetUsers / totalSourceUsers) * 100)}%)`)

    // Verify materials
    const [materialCount] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM biblio`)
    const targetMaterials = await prisma.material.count()

    console.log(
      `Materials: ${targetMaterials}/${materialCount[0].count} (${Math.round((targetMaterials / materialCount[0].count) * 100)}%)`,
    )

    // Verify copies
    const [copyCount] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM biblio_copy`)
    const targetCopies = await prisma.copy.count()

    console.log(
      `Copies: ${targetCopies}/${copyCount[0].count} (${Math.round((targetCopies / copyCount[0].count) * 100)}%)`,
    )

    // Verify loans
    // Count all loans in biblio_status_hist with status CRT or OUT
    const [histLoanCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_status_hist WHERE status_cd IN ('CRT', 'OUT')
    `)

    // Count all current loans in biblio_copy with status CRT or OUT
    const [activeLoanCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_copy WHERE status_cd IN ('CRT', 'OUT')
    `)

    const totalSourceLoans = histLoanCount[0].count + activeLoanCount[0].count
    const targetLoans = await prisma.loan.count()

    console.log(`Loans: ${targetLoans}/${totalSourceLoans} (${Math.round((targetLoans / totalSourceLoans) * 100)}%)`)

    // Verify active loans
    const [currentActiveCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_copy WHERE status_cd = 'CRT'
    `)

    const targetActiveLoans = await prisma.loan.count({
      where: { status: { in: ["active", "overdue"] } },
    })

    console.log(
      `Active Loans: ${targetActiveLoans}/${currentActiveCount[0].count} (${Math.round((targetActiveLoans / currentActiveCount[0].count) * 100)}%)`,
    )

    // Verify returned loans
    const [returnedCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_status_hist WHERE status_cd = 'OUT'
    `)

    const targetReturnedLoans = await prisma.loan.count({
      where: { status: "returned" },
    })

    console.log(
      `Returned Loans: ${targetReturnedLoans}/${returnedCount[0].count} (${Math.round((targetReturnedLoans / returnedCount[0].count) * 100)}%)`,
    )

    // Verify subjects
    const [topicCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT topic) as count FROM (
        SELECT topic1 AS topic FROM biblio WHERE topic1 IS NOT NULL AND topic1 != ''
        UNION
        SELECT topic2 AS topic FROM biblio WHERE topic2 IS NOT NULL AND topic2 != ''
        UNION
        SELECT topic3 AS topic FROM biblio WHERE topic3 IS NOT NULL AND topic3 != ''
        UNION
        SELECT topic4 AS topic FROM biblio WHERE topic4 IS NOT NULL AND topic4 != ''
        UNION
        SELECT topic5 AS topic FROM biblio WHERE topic5 IS NOT NULL AND topic5 != ''
      ) AS topics
    `)

    const targetSubjects = await prisma.subject.count()

    console.log(
      `Subjects: ${targetSubjects}/${topicCount[0].count} (${Math.round((targetSubjects / topicCount[0].count) * 100)}%)`,
    )

    // Verify material-subject relationships
    const materialSubjectCount = await prisma.materialToSubject.count()
    console.log(`Material-Subject Relationships: ${materialSubjectCount}`)

    // Verify collections
    const [collectionCount] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM collection_dm`)
    const targetCollections = await prisma.collection.count()

    console.log(
      `Collections: ${targetCollections}/${collectionCount[0].count} (${Math.round((targetCollections / collectionCount[0].count) * 100)}%)`,
    )

    // Verify material types
    const [materialTypeCount] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM material_type_dm`)
    const targetMaterialTypes = await prisma.materialType.count()

    console.log(
      `Material Types: ${targetMaterialTypes}/${materialTypeCount[0].count} (${Math.round((targetMaterialTypes / materialTypeCount[0].count) * 100)}%)`,
    )

    console.log("\nVerification completed!")
  } catch (error) {
    console.error("Error during verification:", error)
  } finally {
    if (db) await db.end()
    await prisma.$disconnect()
  }
}

main()
