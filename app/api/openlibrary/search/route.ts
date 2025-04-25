import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`, {
      cache: "no-store", // Evitar caché
    })

    if (!response.ok) {
      throw new Error(`OpenLibrary API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching OpenLibrary:", error)
    return NextResponse.json({ error: "Failed to search OpenLibrary" }, { status: 500 })
  }
}
