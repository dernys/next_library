import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id: loanId } = params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: true,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (loan.status !== "requested") {
      return NextResponse.json(
        { error: "Loan is not in requested state" },
        { status: 400 }
      )
    }

    // Aprobar el préstamo
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: "active",
      },
      include: {
        copy: true,
      },
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error("Error approving loan:", error)
    return NextResponse.json(
      { error: "Error approving loan" },
      { status: 500 }
    )
  }
}
