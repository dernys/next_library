"use client"

import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Printer, Book } from "lucide-react"
import { motion } from "framer-motion"

type PrintMaterialProps = {
  material: {
    id: string
    title: string
    subtitle?: string
    author: string
    isbn?: string
    description?: string
    editionInfo?: string
    isOpac: boolean
    category: {
      name: string
    }
    materialType?: {
      name: string
    }
    collection?: {
      name: string
    }
    language?: string
    publisher?: string
    country?: string
    publicationPlace?: string
    price?: number
    dimensions?: string
    pages?: number
    registrationNumber?: string
    coverImage?: string
    copies?: {
      id: string
      registrationNumber: string
      status: string
      notes?: string
    }[]
    subjects?: {
      subject: {
        id: string
        name: string
      }
    }[]
  }
}

export function PrintMaterial({ material }: PrintMaterialProps) {
  const { t } = useLanguage()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Material-${material.id}`,
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve()
        }, 500)
      })
    },
  })

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 flex justify-end"
      >
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          {t("app.print")}
        </Button>
      </motion.div>

      <div ref={printRef} className="p-6 bg-white dark:bg-gray-950 min-h-[600px]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{t("app.materialDetails")}</h1>
            <p className="text-muted-foreground">{t("app.printPreview")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1 flex justify-center">
              <div className="w-48 h-64 bg-muted rounded-md overflow-hidden">
                {material.coverImage ? (
                  <img
                    src={material.coverImage || "/placeholder.svg"}
                    alt={material.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=256&width=192"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Book className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("app.basicInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.title")}:</span>
                    <span>{material.title}</span>
                  </div>
                  {material.subtitle && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t("app.subtitle")}:</span>
                      <span>{material.subtitle}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.author")}:</span>
                    <span>{material.author}</span>
                  </div>
                  {material.isbn && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t("app.isbn")}:</span>
                      <span>{material.isbn}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.category")}:</span>
                    <span>{material.category.name}</span>
                  </div>
                  {material.materialType && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t("app.materialType")}:</span>
                      <span>{material.materialType.name}</span>
                    </div>
                  )}
                  {material.collection && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t("app.collection")}:</span>
                      <span>{material.collection.name}</span>
                    </div>
                  )}
                  {material.editionInfo && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t("app.editionInfo")}:</span>
                      <span>{material.editionInfo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.isOpac")}:</span>
                    <span>{material.isOpac ? t("app.yes") : t("app.no")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {material.description && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t("app.description")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{material.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("app.detailedInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {material.language && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.language")}:</span>
                    <span>{material.language}</span>
                  </div>
                )}
                {material.publisher && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.publisher")}:</span>
                    <span>{material.publisher}</span>
                  </div>
                )}
                {material.country && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.country")}:</span>
                    <span>{material.country}</span>
                  </div>
                )}
                {material.publicationPlace && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.publicationPlace")}:</span>
                    <span>{material.publicationPlace}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("app.catalogInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {material.price !== undefined && material.price !== null && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.price")}:</span>
                    <span>{material.price.toFixed(2)}</span>
                  </div>
                )}
                {material.dimensions && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.dimensions")}:</span>
                    <span>{material.dimensions}</span>
                  </div>
                )}
                {material.pages !== undefined && material.pages !== null && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.pages")}:</span>
                    <span>{material.pages}</span>
                  </div>
                )}
                {material.registrationNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("app.registrationNumber")}:</span>
                    <span>{material.registrationNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {material.copies && material.copies.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t("app.copies")}</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t("app.registrationNumber")}</th>
                      <th className="text-left py-2">{t("app.status")}</th>
                      <th className="text-left py-2">{t("app.notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.copies.map((copy) => (
                      <tr key={copy.id} className="border-b">
                        <td className="py-2">{copy.registrationNumber}</td>
                        <td className="py-2">{t(`app.${copy.status}`)}</td>
                        <td className="py-2">{copy.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {material.subjects && material.subjects.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t("app.subjects")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {material.subjects.map((subjectItem) => (
                    <span
                      key={subjectItem.subject.id}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {subjectItem.subject.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>
              {t("app.printDate")}: {new Date().toLocaleDateString()}
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} - {t("app.librarySystem")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
