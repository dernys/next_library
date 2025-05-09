import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import mysql, { RowDataPacket } from 'mysql2/promise';

dotenv.config();
const prisma = new PrismaClient();

// Modo de importación: 'full' limpia tablas antes de cargar, 'incremental' solo agrega nuevos
const IMPORT_MODE = process.env.IMPORT_MODE || 'full';

async function main() {
  const mysqlConn = await mysql.createConnection(process.env.MYSQL_URL!);
  try {
    console.log(`🔄 Modo de importación: ${IMPORT_MODE}`);

    // 0) Roles básicos
    console.log('📦 Importando Roles...');
    for (const name of ['Member', 'Guest']) {
      await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    }

    // Si modo full, limpiar tablas dependientes
    if (IMPORT_MODE === 'full') {
      console.log('🧹 Limpiando datos existentes...');
      await prisma.loan.deleteMany({});
      await prisma.copy.deleteMany({});
      await prisma.materialToSubject.deleteMany({});
      await prisma.material.deleteMany({});
      await prisma.user.deleteMany({ where: { role: { name: 'Member' } } });
    }

    // 1) Collections
    console.log('📂 Importando Collections...');
    const [collections] = await mysqlConn.execute<RowDataPacket[]>(
      'SELECT code, description FROM collection_dm'
    );
    for (const row of collections) {
      await prisma.collection.upsert({
        where: { id: String(row.code) },
        update: { name: row.description, description: row.description },
        create: { id: String(row.code), name: row.description, description: row.description }
      });
    }

    // 2) Material Types
    console.log('📚 Importando MaterialTypes...');
    const [types] = await mysqlConn.execute<RowDataPacket[]>(
      'SELECT code, description FROM material_type_dm'
    );
    for (const row of types) {
      await prisma.materialType.upsert({
        where: { id: String(row.code) },
        update: { name: row.description },
        create: { id: String(row.code), name: row.description }
      });
    }

    // 3) Materials y Subjects en batches
    console.log('📖 Importando Materials y Subjects...');
    const BATCH = 500;
    for (let offset = 0; ; offset += BATCH) {
      const [materials] = await mysqlConn.execute<RowDataPacket[]>(
        'SELECT bibid, collection_cd, material_cd, call_nmbr1, call_nmbr2, call_nmbr3 FROM biblio LIMIT ? OFFSET ?',
        [BATCH, offset]
      );
      if (!materials.length) break;

      for (const item of materials) {
        const id = String(item.bibid);
        // Extraer USMarc
        const [fields] = await mysqlConn.execute<RowDataPacket[]>(
          'SELECT tag, subfield_cd AS sf, field_data AS val FROM biblio_field WHERE bibid = ?',
          [item.bibid]
        );
        const um: Record<string, Record<string, string>> = {};
        for (const f of fields) {
          um[f.tag] = um[f.tag] || {};
          um[f.tag][f.sf] = f.val;
        }

        // Categoría
        const classification = um['080']?.['a'] ?? 'Uncategorized';
        const category = await prisma.category.upsert({
          where: { name: classification },
          update: {}, create: { name: classification }
        });

                // Subjects
        const [subrows] = await mysqlConn.execute<RowDataPacket[]>(
          "SELECT field_data AS name FROM biblio_field WHERE bibid = ? AND tag = '650' AND subfield_cd = 'a' ORDER BY fieldid LIMIT 5",
          [item.bibid]
        );
        const subjConnect: { subjectId: string }[] = [];
        for (const sr of subrows) {
          const name = sr.name;
          let subj = await prisma.subject.findFirst({ where: { name } });
          if (!subj) {
            subj = await prisma.subject.create({ data: { name } });
          }
          subjConnect.push({ subjectId: subj.id });
        }

        // Crear/Actualizar Material
        await prisma.material.upsert({
          where: { id },
          update: {},
          create: {
            id,
            title: um['245']?.['a'] ?? '',
            subtitle: um['245']?.['b'] ?? null,
            author: um['100']?.['a'] ?? um['110']?.['a'] ?? '',
            isbn: um['020']?.['a'] ?? null,
            description: um['520']?.['a'] ?? null,
            quantity: 1, // se actualiza luego
            editionInfo: um['250']?.['a'] ?? null,
            isOpac: um['900']?.['a'] === '1',
            category: { connect: { id: category.id } },
            materialType: { connect: { id: String(item.material_cd) } },
            collection: { connect: { id: String(item.collection_cd) } },
            language: um['240']?.['l'] ?? null,
            publisher: um['260']?.['b'] ?? null,
            country: um['257']?.['a'] ?? null,
            publicationPlace: um['260']?.['a'] ?? null,
            price: um['541']?.['h'] ? parseFloat(um['541']['h']) : null,
            dimensions: um['300']?.['c'] ?? null,
            pages: um['300']?.['a'] ? parseInt(um['300']['a'], 10) : null,
            registrationNumber: um['022']?.['a'] ?? null,
            opac: um['999']?.['a'] ?? null,
            entry1: item.call_nmbr1 ?? null,
            entry2: item.call_nmbr2 ?? null,
            entry3: item.call_nmbr3 ?? null,
            subjects: { create: subjConnect }
          }
        });
      }
    }

    // 4) Copies y Loans en batches
    console.log('🔖 Importando Copies y Loans...');
    for (let offset = 0; ; offset += BATCH) {
      const [copies] = await mysqlConn.execute<RowDataPacket[]>(
        'SELECT copyid, bibid, create_dt, status_begin_dt, due_back_dt, copy_desc, barcode_nmbr, status_cd, mbrid FROM biblio_copy LIMIT ? OFFSET ?',
        [BATCH, offset]
      );
      if (!copies.length) break;

      const countMap: Record<string, number> = {};
      for (const c of copies) {
        const regNum = c.barcode_nmbr;
        // Upsert Copy
                // Upsert Copy: uses registrationNumber as unique key
        await prisma.copy.upsert({
          where: { registrationNumber: regNum },
          update: { status: c.status_cd },
          create: {
            // id auto-generated to avoid conflicts
            registrationNumber: regNum,
            status: c.status_cd,
            acquisitionDate: c.status_begin_dt,
            notes: c.copy_desc ?? null,
            material: { connect: { id: String(c.bibid) } }
          }
        });
        // Loan
        if (c.mbrid) {
          const user = await prisma.user.findUnique({ where: { id: String(c.mbrid) } });
          if (user) {
            await prisma.loan.upsert({
              where: { id: `${c.copyid}-${c.mbrid}` },
              update: { returnDate: c.due_back_dt ?? null, status: c.due_back_dt ? 'returned' : 'active' },
              create: {
                id: `${c.copyid}-${c.mbrid}`,
                user: { connect: { id: user.id } },
                copy: { connect: { registrationNumber: regNum } },
                material: { connect: { id: String(c.bibid) } },
                loanDate: c.create_dt,
                dueDate: c.due_back_dt,
                returnDate: c.due_back_dt ?? null,
                status: c.due_back_dt ? 'returned' : 'active'
              }
            });
          }
        }
        // Contar copias por material
        countMap[c.bibid] = (countMap[c.bibid] || 0) + 1;
      }
      // Actualizar cantidades
      for (const [matId, cnt] of Object.entries(countMap)) {
        await prisma.material.update({
          where: { id: String(matId) },
          data: { quantity: cnt + 1 }
        });
      }
    }

    console.log('☑️ Importación finalizada.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mysqlConn.end();
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
