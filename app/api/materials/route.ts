import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""
  const collection = searchParams.get("collection") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit

  try {
    const where = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } },
      ],
      ...(collection ? { collectionId: collection } : {}),
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          materialType: true,
          collection: true,
          copies: true,
          subjects: {
            include: {
              subject: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          title: "asc",
        },
      }),
      prisma.material.count({ where }),
    ])

    return NextResponse.json({
      materials,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json({ error: "Error fetching materials" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      subtitle,
      author,
      isbn,
      description,
      quantity,
      editionInfo,
      isOpac,
      materialTypeId,
      collectionId,
      language,
      publisher,
      country,
      publicationPlace,
      price,
      dimensions,
      pages,
      registrationNumber,
      opac,
      entry1,
      entry2,
      entry3,
      coverImage,
      copies,
      subjects,
    } = body

    // Validar que el número de registro es único entre materiales y copias
    if (registrationNumber) {
      // Verifica en materiales
      const existingMaterial = await prisma.material.findFirst({
        where: { registrationNumber },
      })
      // Verifica en copias
      const existingCopy = await prisma.copy.findFirst({
        where: { registrationNumber },
      })
      if (existingMaterial || existingCopy) {
        return NextResponse.json(
          { error: "El número de registro ya existe en otro material o copia." },
          { status: 400 },
        )
      }
    }

    // Crear el material
    const material = await prisma.material.create({
      data: {
        title,
        subtitle,
        author,
        isbn,
        description,
        quantity,
        editionInfo,
        isOpac: isOpac || false,
        materialTypeId: materialTypeId || null,
        collectionId: collectionId || null,
        language,
        publisher,
        country,
        publicationPlace,
        price,
        dimensions,
        pages,
        registrationNumber,
        opac,
        entry1,
        entry2,
        entry3,
        coverImage,
      },
    })

    // Crear las copias: deben coincidir en cantidad con quantity
    if (copies && Array.isArray(copies)) {
      if (copies.length !== quantity) {
        return NextResponse.json(
          { error: "La cantidad de copias debe coincidir con la cantidad indicada." },
          { status: 400 },
        )
      }
      for (const copy of copies) {
        // Validar que registrationNumber de la copia sea único en materiales y copias
        const copyExistsInMaterial = await prisma.material.findFirst({
          where: { registrationNumber: copy.registrationNumber },
        })
        const copyExistsInCopy = await prisma.copy.findFirst({ where: { registrationNumber: copy.registrationNumber } })
        if (copyExistsInMaterial || copyExistsInCopy) {
          return NextResponse.json(
            { error: `El número de registro ${copy.registrationNumber} ya existe en otro material o copia.` },
            { status: 400 },
          )
        }
        await prisma.copy.create({
          data: {
            registrationNumber: copy.registrationNumber,
            notes: copy.notes,
            materialId: material.id,
            status: "available",
          },
        })
      }
    } else if (quantity > 0) {
      return NextResponse.json({ error: "Debe ingresar los datos de las copias." }, { status: 400 })
    }

    // Asociar materias
    if (subjects && Array.isArray(subjects)) {
      await Promise.all(
        subjects.map(async (subject: { id: string; name: string }) => {
          let subjectId = subject.id

          // Verificar si el subject existe
          const existingSubject = await prisma.subject.findUnique({
            where: { id: subjectId },
          })

          // Si no existe, crearlo
          if (!existingSubject) {
            const newSubject = await prisma.subject.create({
              data: { id: subject.id, name: subject.name },
            })
            subjectId = newSubject.id
          }

          // Vincular el subject al material
          await prisma.materialToSubject.create({
            data: {
              materialId: material.id,
              subjectId,
            },
          })
        }),
      )
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error creating material:", error)
    return NextResponse.json({ error: "Error creating material" }, { status: 500 })
  }
}
