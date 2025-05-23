import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const query = searchParams.get("query")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status && status !== "all") {
      where.status = status
    }

    if (userId) {
      where.userId = userId
    }

    if (query) {
      where.OR = [
        {
          material: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            OR: [
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
        {
          guestName: {
            contains: query,
            mode: "insensitive",
          },
        },
      ]
    }

    if (startDate) {
      where.loanDate = {
        ...where.loanDate,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.loanDate = {
        ...where.loanDate,
        lte: new Date(endDate),
      }
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          material: true,
          user: true,
          copy: true,
        },
        orderBy: {
          loanDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      loans,
      pagination: {
        total,
        pages: totalPages,
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 })
  }
}
