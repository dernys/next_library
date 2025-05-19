import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket, type Connection } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

// Mapeo de estados y configuraciones
const COPY_STATUS: Record<string, string> = {
  AVL: "available",
  LOA: "loaned",
  RES: "reserved",
  DAM: "damaged",
}

const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 500

// Helpers para parseo seguro
const parseSafeInt = (v: string | null): number | null => {
  if (!v) return null
  const parsed = Number.parseInt(v, 10)
  return isNaN(parsed) ? null : parsed
}

const parseSafeFloat = (v: string | null): number | null => {
  if (!v) return null
  const parsed = Number.parseFloat(v.replace(/[^0-9.]/g, ""))
  return isNaN(parsed) ? null : parsed
}

// Sincronizar tablas de referencia
async function syncLookups(db: Connection) {
  // Material Types
  const [materialTypes] = await db.query<RowDataPacket[]>("SELECT code, description FROM material_type_dm")
  for (const mt of materialTypes) {
    await prisma.materialType.upsert({
      where: { externalId: String(mt.code) },
      create: {
        externalId: String(mt.code),
        name: mt.description,
        description: mt.description,
      },
      update: {
        name: mt.description,
        description: mt.description,
      },
    })
  }

  // Collections
  const [collections] = await db.query<RowDataPacket[]>("SELECT code, description FROM collection_dm")
  for (const col of collections) {
    await prisma.collection.upsert({
      where: { externalId: String(col.code) },
      create: {
        externalId: String(col.code),
        name: col.description,
        description: col.description,
      },
      update: {
        name: col.description,
        description: col.description,
      },
    })
  }
}

// Procesar campos USMARC
function processMarcFields(fields: RowDataPacket[]) {
  const marcData: Record<string, any> = {
    isbn: null,
    edition: null,
    publisher: null,
    language: null,
    subjects: [],
  }

  for (const field of fields) {
    const tag = String(field.tag).padStart(3, "0")
    const sub = field.subfield_cd?.toLowerCase()
    const data = field.field_data?.trim()

    switch (tag) {
      case "020":
        if (sub === "a") marcData.isbn = data
        break
      case "100":
      case "110":
        if (sub === "a") marcData.author = data
        break
      case "245":
        if (sub === "a") marcData.title = data
        if (sub === "b") marcData.subtitle = data
        break
      case "250":
        if (sub === "a") marcData.edition = data
        break
      case "260":
        if (sub === "a") marcData.publicationPlace = data
        if (sub === "b") marcData.publisher = data
        break
      case "300":
        if (sub === "a") marcData.pages = parseSafeInt(data)
        if (sub === "c") marcData.dimensions = data
        break
      case "650":
        if (sub === "a") marcData.subjects.push(data)
        break
      // Añadir más campos según necesidades
    }
  }

  return marcData
}

// Importación principal
async function importData(db: Connection) {
  // 1. Sincronizar lookups
  await syncLookups(db)

  // 2. Importar materiales
  let offset = 0
  while (true) {
    const [materials] = await db.query<RowDataPacket[]>(
      `SELECT bibid, material_cd, collection_cd, title, author FROM biblio LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    )

    if (materials.length === 0) break

    for (const mat of materials) {
      // Obtener campos MARC
      const [fields] = await db.query<RowDataPacket[]>(
        "SELECT tag, subfield_cd, field_data FROM biblio_field WHERE bibid = ?",
        [mat.bibid],
      )

      const marcData = processMarcFields(fields)
      const categoryId = (await prisma.category.findFirst())?.id || "default-category-id"

      // Upsert material
      const material = await prisma.material.upsert({
        where: { externalId: String(mat.bibid) },
        create: {
          externalId: String(mat.bibid),
          title: marcData.title || mat.title,
          author: marcData.author || mat.author,
          isbn: marcData.isbn,
          editionInfo: marcData.edition,
          publisher: marcData.publisher,
          language: marcData.language,
          pages: marcData.pages,
          dimensions: marcData.dimensions,
          category: { connect: { id: categoryId } },
          materialType: { connect: { externalId: String(mat.material_cd) } },
          collection: { connect: { externalId: String(mat.collection_cd) } },
        },
        update: {
          title: marcData.title || mat.title,
          author: marcData.author || mat.author,
          isbn: marcData.isbn,
          editionInfo: marcData.edition,
          publisher: marcData.publisher,
          language: marcData.language,
          pages: marcData.pages,
          dimensions: marcData.dimensions,
        },
      })

      // Procesar subjects
      await prisma.materialToSubject.deleteMany({ where: { materialId: material.id } })
      for (const subjectName of marcData.subjects) {
        const subject = await prisma.subject.upsert({
          where: { name: subjectName },
          create: { name: subjectName },
          update: {},
        })
        await prisma.materialToSubject.create({
          data: { materialId: material.id, subjectId: subject.id },
        })
      }

      // Procesar copias
      const [copies] = await db.query<RowDataPacket[]>(
        "SELECT copyid, barcode_nmbr, status_cd, create_dt FROM biblio_copy WHERE bibid = ?",
        [mat.bibid],
      )

      for (const copy of copies) {
        await prisma.copy.upsert({
          where: { externalId: String(copy.copyid) },
          create: {
            externalId: String(copy.copyid),
            registrationNumber: copy.barcode_nmbr,
            status: COPY_STATUS[copy.status_cd],
            materialId: material.id,
            acquisitionDate: new Date(copy.create_dt),
          },
          update: {
            status: COPY_STATUS[copy.status_cd],
            acquisitionDate: new Date(copy.create_dt),
          },
        })
      }

      // Actualizar cantidad
      await prisma.material.update({
        where: { id: material.id },
        data: { quantity: copies.length },
      })
    }

    offset += BATCH_SIZE
    console.log(`Procesado lote hasta offset ${offset}`)
  }
}

// Ejecución principal
async function main() {
  const db = await mysql.createConnection(process.env.MYSQL_URL!)
  try {
    await prisma.$connect()
    await importData(db)
    console.log("✅ Importación completada con éxito")
  } catch (error) {
    console.error("❌ Error durante la importación:", error)
    process.exit(1)
  } finally {
    await db.end()
    await prisma.$disconnect()
  }
}

main()
