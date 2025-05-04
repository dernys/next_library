"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
// import { useFetchCategories } from "@/hooks/use-fetch-categories"
import { BookPlus, Edit, Trash, FileUp, FileDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MaterialFormDialog } from "@/components/material-form-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Pagination } from "@/components/pagination"

type Material = {
  id: string
  title: string
  subtitle: string | null
  author: string
  isbn: string | null
  description: string | null
  quantity: number
  editionInfo: string | null
  isOpac: boolean
  categoryId: string
  materialTypeId: string | null
  collectionId: string | null
  language: string | null
  publisher: string | null
  country: string | null
  publicationPlace: string | null
  price: number | null
  dimensions: string | null
  pages: number | null
  registrationNumber: string | null
  coverImage: string | null
  category: {
    id: string
    name: string
  }
  materialType?: {
    id: string
    name: string
  }
  collection?: {
    id: string
    name: string
  }
  copies: MaterialCopy[]
  subjects: {
    subject: {
      id: string
      name: string
    }
  }[]
}

type MaterialCopy = {
  id: string
  registrationNumber: string
  status: string
  notes: string | null
}

type Collection = {
  id: string
  name: string
}

type MaterialType = {
  id: string
  name: string
}

type Subject = {
  id: string
  name: string
}

const defaultFormData = {
  id: "",
  title: "",
  subtitle: "",
  author: "",
  isbn: "",
  description: "",
  quantity: 1,
  editionInfo: "",
  isOpac: false,
  // categoryId: "",
  materialTypeId: "",
  collectionId: "",
  language: "",
  publisher: "",
  country: "",
  publicationPlace: "",
  price: 0,
  dimensions: "",
  pages: 0,
  registrationNumber: "",
  coverImage: "",
}

export default function ManageMaterialsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  // const { categories, isLoading: categoriesLoading } = useFetchCategories()

  const [materials, setMaterials] = useState<Material[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [copies, setCopies] = useState<{ registrationNumber: string; notes: string }[]>([])

  const [formData, setFormData] = useState(defaultFormData)

  useEffect(() => {
    fetchMaterials()
    fetchCollections()
    fetchMaterialTypes()
    fetchSubjects()
  }, [currentPage])

  useEffect(() => {
    if (selectedMaterial && isEditDialogOpen) {
      setFormData({
        id: selectedMaterial.id,
        title: selectedMaterial.title,
        subtitle: selectedMaterial.subtitle || "",
        author: selectedMaterial.author,
        isbn: selectedMaterial.isbn || "",
        description: selectedMaterial.description || "",
        quantity: selectedMaterial.quantity,
        editionInfo: selectedMaterial.editionInfo || "",
        isOpac: selectedMaterial.isOpac,
        // categoryId: selectedMaterial.categoryId,
        materialTypeId: selectedMaterial.materialTypeId || "",
        collectionId: selectedMaterial.collectionId || "",
        language: selectedMaterial.language || "",
        publisher: selectedMaterial.publisher || "",
        country: selectedMaterial.country || "",
        publicationPlace: selectedMaterial.publicationPlace || "",
        price: selectedMaterial.price || 0,
        dimensions: selectedMaterial.dimensions || "",
        pages: selectedMaterial.pages || 0,
        registrationNumber: selectedMaterial.registrationNumber || "",
        coverImage: selectedMaterial.coverImage || "",
      })

      // Cargar copias
      if (selectedMaterial.copies) {
        setCopies(
          selectedMaterial.copies.map((copy) => ({
            registrationNumber: copy.registrationNumber,
            notes: copy.notes || "",
          })),
        )
      } else {
        setCopies([])
      }

      // Cargar materias
      if (selectedMaterial.subjects) {
        setSelectedSubjects(selectedMaterial.subjects.map((s) => s.subject))
      } else {
        setSelectedSubjects([])
      }
    }
  }, [selectedMaterial, isEditDialogOpen])

  // Limpiar el formulario cuando se abre el diálogo de añadir
  useEffect(() => {
    if (isAddDialogOpen) {
      setFormData(defaultFormData)
      setCopies([])
      setSelectedSubjects([])
    }
  }, [isAddDialogOpen])

  async function fetchMaterials() {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", "10")

      if (searchQuery) {
        params.append("query", searchQuery)
      }

      const response = await fetch(`/api/materials?${params.toString()}`)
      const data = await response.json()
      setMaterials(data.materials)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingMaterials"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchCollections() {
    try {
      const response = await fetch("/api/collections")
      const data = await response.json()
      setCollections(data)
    } catch (error) {
      console.error("Error fetching collections:", error)
    }
  }

  async function fetchMaterialTypes() {
    try {
      const response = await fetch("/api/material-types")
      const data = await response.json()
      setMaterialTypes(data)
    } catch (error) {
      console.error("Error fetching material types:", error)
    }
  }

  async function fetchSubjects() {
    try {
      const response = await fetch("/api/subjects")
      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchMaterials()
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()

    try {
      const materialData = {
        ...formData,
        copies: copies,
        subjects: selectedSubjects,
      }

      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materialData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add material")
      }

      toast({
        title: t("app.success"),
        description: t("app.materialAdded"),
      })

      setIsAddDialogOpen(false)
      setFormData(defaultFormData)
      setCopies([])
      setSelectedSubjects([])
      fetchMaterials()
    } catch (error) {
      console.error("Error adding material:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorAddingMaterial"),
        variant: "destructive",
      })
    }
  }

  const handleEditMaterial = async (e) => {
    e.preventDefault()

    if (!selectedMaterial) return

    try {
      const materialData = {
        ...formData,
        copies: copies,
        subjects: selectedSubjects,
      }

      const response = await fetch(`/api/materials/${selectedMaterial.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materialData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update material")
      }

      toast({
        title: t("app.success"),
        description: t("app.materialUpdated"),
      })

      setIsEditDialogOpen(false)
      setSelectedMaterial(null)
      fetchMaterials()
    } catch (error) {
      console.error("Error updating material:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingMaterial"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return

    try {
      const response = await fetch(`/api/materials/${selectedMaterial.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete material")
      }

      toast({
        title: t("app.success"),
        description: t("app.materialDeleted"),
      })

      setIsDeleteDialogOpen(false)
      setSelectedMaterial(null)
      fetchMaterials()
    } catch (error) {
      console.error("Error deleting material:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorDeletingMaterial"),
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImportMaterials = async (e) => {
    e.preventDefault()
    if (!importFile) return

    try {
      const formData = new FormData()
      formData.append("file", importFile)

      const response = await fetch("/api/import/materials", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import materials")
      }

      const data = await response.json()

      toast({
        title: t("app.success"),
        description: t("app.materialsImported", { count: data.count }),
      })

      setIsImportDialogOpen(false)
      setImportFile(null)
      fetchMaterials()
    } catch (error) {
      console.error("Error importing materials:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorImportingMaterials"),
        variant: "destructive",
      })
    }
  }

  const handleExportMaterials = async () => {
    try {
      setIsExporting(true)
      const response = await fetch("/api/export/materials", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to export materials")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `materials-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: t("app.success"),
        description: t("app.materialsExported"),
      })
    } catch (error) {
      console.error("Error exporting materials:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorExportingMaterials"),
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container py-8">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">{t("app.manageMaterials")}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsImportDialogOpen(true)}
            variant="outline"
            className="hover:bg-primary/10 transition-colors"
          >
            <FileUp className="mr-2 h-4 w-4" />
            {t("app.importMaterials")}
          </Button>
          <Button
            onClick={handleExportMaterials}
            variant="outline"
            disabled={isExporting}
            className="hover:bg-primary/10 transition-colors"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? t("app.exporting") : t("app.exportMaterials")}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="hover:bg-primary/90 transition-colors">
            <BookPlus className="mr-2 h-4 w-4" />
            {t("app.addMaterial")}
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <form onSubmit={handleSearch} className="flex gap-4">
          <Input
            placeholder={t("app.searchMaterials")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md hover:border-primary focus:border-primary transition-colors"
          />
          <Button type="submit" className="hover:bg-primary/90 transition-colors">
            <Search className="mr-2 h-4 w-4" />
            {t("app.search")}
          </Button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("app.title")}</TableHead>
                    <TableHead>{t("app.author")}</TableHead>
                    <TableHead>{t("app.collection")}</TableHead>
                    <TableHead>{t("app.type")}</TableHead>
                    <TableHead className="text-center">{t("app.copies")}</TableHead>
                    <TableHead className="text-right">{t("app.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {t("app.loading")}
                      </TableCell>
                    </TableRow>
                  ) : materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {t("app.noMaterials")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    materials.map((material, index) => (
                      <motion.tr
                        key={material.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {material.title}
                          {material.subtitle && (
                            <span className="block text-sm text-muted-foreground">{material.subtitle}</span>
                          )}
                        </TableCell>
                        <TableCell>{material.author}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-secondary px-2 py-1 text-xs">{material.collection?.name}</span>
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
                        <TableCell className="text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              material.copies && material.copies.length > 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            }`}
                          >
                            {material.copies ? material.copies.length : 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMaterial(material)
                                setIsEditDialogOpen(true)
                              }}
                              className="hover:bg-primary/20 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">{t("app.edit")}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMaterial(material)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="hover:bg-destructive/20 transition-colors"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">{t("app.delete")}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Material Form Dialog for Add */}
      <MaterialFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        title={t("app.addMaterial")}
        description={t("app.addMaterialDescription")}
        onSubmit={handleAddMaterial}
        formData={formData}
        setFormData={setFormData}
        // categories={categories}
        materialTypes={materialTypes}
        collections={collections}
        subjects={subjects}
        selectedSubjects={selectedSubjects}
        setSelectedSubjects={setSelectedSubjects}
        copies={copies}
        setCopies={setCopies}
        isLoading={isLoading}
        mode="add"
      />

      {/* Material Form Dialog for Edit */}
      <MaterialFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title={t("app.editMaterial")}
        description={t("app.editMaterialDescription")}
        onSubmit={handleEditMaterial}
        formData={formData}
        setFormData={setFormData}
        // categories={categories}
        materialTypes={materialTypes}
        collections={collections}
        subjects={subjects}
        selectedSubjects={selectedSubjects}
        setSelectedSubjects={setSelectedSubjects}
        copies={copies}
        setCopies={setCopies}
        isLoading={isLoading}
        mode="edit"
      />

      {/* Delete Material Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.deleteMaterial")}</DialogTitle>
            <DialogDescription>{t("app.deleteMaterialConfirmation")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{t("app.title")}:</strong> {selectedMaterial?.title}
            </p>
            <p>
              <strong>{t("app.author")}:</strong> {selectedMaterial?.author}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMaterial}
              className="hover:bg-destructive/90 transition-colors"
            >
              {t("app.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Materials Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.importMaterials")}</DialogTitle>
            <DialogDescription>{t("app.importMaterialsDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportMaterials}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="import-file">{t("app.selectFile")}</Label>
                <Input id="import-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} required />
                <p className="text-sm text-muted-foreground">{t("app.importFileFormat")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                {t("app.cancel")}
              </Button>
              <Button type="submit" disabled={!importFile} className="hover:bg-primary/90 transition-colors">
                {t("app.import")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
