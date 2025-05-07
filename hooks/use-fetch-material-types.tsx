"use client"

import { useState, useEffect } from "react"

export type MaterialType = {
  id: string
  name: string
}

export function useFetchMaterialTypes() {
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMaterialTypes() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/material-types")

        if (!response.ok) {
          throw new Error("Failed to fetch material types")
        }

        const data = await response.json()
        setMaterialTypes(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching material types:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterialTypes()
  }, [])

  return { materialTypes, isLoading, error }
}
