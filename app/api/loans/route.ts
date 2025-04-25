import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const query = searchParams.get("query")

    const skip = (page - 1) * limit

    // Construir el filtro base
    const where: any = {}

    // Filtrar por rol de usuario
    if (session.user.role === "member") {
      where.userId = session.user.id
    }

    // Filtrar por estado
    if (status && status !== "all") {
      where.status = status
    }

    // Filtrar por fechas - corregido para usar correctamente las fechas
    if (startDate) {
      where.loanDate = {
        ...where.loanDate,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      const endDateObj = new Date(endDate)
      // Ajustar al final del día para incluir todo el día seleccionado
      endDateObj.setHours(23, 59, 59, 999)

      where.loanDate = {
        ...where.loanDate,
        lte: endDateObj,
      }
    }

    // Filtrar por búsqueda
    if (query) {
      where.OR = [
        {
          material: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { author: { contains: query, mode: "insensitive" } },
              { isbn: { contains: query, mode: "insensitive" } },
            ],
          },
        },
        {
          user: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        },
        { guestName: { contains: query, mode: "insensitive" } },
        { guestEmail: { contains: query, mode: "insensitive" } },
      ]
    }

    // Contar el total de préstamos
    const total = await prisma.loan.count({ where })

    // Obtener los préstamos paginados
    const loans = await prisma.loan.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            identityCard: true,
            address: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
          },
        },
        copy: {
          select: {
            id: true,
            registrationNumber: true,
          },
        },
      },
      orderBy: {
        loanDate: "desc",
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      loans,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json({ error: "Error fetching loans" }, { status: 500 })
  }
}


export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { materialId, userId, dueDate } = await request.json()

    // Validate required fields
    if (!materialId || !dueDate) {
      return NextResponse.json(
        { error: "Material ID and due date are required" },
        { status: 400 }
      )
    }

    // Check if material exists and has available copies
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        copies: {
          where: { status: "available" },
        },
      },
    })

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      )
    }

    if (material.quantity <= 0) {
      return NextResponse.json(
        { error: "No available copies of this material" },
        { status: 400 }
      )
    }

    // Get the first available copy
    const availableCopy = material.copies[0]

    if (!availableCopy) {
      return NextResponse.json(
        { error: "No available copies of this material" },
        { status: 400 }
      )
    }

    // Create the loan and update material quantity in a transaction
    const [loan] = await prisma.$transaction([
      // Create the loan
      prisma.loan.create({
        data: {
          userId: userId || null,
          materialId,
          copyId: availableCopy.id,
          dueDate: new Date(dueDate),
          status: "requested", // Default status as per schema
        },
        include: {
          material: true,
          user: true,
          copy: true,
        },
      }),
      // Update the copy status to loaned
      prisma.copy.update({
        where: { id: availableCopy.id },
        data: { status: "loaned" },
      }),
      // Decrease material quantity
      prisma.material.update({
        where: { id: materialId },
        data: {
          quantity: {
            decrement: 1
          }
        }
      })
    ])

    return NextResponse.json(loan)
  } catch (error) {
    console.error("Error creating loan:", error)
    return NextResponse.json(
      { error: "Error creating loan" },
      { status: 500 }
    )
  }
}
