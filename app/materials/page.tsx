"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchMaterials } from "@/components/search-materials"
import { Book, BookPlus } from "lucide-react"

type Material = {
  id: string
  title: string
  author: string
  isbn: string | null
  quantity: number
  category: {
    id: string
    name: string
  }
  materialType?: {
    id: string
    name: string
  }
  language?: string
  publisher?: string
}

type PaginationData = {
  total: number
  pages: number
  page: number
  limit: number
}

export default function MaterialsPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  const [materials, setMaterials] = useState<Material[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  })
  const [isLoading, setIsLoading] = useState(true)

  const query = searchParams.get("query") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const collection = searchParams.get("collection") || ""

  useEffect(() => {
    async function fetchMaterials() {
      try {
        setIsLoading(true)

        const params = new URLSearchParams()
        if (query) params.append("query", query)
        if (collection) params.append("collection", collection) // Usar colección en lugar de categoría

        params.append("page", page.toString())
        params.append("limit", "10")

        const response = await fetch(`/api/materials?${params.toString()}`)
        const data = await response.json()

        setMaterials(data.materials)
        setPagination(data.pagination)
      } catch (error) {
        console.error("Error fetching materials:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterials()
  }, [query, collection, page])

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("app.materials")}</h1>
        {session?.user.role === "librarian" && (
          <Button asChild className="hover:bg-primary/90 transition-colors">
            <Link href="/materials/manage">
              <BookPlus className="mr-2 h-4 w-4" />
              {t("app.addMaterial")}
            </Link>
          </Button>
        )}
      </div>

      <SearchMaterials />

      <Card className="mt-6 hover:shadow-md transition-all duration-300">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("app.title")}</TableHead>
                  <TableHead>{t("app.author")}</TableHead>
                  <TableHead>{t("app.collection")}</TableHead>
                  <TableHead>{t("app.type")}</TableHead>
                  <TableHead>{t("app.language")}</TableHead>
                  <TableHead>{t("app.publisher")}</TableHead>
                  <TableHead className="text-center">{t("app.quantity")}</TableHead>
                  {/* <TableHead className="text-right">{t("app.actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full max-w-[120px]" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-8 mx-auto" />
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <Skeleton className="h-9 w-20 ml-auto" />
                      </TableCell> */}
                    </TableRow>
                  ))
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Book className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">{t("app.noResults")}</p>
                        <p className="text-sm text-muted-foreground">{t("app.tryDifferentSearch")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>{material.author}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs">{material.category?.name}</span>
                      </TableCell>
                      <TableCell>
                        {material.materialType ? (
                          <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 text-xs">
                            {material.materialType.name}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{material.language || "-"}</TableCell>
                      <TableCell>{material.publisher || "-"}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            material.quantity > 0
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          }`}
                        >
                          {material.quantity}
                        </span>
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                        >
                          <Link href={`/materials/${material.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("app.view")}
                          </Link>
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!isLoading && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`/materials?query=${query}&category=${category}&page=${page > 1 ? page - 1 : 1}`}
                  className="hover:bg-primary/10 transition-colors"
                />
              </PaginationItem>

              {Array.from({ length: pagination.pages }).map((_, i) => {
                const pageNumber = i + 1

                // Show first page, last page, and pages around current page
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.pages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href={`/materials?query=${query}&category=${category}&page=${pageNumber}`}
                        isActive={pageNumber === page}
                        className={pageNumber === page ? "" : "hover:bg-primary/10 transition-colors"}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }

                // Show ellipsis for gaps
                if (
                  (pageNumber === 2 && page > 3) ||
                  (pageNumber === pagination.pages - 1 && page < pagination.pages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                return null
              })}

              <PaginationItem>
                <PaginationNext
                  href={`/materials?query=${query}&category=${category}&page=${
                    page < pagination.pages ? page + 1 : pagination.pages
                  }`}
                  className="hover:bg-primary/10 transition-colors"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
