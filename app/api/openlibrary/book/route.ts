import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Key parameter is required" }, { status: 400 })
    }

    const response = await fetch(`https://openlibrary.org${key}.json`, {
      cache: "no-store", // Evitar caché
    })

    if (!response.ok) {
      throw new Error(`OpenLibrary API responded with status: ${response.status}`)
    }

    const book = await response.json()

    // Obtener información de autores si están disponibles
    if (book.authors && Array.isArray(book.authors)) {
      const authorPromises = book.authors.map(async (author: any) => {
        if (author.key) {
          const authorResponse = await fetch(`https://openlibrary.org${author.key}.json`, {
            cache: "no-store", // Evitar caché
          })
          if (authorResponse.ok) {
            return await authorResponse.json()
          }
        }
        return { name: "Unknown Author" }
      })

      book.authors = await Promise.all(authorPromises)
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error("Error fetching book details:", error)
    return NextResponse.json({ error: "Failed to fetch book details" }, { status: 500 })
  }
}
