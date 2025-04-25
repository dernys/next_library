import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Solo los bibliotecarios pueden ver cualquier usuario
  // Los miembros solo pueden ver su propio perfil
  if (session.user.role !== "librarian" && session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // No devolver la contraseña
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Solo los bibliotecarios pueden actualizar cualquier usuario
  // Los miembros solo pueden actualizar su propio perfil
  if (session.user.role !== "librarian" && session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, lastName, email, password, roleId, phone, identityCard, address } = body

    // Verificar si el correo electrónico ya está en uso por otro usuario
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser && existingUser.id !== id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Preparar los datos para actualizar
    const updateData: any = {
      name,
      lastName,
      email,
      phone,
      identityCard,
      address,
    }

    // Solo los bibliotecarios pueden cambiar el rol
    if (session.user.role === "librarian" && roleId) {
      // Verificar si el rol existe
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 })
      }

      updateData.roleId = roleId
    }

    // Actualizar la contraseña solo si se proporciona
    if (password) {
      updateData.password = await hash(password, 10)
    }

    // Actualizar el usuario
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error updating user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const { id } = params

  if (!session || session.user.role !== "librarian") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Eliminar el usuario
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 })
  }
}
