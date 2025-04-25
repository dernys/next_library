import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const loan = await prisma.loan.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    return NextResponse.json(loan)
  } catch (error) {
    console.error("Error fetching loan:", error)
    return NextResponse.json({ error: "Error fetching loan" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status, dueDate, returnDate } = body

    const loan = await prisma.loan.findUnique({
      where: { id: id },
      include: { material: true },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    // If returning a book, increase the material quantity
    if (status === "returned" && loan.status !== "returned") {
      await prisma.$transaction(async (tx) => {
        // Update loan
        await tx.loan.update({
          where: { id: id },
          data: {
            status,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            returnDate: returnDate ? new Date(returnDate) : new Date(),
          },
        })

        // Increase material quantity
        await tx.material.update({
          where: { id: loan.materialId },
          data: { quantity: { increment: 1 } },
        })
      })
    } else {
      // Just update the loan
      await prisma.loan.update({
        where: { id: id },
        data: {
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          returnDate: returnDate ? new Date(returnDate) : undefined,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating loan:", error)
    return NextResponse.json({ error: "Error updating loan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: id },
      include: { material: true },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    // If loan is active, increase material quantity when deleting
    if (loan.status === "active") {
      await prisma.$transaction(async (tx) => {
        // Delete loan
        await tx.loan.delete({
          where: { id: id },
        })

        // Increase material quantity
        await tx.material.update({
          where: { id: loan.materialId },
          data: { quantity: { increment: 1 } },
        })
      })
    } else {
      // Just delete the loan
      await prisma.loan.delete({
        where: { id: id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting loan:", error)
    return NextResponse.json({ error: "Error deleting loan" }, { status: 500 })
  }
}
