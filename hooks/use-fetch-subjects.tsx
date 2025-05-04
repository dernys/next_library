"use client"

import { useState, useEffect } from "react"

export type Subject = {
  id: string
  name: string
}

export function useFetchSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubjects() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/subjects")

        if (!response.ok) {
          throw new Error("Failed to fetch subjects")
        }

        const data = await response.json()
        setSubjects(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching subjects:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [])

  return { subjects, isLoading, error }
}
