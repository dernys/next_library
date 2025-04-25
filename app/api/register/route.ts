import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, lastName, email, password, phone, identityCard, address } = body

    // Verificar si el correo ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Obtener el rol de miembro
    const memberRole = await prisma.role.findFirst({
      where: { name: "member" },
    })

    if (!memberRole) {
      return NextResponse.json({ error: "Member role not found" }, { status: 500 })
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name,
        lastName,
        email,
        password: hashedPassword,
        phone,
        identityCard,
        address,
        roleId: memberRole.id,
      },
    })

    // Eliminar la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json({ error: "Error registering user" }, { status: 500 })
  }
}
