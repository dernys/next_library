import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request, context: { params: { id: string } }) {
  const { params } = context
  const { id } = params

  try {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        category: true,
        materialType: true,
        collection: true,
        copies: true,
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    })

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error fetching material:", error)
    return NextResponse.json({ error: "Error fetching material" }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { params } = context
  const id = await params?.id

  if (!session || (session.user && (session.user as any).role !== "librarian")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!id) {
    return NextResponse.json({ error: "Material ID is required" }, { status: 400 })
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

    // Validar que el número de registro es único entre materiales (excepto el propio)
    if (registrationNumber) {
      const existingMaterial = await prisma.material.findFirst({
        where: {
          registrationNumber,
          NOT: { id },
        },
      })
      if (existingMaterial) {
        return NextResponse.json({ error: "El número de registro ya existe para otro material." }, { status: 400 })
      }
    }

    // Actualizar el material
    const material = await prisma.material.update({
      where: { id },
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

    // Copias: deben coincidir con quantity
    if (!copies || !Array.isArray(copies) || copies.length !== quantity) {
      return NextResponse.json(
        { error: "La cantidad de copias debe coincidir con la cantidad indicada." },
        { status: 400 },
      )
    }

    // Validar unicidad de registrationNumber de copias
    for (const copy of copies) {
      const existingCopy = await prisma.copy.findFirst({
        where: {
          registrationNumber: copy.registrationNumber,
          NOT: { materialId: id },
        },
      })
      if (existingCopy) {
        return NextResponse.json(
          { error: `El número de registro de copia ${copy.registrationNumber} ya existe.` },
          { status: 400 },
        )
      }
    }

    // Obtener copias existentes
    const existingCopies = await prisma.copy.findMany({ where: { materialId: id } })
    const existingCopiesMap = new Map(existingCopies.map((copy) => [copy.registrationNumber, copy]))
    const newRegistrationNumbers = new Set(
      copies.map((copy: { registrationNumber: string }) => copy.registrationNumber),
    )

    // Eliminar copias que ya no existen
    for (const existingCopy of existingCopies) {
      if (!newRegistrationNumbers.has(existingCopy.registrationNumber)) {
        await prisma.copy.delete({ where: { id: existingCopy.id } })
      }
    }

    // Crear o actualizar copias para igualar la cantidad
    for (const copy of copies) {
      const existingCopy = existingCopiesMap.get(copy.registrationNumber)
      if (existingCopy) {
        await prisma.copy.update({
          where: { id: existingCopy.id },
          data: { notes: copy.notes },
        })
      } else {
        await prisma.copy.create({
          data: {
            registrationNumber: copy.registrationNumber,
            notes: copy.notes,
            materialId: id,
            status: "available",
          },
        })
      }
    }

    // Actualizar materias
    await prisma.materialToSubject.deleteMany({ where: { materialId: id } })
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
              materialId: id,
              subjectId,
            },
          })
        }),
      )
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error updating material:", error)
    return NextResponse.json({ error: "Error updating material" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { params } = context
  const { id } = params

  if (!session || (session.user && (session.user as any).role !== "librarian")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Eliminar el material (las relaciones se eliminarán automáticamente por las restricciones de clave foránea)
    await prisma.material.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json({ error: "Error deleting material" }, { status: 500 })
  }
}
