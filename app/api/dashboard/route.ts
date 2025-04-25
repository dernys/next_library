import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Función auxiliar para convertir BigInt a Number
const bigIntToNumber = (value: any) => {
  if (typeof value === "bigint") {
    return Number(value)
  }
  if (typeof value === "object" && value !== null) {
    Object.keys(value).forEach((key) => {
      value[key] = bigIntToNumber(value[key])
    })
  }
  return value
}

export async function GET() {
  const session = await getServerSession(authOptions)

  // Permitir acceso al dashboard incluso sin autenticación
  // if (!session || session.user.role !== "librarian") {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  try {
    // Get total counts
    const [
      totalMaterials,
      totalUsers,
      totalLoans,
      activeLoans,
      overdueLoans,
      totalCollections,
      materialsPerCategory,
      recentLoans,
      popularMaterials,
    ] = await Promise.all([
      prisma.material.count(),
      prisma.user.count(),
      prisma.loan.count(),
      prisma.loan.count({
        where: { status: "active" },
      }),
      prisma.loan.count({
        where: {
          status: "active",
          dueDate: { lt: new Date() },
        },
      }),
      prisma.collection.count(),
      prisma.category.findMany({
        include: {
          _count: {
            select: { materials: true },
          },
        },
      }),
      prisma.loan.findMany({
        take: 5,
        orderBy: { loanDate: "desc" },
        include: {
          user: { select: { name: true } },
          material: { select: { title: true } },
        },
      }),
      prisma.$queryRaw`
        SELECT m.id, m.title, COUNT(l.id) as "loanCount"
        FROM "Material" m
        JOIN "Loan" l ON m.id = l."materialId"
        GROUP BY m.id, m.title
        ORDER BY "loanCount" DESC
        LIMIT 5
      `,
    ])

    // Format category data
    const categoriesData = materialsPerCategory.map((category) => ({
      id: category.id,
      name: category.name,
      count: category._count.materials,
    }))

    // Convertir BigInt a Number para evitar errores de serialización
    const serializedPopularMaterials = bigIntToNumber(popularMaterials)

    return NextResponse.json({
      totalMaterials,
      totalUsers,
      totalLoans,
      activeLoans,
      overdueLoans,
      totalCollections,
      categoriesData,
      recentLoans,
      popularMaterials: serializedPopularMaterials,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Error fetching dashboard data" }, { status: 500 })
  }
}
