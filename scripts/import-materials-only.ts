import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket, type Connection } from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

// Configuration
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 500

// Status mappings
const COPY_STATUS: Record<string, string> = {
  AVL: "available",
  LOA: "loaned",
  RES: "reserved",
  DAM: "damaged",
  LST: "lost",
  OTH: "other",
}

// Helper functions
const cleanString = (str: string | null | undefined): string | null => {
  if (!str) return null
  return str.trim() || null
}

const parseIntSafe = (value: string | null | undefined): number | null => {
  if (!value) return null
  const parsed = Number.parseInt(value.replace(/[^\d.-]/g, ""), 10)
  return isNaN(parsed) ? null : parsed
}

const parseFloatSafe = (value: string | null | undefined): number | null => {
  if (!value) return null
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
  return isNaN(parsed) ? null : parsed
}

// Import material types
async function importMaterialTypes(db: Connection): Promise<void> {
  console.log("Importing material types...")

  const [materialTypeRows] = await db.query<RowDataPacket[]>(`
    SELECT code, description
    FROM material_type_dm
  `)

  for (const materialType of materialTypeRows) {
    await prisma.materialType.upsert({
      where: { externalId: String(materialType.code) },
      update: {
        name: materialType.description,
        description: materialType.description,
      },
      create: {
        externalId: String(materialType.code),
        name: materialType.description,
        description: materialType.description,
      },
    })
  }

  console.log(`✅ Imported ${materialTypeRows.length} material types`)
}

// Import collections
async function importCollections(db: Connection): Promise<void> {
  console.log("Importing collections...")

  const [collectionRows] = await db.query<RowDataPacket[]>(`
    SELECT code, description
    FROM collection_dm
  `)

  for (const collection of collectionRows) {
    await prisma.collection.upsert({
      where: { externalId: String(collection.code) },
      update: {
        name: collection.description,
        description: collection.description,
      },
      create: {
        externalId: String(collection.code),
        name: collection.description,
        description: collection.description,
      },
    })
  }

  console.log(`✅ Imported ${collectionRows.length} collections`)
}

// Import subjects
async function importSubjects(db: Connection): Promise<Map<string, string>> {
  console.log("Importing subjects...")

  const subjectMap = new Map<string, string>()

  // Get unique topics from biblio table
  const [topicRows] = await db.query<RowDataPacket[]>(`
    SELECT DISTINCT topic1 AS topic FROM biblio WHERE topic1 IS NOT NULL AND topic1 != ''
    UNION
    SELECT DISTINCT topic2 AS topic FROM biblio WHERE topic2 IS NOT NULL AND topic2 != ''
    UNION
    SELECT DISTINCT topic3 AS topic FROM biblio WHERE topic3 IS NOT NULL AND topic3 != ''
    UNION
    SELECT DISTINCT topic4 AS topic FROM biblio WHERE topic4 IS NOT NULL AND topic4 != ''
    UNION
    SELECT DISTINCT topic5 AS topic FROM biblio WHERE topic5 IS NOT NULL AND topic5 != ''
  `)

  for (const row of topicRows) {
    if (row.topic && typeof row.topic === "string" && row.topic.trim()) {
      const subject = await prisma.subject.upsert({
        where: { name: row.topic },
        update: {},
        create: {
          name: row.topic,
          description: row.topic,
        },
      })

      subjectMap.set(row.topic, subject.id)
    }
  }

  console.log(`✅ Imported ${subjectMap.size} subjects`)
  return subjectMap
}

// Import materials and copies
async function importMaterials(db: Connection, subjectMap: Map<string, string>): Promise<void> {
  console.log("Importing materials...")

  // Get default category
  const defaultCategory = await prisma.category.findFirst()
  if (!defaultCategory) {
    throw new Error("No default category found. Please run seed script first.")
  }

  // Process materials in batches
  let offset = 0
  let totalImported = 0
  let hasMore = true

  while (hasMore) {
    const [materialRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        bibid, create_dt, material_cd, collection_cd,
        call_nmbr1, call_nmbr2, call_nmbr3, title, title_remainder,
        responsibility_stmt, author, topic1, topic2, topic3, topic4, topic5,
        opac_flg, has_cover
      FROM 
        biblio
      ORDER BY bibid
      LIMIT ${BATCH_SIZE} OFFSET ${offset}
    `)

    if (materialRows.length === 0) {
      hasMore = false
      break
    }

    for (const material of materialRows) {
      // Get MARC fields for additional data
      const [fieldRows] = await db.query<RowDataPacket[]>(
        `
        SELECT tag, subfield_cd, field_data
        FROM biblio_field
        WHERE bibid = ?
      `,
        [material.bibid],
      )

      // Extract data from MARC fields
      let isbn = null
      let description = null
      let publisher = null
      let publicationPlace = null
      let language = null
      let pages = null
      let dimensions = null
      let price = null

      for (const field of fieldRows) {
        const tag = String(field.tag).padStart(3, "0")
        const subfield = field.subfield_cd
        const data = field.field_data

        switch (tag) {
          case "020": // ISBN
            if (subfield === "a") isbn = cleanString(data)
            break
          case "260": // Publication info
            if (subfield === "a") publicationPlace = cleanString(data)
            if (subfield === "b") publisher = cleanString(data)
            break
          case "300": // Physical description
            if (subfield === "a") pages = parseIntSafe(data)
            if (subfield === "c") dimensions = cleanString(data)
            break
          case "520": // Summary
            if (subfield === "a") description = cleanString(data)
            break
          case "041": // Language
            if (subfield === "a") language = cleanString(data)
            break
          case "365": // Price
            if (subfield === "b") price = parseFloatSafe(data)
            break
        }
      }

      // If no description from MARC, use responsibility statement
      if (!description && material.responsibility_stmt) {
        description = cleanString(material.responsibility_stmt)
      }

      // Get material type and collection
      const materialType = await prisma.materialType.findUnique({
        where: { externalId: String(material.material_cd) },
      })

      const collection = await prisma.collection.findUnique({
        where: { externalId: String(material.collection_cd) },
      })

      // Create or update material
      const createdMaterial = await prisma.material.upsert({
        where: { externalId: `biblio_${material.bibid}` },
        update: {
          title: cleanString(material.title) || "Untitled",
          subtitle: cleanString(material.title_remainder),
          author: cleanString(material.author) || "Unknown",
          isbn,
          description,
          isOpac: material.opac_flg === "Y",
          materialTypeId: materialType?.id,
          collectionId: collection?.id,
          language,
          publisher,
          publicationPlace,
          pages,
          dimensions,
          price,
          registrationNumber: String(material.bibid),
          entry1: cleanString(material.call_nmbr1),
          entry2: cleanString(material.call_nmbr2),
          entry3: cleanString(material.call_nmbr3),
          coverImage: material.has_cover === "Y" ? "true" : null,
        },
        create: {
          externalId: `biblio_${material.bibid}`,
          title: cleanString(material.title) || "Untitled",
          subtitle: cleanString(material.title_remainder),
          author: cleanString(material.author) || "Unknown",
          isbn,
          description,
          isOpac: material.opac_flg === "Y",
          categoryId: defaultCategory.id,
          materialTypeId: materialType?.id,
          collectionId: collection?.id,
          language,
          publisher,
          publicationPlace,
          pages,
          dimensions,
          price,
          registrationNumber: String(material.bibid),
          entry1: cleanString(material.call_nmbr1),
          entry2: cleanString(material.call_nmbr2),
          entry3: cleanString(material.call_nmbr3),
          coverImage: material.has_cover === "Y" ? "true" : null,
        },
      })

      // Add subjects
      await prisma.materialToSubject.deleteMany({
        where: { materialId: createdMaterial.id },
      })

      const subjects = []
      if (material.topic1 && subjectMap.has(material.topic1)) subjects.push(subjectMap.get(material.topic1))
      if (material.topic2 && subjectMap.has(material.topic2)) subjects.push(subjectMap.get(material.topic2))
      if (material.topic3 && subjectMap.has(material.topic3)) subjects.push(subjectMap.get(material.topic3))
      if (material.topic4 && subjectMap.has(material.topic4)) subjects.push(subjectMap.get(material.topic4))
      if (material.topic5 && subjectMap.has(material.topic5)) subjects.push(subjectMap.get(material.topic5))

      for (const subjectId of subjects) {
        if (subjectId) {
          await prisma.materialToSubject.create({
            data: {
              materialId: createdMaterial.id,
              subjectId,
            },
          })
        }
      }

      // Import copies
      const [copyRows] = await db.query<RowDataPacket[]>(
        `
        SELECT 
          copyid, barcode_nmbr, create_dt, copy_desc, status_cd
        FROM 
          biblio_copy
        WHERE 
          bibid = ?
      `,
        [material.bibid],
      )

      for (const copy of copyRows) {
        await prisma.copy.upsert({
          where: { externalId: `copy_${material.bibid}_${copy.copyid}` },
          update: {
            registrationNumber: copy.barcode_nmbr,
            status: COPY_STATUS[copy.status_cd] || "available",
            notes: cleanString(copy.copy_desc),
            acquisitionDate: new Date(copy.create_dt),
          },
          create: {
            externalId: `copy_${material.bibid}_${copy.copyid}`,
            registrationNumber: copy.barcode_nmbr,
            status: COPY_STATUS[copy.status_cd] || "available",
            materialId: createdMaterial.id,
            notes: cleanString(copy.copy_desc),
            acquisitionDate: new Date(copy.create_dt),
          },
        })
      }

      // Update material quantity
      await prisma.material.update({
        where: { id: createdMaterial.id },
        data: { quantity: copyRows.length },
      })
    }

    totalImported += materialRows.length
    console.log(`Imported ${totalImported} materials so far...`)
    offset += BATCH_SIZE
  }

  console.log(`✅ Imported ${totalImported} materials in total`)
}

// Main function
async function main() {
  console.log("Starting materials import...")

  try {
    // Connect to MySQL database
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
      // Increase timeout for large operations
      connectTimeout: 60000,
    })

    // Import in the correct order
    await importMaterialTypes(db)
    await importCollections(db)
    const subjectMap = await importSubjects(db)
    await importMaterials(db, subjectMap)

    // Close connections
    await db.end()
    await prisma.$disconnect()

    console.log("✅ Materials import completed successfully!")
  } catch (error) {
    console.error("❌ Error during import:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the import
main()
