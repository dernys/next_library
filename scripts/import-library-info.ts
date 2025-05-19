import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

async function main() {
  console.log("Starting library info import...")

  try {
    // Connect to MySQL database
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
    })

    // Get library settings
    const [settingsRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        library_name, library_hours, library_aders, 
        library_phone, library_url, opac_url
      FROM 
        settings
      LIMIT 1
    `)

    if (settingsRows.length > 0) {
      const settings = settingsRows[0]

      await prisma.libraryInfo.upsert({
        where: { id: "default" },
        update: {
          name: settings.library_name || "Library Management System",
          description: "Imported from legacy system",
          address: settings.library_aders,
          phone: settings.library_phone,
          email: "library@example.com",
          website: settings.library_url,
          openingHours: settings.library_hours,
        },
        create: {
          id: "default",
          name: settings.library_name || "Library Management System",
          description: "Imported from legacy system",
          address: settings.library_aders,
          phone: settings.library_phone,
          email: "library@example.com",
          website: settings.library_url,
          openingHours: settings.library_hours,
        },
      })

      console.log("✅ Library information imported successfully")
    } else {
      console.log("No library settings found in the source database")

      // Create default library info
      await prisma.libraryInfo.upsert({
        where: { id: "default" },
        update: {},
        create: {
          id: "default",
          name: "Library Management System",
          description: "Default library information",
          email: "library@example.com",
        },
      })

      console.log("✅ Default library information created")
    }

    // Close connections
    await db.end()
    await prisma.$disconnect()
  } catch (error) {
    console.error("❌ Error during import:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the import
main()
