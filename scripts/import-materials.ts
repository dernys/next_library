import { PrismaClient } from '@prisma/client'
import mysql, { RowDataPacket, Connection } from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

// Mapeo de estados de copia
const COPY_STATUS: Record<string, string> = {
  AVL: 'available',
  LOA: 'loaned',
  RES: 'reserved',
  DAM: 'damaged',
}

async function syncLookups(db: Connection) {
  const [mts] = await db.query<RowDataPacket[]>(`SELECT code, description FROM material_type_dm`)
  for (const r of mts) {
    const id = String(r.code)
    await prisma.materialType.upsert({
      where: { id },
      create: { id, name: r.description, description: r.description },
      update: { name: r.description, description: r.description },
    })
  }

  const [cols] = await db.query<RowDataPacket[]>(`SELECT code, description FROM collection_dm`)
  for (const r of cols) {
    const id = String(r.code)
    await prisma.collection.upsert({
      where: { id },
      create: { id, name: r.description, description: r.description },
      update: { name: r.description, description: r.description },
    })
  }
}

async function importMaterials(db: Connection) {
  const defaultCat = await prisma.category.findFirst()
  if (!defaultCat) throw new Error('Debe existir al menos una categoría en Prisma')

  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT
      bibid,
      title,
      title_remainder AS subtitle,
      responsibility_stmt AS responsibility,
      author,
      call_nmbr1,
      call_nmbr2,
      call_nmbr3,
      opac_flg AS opac,
      has_cover AS cover,
      material_cd AS mcd,
      collection_cd AS ccd
    FROM biblio
  `)

  for (const m of rows) {
    const bibid = m.bibid as number
    const matId = String(bibid)

    let title = (m.title as string) ?? ''
    const subtitle = (m.subtitle as string) ?? null
    const responsibility = (m.responsibility as string) ?? null
    let author = (m.author as string) ?? 'Unknown'
    const entry1 = (m.call_nmbr1 as string) ?? null
    const entry2 = (m.call_nmbr2 as string) ?? null
    const entry3 = (m.call_nmbr3 as string) ?? null

    const [fields] = await db.query<RowDataPacket[]>(
      `SELECT tag, subfield_cd AS sub, field_data AS data FROM biblio_field WHERE bibid = ?`,
      [bibid]
    )

    let isbn: string | null = null
    let editionInfo: string | null = null
    let volume: string | null = null
    let pubPlace: string | null = null
    let publisher: string | null = null
    let publicationDate: string | null = null
    let language: string | null = null
    let country: string | null = null
    let summary: string | null = null
    let pages: number | null = null
    let otherPhys: string | null = null
    let dimensions: string | null = null
    let price: number | null = null
    const subjects: string[] = []

    for (const f of fields) {
      const tag = String(f.tag).padStart(3, '0')
      const sub = (f.sub as string).toLowerCase()
      const data = (f.data as string).trim()
      switch (tag) {
        case '020':
          if (sub === 'a') isbn = data
          break
        case '245':
          if (sub === 'a' && !title) title = data
          if (sub === 'b' && !subtitle) title += `: ${data}`
          if (sub === 'c' && !summary) summary = data
          break
        case '100': case '110':
          if (sub === 'a' && !author) author = data
          break
        case '650':
          if (sub === 'a') subjects.push(data)
          break
        case '250':
          if (sub === 'a') editionInfo = data
          break
        case '800':
          if (sub === 'v') volume = data
          break
        case '257':
          if (sub === 'a') country = data
          break
        case '260':
          if (sub === 'a') pubPlace = data
          if (sub === 'b') publisher = data
          if (sub === 'c') publicationDate = data
          break
        case '240':
          if (sub === 'l') language = data
          break
        case '520':
          if (sub === 'a' && !summary) summary = data
          break
        case '300':
          if (sub === 'a') pages = parseInt(data) || null
          if (sub === 'b') otherPhys = data
          if (sub === 'c') dimensions = data
          break
        case '541':
          if (sub === 'h') price = parseFloat(data.replace(/[^0-9.]/g, '')) || null
          break
      }
    }

    const [copies] = await db.query<RowDataPacket[]>(
      `SELECT barcode_nmbr AS regNo, create_dt AS createdAt, copy_desc AS notes, status_cd FROM biblio_copy WHERE bibid = ?`,
      [bibid]
    )
    const quantity = copies.length
    const editionFull = [editionInfo, volume].filter(Boolean).join(' ') || null

    await prisma.material.upsert({
      where: { id: matId },
      create: {
        id: matId,
        title,
        subtitle,
        author,
        isbn,
        description: summary ?? responsibility,
        quantity,
        editionInfo: editionFull,
        isOpac: m.opac === 'Y',
        opac: m.opac as string,
        categoryId: defaultCat.id,
        materialTypeId: String(m.mcd),
        collectionId: String(m.ccd),
        language,
        publisher,
        country,
        publicationPlace: pubPlace,
        price,
        dimensions,
        pages,
        registrationNumber: matId,
        entry1,
        entry2,
        entry3,
        coverImage: m.cover === 'Y' ? 'true' : 'false',
      },
      update: {
        title,
        subtitle,
        author,
        isbn,
        description: summary ?? responsibility,
        quantity,
        editionInfo: editionFull,
        isOpac: m.opac === 'Y',
        opac: m.opac as string,
        materialTypeId: String(m.mcd),
        collectionId: String(m.ccd),
        language,
        publisher,
        country,
        publicationPlace: pubPlace,
        price,
        dimensions,
        pages,
        registrationNumber: matId,
        entry1,
        entry2,
        entry3,
        coverImage: m.cover === 'Y' ? 'true' : 'false',
      }
    })

    await prisma.materialToSubject.deleteMany({ where: { materialId: matId } })
    for (const name of subjects) {
      const trimmed = name.trim()
      const subj = await prisma.subject.upsert({
        where: { name: trimmed },
        create: { name: trimmed, description: trimmed },
        update: {}
      })
      await prisma.materialToSubject.create({
        data: { materialId: matId, subjectId: subj.id }
      })
    }

    for (const c of copies) {
      await prisma.copy.upsert({
        where: { registrationNumber: c.regNo },
        create: {
          registrationNumber: c.regNo,
          status: COPY_STATUS[c.status_cd],
          materialId: matId,
          acquisitionDate: new Date(c.createdAt as string),
          notes: c.notes || null,
        },
        update: {
          status: COPY_STATUS[c.status_cd],
          acquisitionDate: new Date(c.createdAt as string),
          notes: c.notes || null,
        }
      })
    }
  }

  console.log('✅ Importación completa a PRODUCCIÓN.')
}

async function main() {
  console.log('▶️ Iniciando importación PRODUCCIÓN...')
  const db = await mysql.createConnection(process.env.ESPABIBLIO_URL!)
  await prisma.$connect()
  try {
    await syncLookups(db)
    await importMaterials(db)
  } catch (e) {
    console.error('❌ Importación fallida:', e)
    process.exit(1)
  } finally {
    await db.end()
    await prisma.$disconnect()
  }
}

main()
