import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket, type Connection } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()
const IMPORT_MODE = (process.env.IMPORT_MODE as "full" | "incremental") || "incremental"
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 500

const COPY_STATUS: Record<string, string> = {
  AVL: "available",
  LOA: "loaned",
  RES: "reserved",
  DAM: "damaged",
}

type USMarc = Record<string, Record<string, string>>

function parseIntSafe(v?: string) {
  const n = v ? Number.parseInt(v, 10) : Number.NaN
  return isNaN(n) ? null : n
}

async function fetchUSMarc(bibid: number, conn: mysql.Connection): Promise<USMarc> {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT tag, subfield_cd AS sf, field_data AS val FROM biblio_field WHERE bibid = ?`,
    [bibid],
  )
  const marc: USMarc = {}
  for (const { tag, sf, val } of rows) {
    marc[tag] = marc[tag] || {}
    marc[tag][sf] = val
  }
  return marc
}

async function syncLookups(db: Connection) {
  const lookups = [
    { table: "material_type_dm", model: prisma.materialType, key: "id" },
    { table: "collection_dm", model: prisma.collection, key: "id" },
    { table: "language_dm", model: prisma.language, key: "id" },
    { table: "publisher_dm", model: prisma.publisher, key: "id" },
    { table: "author_dm", model: prisma.author, key: "id" },
  ]

  for (const { table, model, key } of lookups) {
    const [rows] = await db.query<RowDataPacket[]>(`SELECT code, description FROM ${table}`)
    for (const r of rows) {
      const id = String(r.code)
      await model.upsert({
        where: { [key]: id },
        create: { [key]: id, name: r.description, description: r.description },
        update: { name: r.description, description: r.description },
      })
    }
  }
}

async function importMaterials() {
  const db = await mysql.createConnection({
    host: process.env.SOURCE_DB_HOST,
    user: process.env.SOURCE_DB_USER,
    password: process.env.SOURCE_DB_PASSWORD,
    database: process.env.SOURCE_DB_NAME,
  })

  await syncLookups(db)

  const [materials] = await db.query<RowDataPacket[]>(`
    SELECT bibid, title, author, publisher, pub_year, isbn, material_cd, collection_cd, language_cd
    FROM biblio
    ${IMPORT_MODE === "incremental" ? "WHERE modified_at >= CURDATE() - INTERVAL 1 DAY" : ""}
  `)

  for (const m of materials) {
    const usmarc = await fetchUSMarc(m.bibid, db)
    await prisma.material.upsert({
      where: { id: m.bibid },
      create: {
        id: m.bibid,
        title: m.title,
        authorId: m.author,
        publisherId: m.publisher,
        publicationYear: parseIntSafe(m.pub_year),
        isbn: m.isbn,
        materialTypeId: m.material_cd,
        collectionId: m.collection_cd,
        languageId: m.language_cd,
        usmarc: JSON.stringify(usmarc),
      },
      update: {
        title: m.title,
        authorId: m.author,
        publisherId: m.publisher,
        publicationYear: parseIntSafe(m.pub_year),
        isbn: m.isbn,
        materialTypeId: m.material_cd,
        collectionId: m.collection_cd,
        languageId: m.language_cd,
        usmarc: JSON.stringify(usmarc),
      },
    })
  }

  await db.end()
  await prisma.$disconnect()
}

importMaterials()
  .then(() => console.log("✅ Importación completada con éxito"))
  .catch((e) => {
    console.error("❌ Error durante la importación:", e)
    process.exit(1)
  })
