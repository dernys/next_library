import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  console.log("Starting import verification...")

  try {
    // Connect to MySQL database
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
    })

    // Verify material types
    const [materialTypeCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM material_type_dm
    `)
    const prismaTypeCount = await prisma.materialType.count()
    console.log(`Material Types: MySQL=${materialTypeCount[0].count}, Prisma=${prismaTypeCount}`)

    // Verify collections
    const [collectionCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM collection_dm
    `)
    const prismaCollectionCount = await prisma.collection.count()
    console.log(`Collections: MySQL=${collectionCount[0].count}, Prisma=${prismaCollectionCount}`)

    // Verify materials
    const [materialCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio
    `)
    const prismaMaterialCount = await prisma.material.count()
    console.log(`Materials: MySQL=${materialCount[0].count}, Prisma=${prismaMaterialCount}`)

    // Verify copies
    const [copyCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_copy
    `)
    const prismaCopyCount = await prisma.copy.count()
    console.log(`Copies: MySQL=${copyCount[0].count}, Prisma=${prismaCopyCount}`)

    // Verify users
    const [staffCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM staff
    `)
    const [memberCount] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM member
    `)
    const prismaUserCount = await prisma.user.count()
    console.log(`Users: MySQL=${staffCount[0].count + memberCount[0].count}, Prisma=${prismaUserCount}`)

    // Verify loans
    const [activeLoans] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_copy WHERE status_cd = 'LOA'
    `)
    const [histLoans] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM biblio_status_hist WHERE status_cd = 'LOA'
    `)
    const prismaLoanCount = await prisma.loan.count()
    console.log(`Loans: MySQL=${activeLoans[0].count + histLoans[0].count}, Prisma=${prismaLoanCount}`)

    // Verify library info
    const prismaLibraryInfo = await prisma.libraryInfo.findFirst()
    console.log(`Library Info: ${prismaLibraryInfo ? "Imported" : "Missing"}`)

    // Close connections
    await db.end()
    await prisma.$disconnect()

    console.log("\n✅ Verification completed")
  } catch (error) {
    console.error("❌ Error during verification:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the verification
main()
