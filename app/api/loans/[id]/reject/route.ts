import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const loanId = params.id

    // Get the loan with its related data
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        material: true,
        copy: true,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (loan.status !== "requested") {
      return NextResponse.json({ error: "Only requested loans can be rejected" }, { status: 400 })
    }

    // Update loan status to rejected in a transaction
    const [updatedLoan] = await prisma.$transaction([
      // Update loan status
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: "rejected",
          returnDate: new Date(),
        },
        include: {
          material: true,
          user: true,
          copy: true,
        },
      }),
      // Update copy status back to available
      prisma.copy.update({
        where: { id: loan.copyId! },
        data: { status: "available" },
      }),
      // Increase material quantity back
      prisma.material.update({
        where: { id: loan.materialId },
        data: {
          quantity: {
            increment: 1,
          },
        },
      }),
    ])

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error("Error rejecting loan:", error)
    return NextResponse.json({ error: "Error rejecting loan" }, { status: 500 })
  }
}
