import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const query = searchParams.get("query")
    const role = searchParams.get("role")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (role) {
      where.role = {
        name: role,
      }
    }

    if (query) {
      where.OR = [
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
        {
          identityCard: {
            contains: query,
            mode: "insensitive",
          },
        },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
        },
        orderBy: {
          name: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      users,
      pagination: {
        total,
        pages: totalPages,
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
