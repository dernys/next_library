import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const librarianRole = await prisma.role.upsert({
    where: { name: "librarian" },
    update: {},
    create: {
      name: "librarian",
      description: "Administrador de la biblioteca",
    },
  })

  const memberRole = await prisma.role.upsert({
    where: { name: "member" },
    update: {},
    create: {
      name: "member",
      description: "Miembro de la biblioteca",
    },
  })

  console.log({ librarianRole, memberRole })

  // Create librarian user
  const librarianPassword = await bcrypt.hash("librarian123", 10)
  const librarian = await prisma.user.upsert({
    where: { email: "librarian@example.com" },
    update: {},
    create: {
      name: "Bibliotecario Principal",
      email: "librarian@example.com",
      password: librarianPassword,
      roleId: librarianRole.id,
    },
  })

  console.log({ librarian })

  // Create categories
  const categories = [
    {
      name: "Ficción",
      description: "Novelas, cuentos y otras obras de ficción",
    },
    {
      name: "No ficción",
      description: "Biografías, historia, ciencia y otros temas de no ficción",
    },
    {
      name: "Infantil",
      description: "Libros para niños y jóvenes",
    },
    {
      name: "Académico",
      description: "Libros de texto y material educativo",
    },
    {
      name: "Referencia",
      description: "Diccionarios, enciclopedias y otros materiales de referencia",
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
