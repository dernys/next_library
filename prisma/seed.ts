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

  // Create member user
  const memberPassword = await bcrypt.hash("member123", 10)
  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      name: "Miembro Ejemplo",
      email: "member@example.com",
      password: memberPassword,
      roleId: memberRole.id,
    },
  })

  console.log({ librarian, member })

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

  // Get categories for reference
  const ficcionCategory = await prisma.category.findUnique({
    where: { name: "Ficción" },
  })
  const noFiccionCategory = await prisma.category.findUnique({
    where: { name: "No ficción" },
  })
  const infantilCategory = await prisma.category.findUnique({
    where: { name: "Infantil" },
  })
  const academicoCategory = await prisma.category.findUnique({
    where: { name: "Académico" },
  })

  // Create materials
  const materials = [
    {
      title: "Cien años de soledad",
      author: "Gabriel García Márquez",
      isbn: "9780307474728",
      description: "La obra cumbre del realismo mágico latinoamericano",
      quantity: 3,
      categoryId: ficcionCategory?.id || "",
    },
    {
      title: "El principito",
      author: "Antoine de Saint-Exupéry",
      isbn: "9780156012195",
      description: "Un clásico de la literatura infantil que también es apreciado por adultos",
      quantity: 5,
      categoryId: infantilCategory?.id || "",
    },
    {
      title: "Breve historia del tiempo",
      author: "Stephen Hawking",
      isbn: "9780553380163",
      description: "Una explicación accesible de conceptos complejos de física y cosmología",
      quantity: 2,
      categoryId: noFiccionCategory?.id || "",
    },
    {
      title: "Introducción a los algoritmos",
      author: "Thomas H. Cormen",
      isbn: "9780262033848",
      description: "Un libro de texto fundamental sobre algoritmos y estructuras de datos",
      quantity: 1,
      categoryId: academicoCategory?.id || "",
    },
    {
      title: "Don Quijote de la Mancha",
      author: "Miguel de Cervantes",
      isbn: "9788420412146",
      description: "La obra más importante de la literatura española",
      quantity: 4,
      categoryId: ficcionCategory?.id || "",
    },
  ]

  for (const material of materials) {
    await prisma.material.upsert({
      where: { isbn: material.isbn },
      update: {},
      create: material,
    })
  }

  // Create some loans
  const quijote = await prisma.material.findFirst({
    where: { title: { contains: "Quijote" } },
  })

  const principito = await prisma.material.findFirst({
    where: { title: { contains: "principito" } },
  })

  if (quijote && principito) {
    // Active loan
    await prisma.loan.create({
      data: {
        userId: member.id,
        materialId: quijote.id,
        loanDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "active",
      },
    })

    // Returned loan
    await prisma.loan.create({
      data: {
        userId: member.id,
        materialId: principito.id,
        loanDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
        returnDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        status: "returned",
      },
    })
  }

  console.log("Seed data created successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
