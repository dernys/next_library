import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Obtener el último número de registro
    const lastCopy = await prisma.copy.findFirst({
      orderBy: {
        registrationNumber: "desc",
      },
    })

    let nextNumber = "1"
    if (lastCopy) {
      // Extraer el número del último registro
      const lastNumber = lastCopy.registrationNumber
      const prefix = lastNumber.match(/^[A-Za-z]+/)?.[0] || ""
      const number = Number.parseInt(lastNumber.replace(prefix, ""), 10)
      
      if (!isNaN(number)) {
        nextNumber = `${prefix}${(number + 1).toString().padStart(lastNumber.length - prefix.length, "0")}`
      }
    }

    return NextResponse.json({ nextRegistrationNumber: nextNumber })
  } catch (error) {
    console.error("Error generating next registration number:", error)
    return NextResponse.json(
      { error: "Error generating next registration number" },
      { status: 500 }
    )
  }
}
