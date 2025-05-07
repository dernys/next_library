
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function PATCH(
   request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: loanId } = await params // Resolver `params` con `await`

    if (!loanId) {
      return NextResponse.json({ error: "Loan ID is required" }, { status: 400 })
    }

    // Obtener el préstamo con sus datos relacionados
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: true,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (loan.status !== "active") {
      return NextResponse.json(
        { error: "Only active loans can be returned" },
        { status: 400 }
      )
    }

    // Actualizar el préstamo y la copia en una transacción
    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: "returned",
          returnDate: new Date(),
        },
      }),
      prisma.copy.update({
        where: { id: loan.copyId! },
        data: { status: "available" },
      }),
    ])

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error("Error returning loan:", error)
    return NextResponse.json(
      { error: "Error returning loan" },
      { status: 500 }
    )
  }
}
