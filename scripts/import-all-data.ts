import { PrismaClient } from "@prisma/client"
import mysql, { type RowDataPacket, type Connection } from "mysql2/promise"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()

// Configuration
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 500
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "changeme123"

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
const generateHash = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

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

// Generate a consistent externalId for a string
const generateExternalId = (prefix: string, value: string): string => {
  return `${prefix}_${Buffer.from(value).toString("base64").replace(/[+/=]/g, "")}`
}

// Add this function to check if a model has a unique constraint on a field
async function hasUniqueConstraint(model: string, field: string): Promise<boolean> {
  try {
    // This is a simple check - if upsert works with this field, it has a unique constraint
    const dummyValue = `test_${Date.now()}`
    await prisma[model].upsert({
      where: { [field]: dummyValue },
      update: {},
      create: { [field]: dummyValue },
    })

    // If we get here, the field has a unique constraint
    // Clean up the test record
    await prisma[model].delete({ where: { [field]: dummyValue } })
    return true
  } catch (error) {
    // If error contains message about unique constraint, the field doesn't have one
    return false
  }
}

// Add this helper function to safely handle upserts
async function safeUpsert(model: string, uniqueField: string, uniqueValue: any, data: any): Promise<any> {
  try {
    // Try direct upsert first
    return await prisma[model].upsert({
      where: { [uniqueField]: uniqueValue },
      update: data.update || {},
      create: data.create,
    })
  } catch (error) {
    // If upsert fails, fall back to findFirst + create/update
    const existing = await prisma[model].findFirst({
      where: { [uniqueField]: uniqueValue },
    })

    if (existing) {
      return await prisma[model].update({
        where: { id: existing.id },
        data: data.update || data.create,
      })
    } else {
      return await prisma[model].create({
        data: data.create,
      })
    }
  }
}

// Add this function to handle errors gracefully
async function importWithErrorHandling<T>(
  entityName: string,
  items: T[],
  importFn: (item: T) => Promise<void>,
): Promise<number> {
  console.log(`Importing ${entityName}...`)
  let successCount = 0
  let errorCount = 0

  for (const item of items) {
    try {
      await importFn(item)
      successCount++

      // Log progress for large imports
      if (successCount % 100 === 0) {
        console.log(`Imported ${successCount} ${entityName} so far...`)
      }
    } catch (error) {
      errorCount++
      console.error(`Error importing ${entityName}:`, error)

      // Don't let a single error stop the entire import
      if (errorCount > 50) {
        console.error(`Too many errors (${errorCount}), stopping ${entityName} import`)
        break
      }
    }
  }

  console.log(`✅ Imported ${successCount} ${entityName} (with ${errorCount} errors)`)
  return successCount
}

// Main import functions
async function importRoles(): Promise<void> {
  console.log("Importing roles...")

  const roles = [
    { name: "librarian", description: "Library administrator with full access" },
    { name: "member", description: "Regular library member" },
    { name: "guest", description: "Guest user with limited access" },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
  }

  console.log("✅ Roles imported successfully")
}

async function importUsers(db: Connection): Promise<void> {
  console.log("Importing users...")

  // Get the role IDs
  const librarianRole = await prisma.role.findUnique({ where: { name: "librarian" } })
  const memberRole = await prisma.role.findUnique({ where: { name: "member" } })

  if (!librarianRole || !memberRole) {
    throw new Error("Required roles not found. Please import roles first.")
  }

  // Import staff as librarians
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

  // Import members
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
}

async function importCategories(db: Connection): Promise<void> {
  console.log("Importing categories...")

  // First, import default categories
  const defaultCategories = [
    { name: "Fiction", description: "Novels, short stories and other fiction works" },
    { name: "Non-fiction", description: "Biographies, history, science and other non-fiction topics" },
    { name: "Reference", description: "Dictionaries, encyclopedias and other reference materials" },
    { name: "Academic", description: "Textbooks and educational materials" },
    { name: "Children", description: "Books for children and young adults" },
  ]

  for (const category of defaultCategories) {
    // Check if category exists by name
    const existingCategory = await prisma.category.findFirst({
      where: { name: category.name },
    })

    if (existingCategory) {
      // Update if needed
      await prisma.category.update({
        where: { id: existingCategory.id },
        data: { description: category.description },
      })
    } else {
      // Create new category with externalId
      await prisma.category.create({
        data: {
          name: category.name,
          description: category.description,
          externalId: `default_${category.name.toLowerCase().replace(/\s+/g, "_")}`,
        },
      })
    }
  }

  // Import CDD as categories
  const [cddRows] = await db.query<RowDataPacket[]>(`
    SELECT cdd_Bid, cdd_Numero, cdd_Descripcion
    FROM cdd
    LIMIT 100
  `)

  let importedCount = 0
  for (const cdd of cddRows) {
    if (cdd.cdd_Descripcion) {
      const externalId = `cdd_${cdd.cdd_Bid}`

      // Check if category exists by externalId
      const existingCategory = await prisma.category.findUnique({
        where: { externalId },
      })

      if (existingCategory) {
        // Update if needed
        await prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            name: cdd.cdd_Descripcion,
            description: `CDD ${cdd.cdd_Numero}: ${cdd.cdd_Descripcion}`,
          },
        })
      } else {
        // Check if category exists by name
        const existingByName = await prisma.category.findFirst({
          where: { name: cdd.cdd_Descripcion },
        })

        if (existingByName) {
          // Update existing category with externalId
          await prisma.category.update({
            where: { id: existingByName.id },
            data: {
              externalId,
              description: `CDD ${cdd.cdd_Numero}: ${cdd.cdd_Descripcion}`,
            },
          })
        } else {
          // Create new category
          await prisma.category.create({
            data: {
              externalId,
              name: cdd.cdd_Descripcion,
              description: `CDD ${cdd.cdd_Numero}: ${cdd.cdd_Descripcion}`,
            },
          })
        }
      }
      importedCount++
    }
  }

  console.log(`✅ Imported ${defaultCategories.length + importedCount} categories`)
}

async function importCollections(db: Connection): Promise<void> {
  console.log("Importing collections...")

  const [collectionRows] = await db.query<RowDataPacket[]>(`
    SELECT code, description, days_due_back
    FROM collection_dm
  `)

  for (const collection of collectionRows) {
    await prisma.collection.upsert({
      where: { externalId: String(collection.code) },
      update: {
        name: collection.description,
        description: `Loan period: ${collection.days_due_back} days`,
      },
      create: {
        externalId: String(collection.code),
        name: collection.description,
        description: `Loan period: ${collection.days_due_back} days`,
      },
    })
  }

  console.log(`✅ Imported ${collectionRows.length} collections`)
}

async function importMaterialTypes(db: Connection): Promise<void> {
  console.log("Importing material types...")

  const [materialTypeRows] = await db.query<RowDataPacket[]>(`
    SELECT code, description, image_file
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

async function importSubjects(db: Connection): Promise<void> {
  console.log("Importing subjects...")

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

  let importedCount = 0
  for (const row of topicRows) {
    if (row.topic && typeof row.topic === "string" && row.topic.trim()) {
      const topicName = row.topic.trim()

      // Generate a consistent externalId based on the topic name
      const externalId = generateExternalId("topic", topicName)

      // Check if subject already exists
      const existingSubject = await prisma.subject.findFirst({
        where: { name: topicName },
      })

      if (existingSubject) {
        // Update if needed
        await prisma.subject.update({
          where: { id: existingSubject.id },
          data: {
            description: topicName,
            externalId: externalId, // Add externalId for future upserts
          },
        })
      } else {
        // Create new subject
        await prisma.subject.create({
          data: {
            name: topicName,
            description: topicName,
            externalId: externalId,
          },
        })
      }
      importedCount++
    }
  }

  console.log(`✅ Imported ${importedCount} subjects`)
}

// Create a cache for subject lookups to improve performance
const subjectCache = new Map<string, { id: string; externalId: string }>()

// Function to find a subject by name, using the cache for performance
async function findSubjectByName(name: string): Promise<{ id: string; externalId: string } | null> {
  if (!name) return null

  const trimmedName = name.trim()
  if (!trimmedName) return null

  // Check cache first
  if (subjectCache.has(trimmedName)) {
    return subjectCache.get(trimmedName) || null
  }

  // Not in cache, look up in database
  const subject = await prisma.subject.findFirst({
    where: { name: trimmedName },
    select: { id: true, externalId: true },
  })

  if (subject) {
    // Add to cache for future lookups
    subjectCache.set(trimmedName, subject)
    return subject
  }

  // If not found, try to find by externalId
  const externalId = generateExternalId("topic", trimmedName)
  const subjectByExternalId = await prisma.subject.findUnique({
    where: { externalId },
    select: { id: true, externalId: true },
  })

  if (subjectByExternalId) {
    // Add to cache for future lookups
    subjectCache.set(trimmedName, subjectByExternalId)
    return subjectByExternalId
  }

  return null
}

async function importMaterials(db: Connection): Promise<void> {
  console.log("Importing materials...")

  // Get default category for materials without a category
  const defaultCategory = await prisma.category.findFirst()
  if (!defaultCategory) {
    throw new Error("No default category found. Please import categories first.")
  }

  // Process materials in batches
  let offset = 0
  let totalImported = 0
  let hasMore = true

  while (hasMore) {
    const [materialRows] = await db.query<RowDataPacket[]>(`
      SELECT 
        bibid, create_dt, last_change_dt, material_cd, collection_cd,
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
      try {
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

        // Get subjects - filter out duplicates
        const subjectSet = new Set<string>()
        if (material.topic1) subjectSet.add(material.topic1.trim())
        if (material.topic2) subjectSet.add(material.topic2.trim())
        if (material.topic3) subjectSet.add(material.topic3.trim())
        if (material.topic4) subjectSet.add(material.topic4.trim())
        if (material.topic5) subjectSet.add(material.topic5.trim())

        // Convert Set to Array
        const subjects = Array.from(subjectSet).filter(Boolean)

        // Create or update material
        const materialData = {
          externalId: `biblio_${material.bibid}`,
          title: cleanString(material.title) || "Untitled",
          subtitle: cleanString(material.title_remainder),
          author: cleanString(material.author) || "Unknown",
          isbn,
          description,
          isOpac: material.opac_flg === "Y",
          categoryId: defaultCategory.id,
          materialTypeId: material.material_cd ? await getMaterialTypeId(String(material.material_cd)) : null,
          collectionId: material.collection_cd ? await getCollectionId(String(material.collection_cd)) : null,
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
        }

        const createdMaterial = await prisma.material.upsert({
          where: { externalId: materialData.externalId },
          update: materialData,
          create: materialData,
        })

        // Add subjects
        await prisma.materialToSubject.deleteMany({
          where: { materialId: createdMaterial.id },
        })

        // Track which subject IDs we've already added to this material
        const addedSubjectIds = new Set<string>()

        for (const subjectName of subjects) {
          if (subjectName && typeof subjectName === "string" && subjectName.trim()) {
            try {
              // Use our helper function to find the subject
              const subject = await findSubjectByName(subjectName)

              if (subject) {
                // Check if we've already added this subject to this material
                if (!addedSubjectIds.has(subject.id)) {
                  await prisma.materialToSubject.create({
                    data: {
                      materialId: createdMaterial.id,
                      subjectId: subject.id,
                    },
                  })
                  // Mark this subject as added
                  addedSubjectIds.add(subject.id)
                }
              } else {
                // Subject doesn't exist yet, create it
                const externalId = generateExternalId("topic", subjectName.trim())
                const newSubject = await prisma.subject.create({
                  data: {
                    name: subjectName.trim(),
                    description: subjectName.trim(),
                    externalId,
                  },
                })

                // Add to cache
                subjectCache.set(subjectName.trim(), { id: newSubject.id, externalId: newSubject.externalId })

                // Create the relationship
                await prisma.materialToSubject.create({
                  data: {
                    materialId: createdMaterial.id,
                    subjectId: newSubject.id,
                  },
                })
                // Mark this subject as added
                addedSubjectIds.add(newSubject.id)
              }
            } catch (error) {
              console.error(`Error adding subject "${subjectName}" to material ${material.bibid}:`, error)
              // Continue with next subject
            }
          }
        }

        // Import copies
        await importCopiesForMaterial(db, material.bibid, createdMaterial.id)
      } catch (error) {
        console.error(`Error importing material ${material.bibid}:`, error)
        // Continue with next material
      }
    }

    totalImported += materialRows.length
    console.log(`Imported ${totalImported} materials so far...`)
    offset += BATCH_SIZE
  }

  console.log(`✅ Imported ${totalImported} materials in total`)
}

async function importCopiesForMaterial(db: Connection, biblioId: number, materialId: string): Promise<void> {
  const [copyRows] = await db.query<RowDataPacket[]>(
    `
    SELECT 
      copyid, barcode_nmbr, create_dt, copy_desc, status_cd
    FROM 
      biblio_copy
    WHERE 
      bibid = ?
  `,
    [biblioId],
  )

  for (const copy of copyRows) {
    await prisma.copy.upsert({
      where: { externalId: `copy_${biblioId}_${copy.copyid}` },
      update: {
        registrationNumber: copy.barcode_nmbr,
        status: COPY_STATUS[copy.status_cd] || "available",
        notes: cleanString(copy.copy_desc),
        acquisitionDate: new Date(copy.create_dt),
      },
      create: {
        externalId: `copy_${biblioId}_${copy.copyid}`,
        registrationNumber: copy.barcode_nmbr,
        status: COPY_STATUS[copy.status_cd] || "available",
        materialId,
        notes: cleanString(copy.copy_desc),
        acquisitionDate: new Date(copy.create_dt),
      },
    })
  }

  // Update material quantity
  await prisma.material.update({
    where: { id: materialId },
    data: { quantity: copyRows.length },
  })
}

async function importLoans(db: Connection): Promise<void> {
  console.log("Importing loans...")

  // Get loan history from biblio_status_hist
  const [loanRows] = await db.query<RowDataPacket[]>(`
    SELECT 
      bibid, copyid, status_cd, status_begin_dt, due_back_dt, 
      mbrid, renewal_count
    FROM 
      biblio_status_hist
    WHERE 
      status_cd = 'LOA'
    ORDER BY status_begin_dt DESC
  `)

  let totalImported = 0

  for (const loan of loanRows) {
    try {
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
          status: "returned", // Assuming historical loans are returned
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

      totalImported++
    } catch (error) {
      console.error(`Error importing historical loan for biblio ${loan.bibid}, copy ${loan.copyid}:`, error)
    }
  }

  // Import current active loans from biblio_copy
  const [activeLoans] = await db.query<RowDataPacket[]>(`
    SELECT 
      bibid, copyid, status_begin_dt, due_back_dt, 
      mbrid, renewal_count
    FROM 
      biblio_copy
    WHERE 
      status_cd = 'LOA'
  `)

  for (const loan of activeLoans) {
    try {
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
        where: { externalId: `active_loan_${loan.bibid}_${loan.copyid}` },
        update: {
          loanDate: new Date(loan.status_begin_dt),
          dueDate: loan.due_back_dt ? new Date(loan.due_back_dt) : new Date(loan.status_begin_dt),
          status: new Date() > new Date(loan.due_back_dt) ? "overdue" : "active",
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
          status: new Date() > new Date(loan.due_back_dt) ? "overdue" : "active",
          notes: `Imported from legacy system. Renewals: ${loan.renewal_count}`,
        },
      })

      totalImported++
    } catch (error) {
      console.error(`Error importing active loan for biblio ${loan.bibid}, copy ${loan.copyid}:`, error)
    }
  }

  console.log(`✅ Imported ${totalImported} loans`)
}

async function importLibraryInfo(db: Connection): Promise<void> {
  console.log("Importing library information...")

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
  } else {
    // Create default library info if none exists
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
  }

  console.log("✅ Library information imported")
}

// Helper functions to get IDs
async function getMaterialTypeId(externalId: string): Promise<string | null> {
  const materialType = await prisma.materialType.findUnique({
    where: { externalId },
  })
  return materialType?.id || null
}

async function getCollectionId(externalId: string): Promise<string | null> {
  const collection = await prisma.collection.findUnique({
    where: { externalId },
  })
  return collection?.id || null
}

// Main function
async function main() {
  console.log("Starting comprehensive data import...")
  let db: Connection | null = null

  try {
    // Connect to MySQL database
    db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "espabiblio",
      // Increase timeout for large operations
      connectTimeout: 60000,
    })

    // Import data in the correct order to maintain relationships
    // Each function now has better error handling
    try {
      await importRoles()
      console.log("Roles import completed")
    } catch (error) {
      console.error("Error during roles import:", error)
    }

    try {
      await importUsers(db)
      console.log("Users import completed")
    } catch (error) {
      console.error("Error during users import:", error)
    }

    try {
      await importCategories(db)
      console.log("Categories import completed")
    } catch (error) {
      console.error("Error during categories import:", error)
    }

    try {
      await importCollections(db)
      console.log("Collections import completed")
    } catch (error) {
      console.error("Error during collections import:", error)
    }

    try {
      await importMaterialTypes(db)
      console.log("Material types import completed")
    } catch (error) {
      console.error("Error during material types import:", error)
    }

    try {
      await importSubjects(db)
      console.log("Subjects import completed")
    } catch (error) {
      console.error("Error during subjects import:", error)
    }

    try {
      await importMaterials(db)
      console.log("Materials import completed")
    } catch (error) {
      console.error("Error during materials import:", error)
    }

    try {
      await importLoans(db)
      console.log("Loans import completed")
    } catch (error) {
      console.error("Error during loans import:", error)
    }

    try {
      await importLibraryInfo(db)
      console.log("Library info import completed")
    } catch (error) {
      console.error("Error during library info import:", error)
    }

    console.log("✅ Import completed successfully!")
  } catch (error) {
    console.error("❌ Error during import setup:", error)
  } finally {
    // Ensure connections are closed even if there are errors
    if (db) {
      try {
        await db.end()
      } catch (error) {
        console.error("Error closing database connection:", error)
      }
    }

    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error("Error disconnecting from Prisma:", error)
    }
  }
}

// Run the import
main()
