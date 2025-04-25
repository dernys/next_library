import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  // Solo los bibliotecarios pueden aprobar préstamos
  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verificar si el préstamo existe
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        copy: true,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    // Verificar si el préstamo está en estado "requested"
    if (loan.status !== "requested") {
      return NextResponse.json({ error: "Loan is not in requested state" }, { status: 400 })
    }

    // Actualizar el préstamo a "active"
    const updatedLoan = await prisma.$transaction(async (tx) => {
      // Si hay una copia asociada, actualizar su estado
      if (loan.copyId) {
        await tx.copy.update({
          where: { id: loan.copyId },
          data: { status: "loaned" },
        })
      }

      // Actualizar el préstamo
      return await tx.loan.update({
        where: { id },
        data: {
          status: "active",
        },
        include: {
          material: true,
          user: true,
          copy: true,
        },
      })
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error("Error approving loan:", error)
    return NextResponse.json({ error: "Error approving loan" }, { status: 500 })
  }
}
