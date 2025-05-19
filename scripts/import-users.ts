import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket } from "mysql2/promise"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

// Configuration
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "changeme123"

// Helper function to generate password hash
const generateHash = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log("Starting users import...")

  try {
    // Connect to MySQL database
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
    })

    // Ensure roles exist
    console.log("Checking roles...")
    const librarianRole = await prisma.role.upsert({
      where: { name: "librarian" },
      update: {},
      create: {
        name: "librarian",
        description: "Library administrator with full access",
      },
    })

    const memberRole = await prisma.role.upsert({
      where: { name: "member" },
      update: {},
      create: {
        name: "member",
        description: "Regular library member",
      },
    })

    console.log("Importing staff as librarians...")
    const [staffRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        userid, username, last_name, first_name, suspended_flg
      FROM 
        staff
    `)

    const defaultPassword = await generateHash(DEFAULT_PASSWORD)

    for (const staff of staffRows) {
      await prisma.user.upsert({
        where: { externalId: `staff_${staff.userid}` },
        update: {
          name: staff.first_name || "Staff",
          lastName: staff.last_name,
          isActive: staff.suspended_flg !== "Y",
        },
        create: {
          externalId: `staff_${staff.userid}`,
          name: staff.first_name || "Staff",
          lastName: staff.last_name,
          email: staff.username ? `${staff.username}@library.org` : `staff${staff.userid}@library.org`,
          password: defaultPassword,
          roleId: librarianRole.id,
          isActive: staff.suspended_flg !== "Y",
        },
      })
    }

    console.log("Importing members...")
    const [memberRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        mbrid, barcode_nmbr, first_name, last_name, email, 
        home_phone, work_phone, cel, address, is_active
      FROM 
        member
    `)

    for (const member of memberRows) {
      await prisma.user.upsert({
        where: { externalId: `member_${member.mbrid}` },
        update: {
          name: member.first_name || "Member",
          lastName: member.last_name,
          email: member.email || `member${member.mbrid}@example.com`,
          phone: member.cel || member.home_phone || member.work_phone,
          address: member.address,
          isActive: member.is_active === "Y",
        },
        create: {
          externalId: `member_${member.mbrid}`,
          name: member.first_name || "Member",
          lastName: member.last_name,
          email: member.email || `member${member.mbrid}@example.com`,
          password: defaultPassword,
          phone: member.cel || member.home_phone || member.work_phone,
          identityCard: member.barcode_nmbr,
          address: member.address,
          roleId: memberRole.id,
          isActive: member.is_active === "Y",
        },
      })
    }

    console.log(`✅ Imported ${staffRows.length} staff and ${memberRows.length} members`)

    // Close connections
    await db.end()
    await prisma.$disconnect()

    console.log("✅ Users import completed successfully!")
  } catch (error) {
    console.error("❌ Error during import:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the import
main()
