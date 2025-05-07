"use client"

import { useState, useEffect } from "react"

export type Collection = {
  id: string
  name: string
  description?: string | null
}

export function useFetchCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCollections() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/collections")

        if (!response.ok) {
          throw new Error("Failed to fetch collections")
        }

        const data = await response.json()
        setCollections(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching collections:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollections()
  }, [])

  return { collections, isLoading, error }
}
