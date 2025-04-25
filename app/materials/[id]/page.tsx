"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Book, BookOpen } from "lucide-react"
import Link from "next/link"

type Material = {
  id: string
  title: string
  author: string
  isbn: string | null
  description: string | null
  quantity: number
  category: {
    id: string
    name: string
  }
}

export default function MaterialDetailPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [material, setMaterial] = useState<Material | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMaterial(params.id as string)
    }
  }, [params.id])

  async function fetchMaterial(id: string) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/materials/${id}`)

      if (!response.ok) {
        throw new Error("Material not found")
      }

      const data = await response.json()
      setMaterial(data)
    } catch (error) {
      console.error("Error fetching material:", error)
      toast({
        title: t("app.error"),
        description: t("app.materialNotFound"),
        variant: "destructive",
      })
      router.push("/materials")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestLoan = () => {
    router.push(`/loans/request?materialId=${material?.id}`)
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/materials">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("app.backToMaterials")}
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : material ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("app.materialDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Book className="h-12 w-12" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold">{material.title}</h2>
                  <p className="text-sm text-muted-foreground">{material.author}</p>
                  <div className="mt-2">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs">{material.category.name}</span>
                  </div>
                  <div className="mt-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        material.quantity > 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}
                    >
                      {material.quantity > 0 ? `${t("app.available")}: ${material.quantity}` : t("app.unavailable")}
                    </span>
                  </div>
                  {session?.user.role === "member" && material.quantity > 0 && (
                    <Button className="mt-4 w-full" onClick={handleRequestLoan}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t("app.requestLoan")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("app.about")}</CardTitle>
              </CardHeader>
              <CardContent>
                {material.isbn && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">ISBN</h3>
                    <p>{material.isbn}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t("app.description")}</h3>
                  <p className="mt-2 whitespace-pre-line">{material.description || t("app.noDescription")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Book className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">{t("app.materialNotFound")}</h2>
          <p className="text-muted-foreground">{t("app.materialNotFoundDescription")}</p>
        </div>
      )}
    </div>
  )
}
