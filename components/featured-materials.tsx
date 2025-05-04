"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Book, ChevronRight } from "lucide-react"

type Material = {
  id: string
  title: string
  author: string
  category: {
    id: string
    name: string
  }
  coverImage?: string
}

export function FeaturedMaterials() {
  const { t } = useLanguage()
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedMaterials() {
      try {
        const response = await fetch("/api/materials?limit=4")
        const data = await response.json()
        setMaterials(data.materials)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching featured materials:", error)
        setIsLoading(false)
      }
    }

    fetchFeaturedMaterials()
  }, [])

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("app.featured")}</h2>
        <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
          <Link href="/materials">
            {t("app.viewAll")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))
          : materials.map((material) => (
              <Card
                key={material.id}
                className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 duration-300"
              >
                <CardHeader className="p-4">
                  {material.coverImage ? (
                    <div className="w-full h-40 overflow-hidden rounded-md mb-2">
                      <img
                        src={material.coverImage || "/placeholder.svg"}
                        alt={material.title}
                        className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-muted flex items-center justify-center rounded-md mb-2">
                      <Book className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <CardTitle className="line-clamp-1">{material.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground mb-2">{material.author}</p>
                  <p className="text-xs bg-secondary inline-block px-2 py-1 rounded-full">{material.category?.name}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full hover:bg-primary/90 transition-colors">
                    <Link href={`/materials/${material.id}`}>
                      <Book className="mr-2 h-4 w-4" />
                      {t("app.viewDetails")}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}
