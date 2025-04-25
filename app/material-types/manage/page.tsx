"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Edit, FilePlus, Trash } from "lucide-react"

type MaterialType = {
  id: string
  name: string
  description: string | null
}

export default function ManageMaterialTypesPage() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchMaterialTypes()
  }, [])

  useEffect(() => {
    if (selectedMaterialType && isEditDialogOpen) {
      setFormData({
        name: selectedMaterialType.name,
        description: selectedMaterialType.description || "",
      })
    }
  }, [selectedMaterialType, isEditDialogOpen])

  // Limpiar el formulario cuando se abre el diálogo de añadir
  useEffect(() => {
    if (isAddDialogOpen) {
      resetForm()
    }
  }, [isAddDialogOpen])

  async function fetchMaterialTypes() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/material-types")
      const data = await response.json()
      setMaterialTypes(data)
    } catch (error) {
      console.error("Error fetching material types:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingMaterialTypes"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    })
  }

  const handleAddMaterialType = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/material-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add material type")
      }

      toast({
        title: t("app.success"),
        description: t("app.materialTypeAdded"),
      })

      setIsAddDialogOpen(false)
      resetForm()
      fetchMaterialTypes()
    } catch (error) {
      console.error("Error adding material type:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorAddingMaterialType"),
        variant: "destructive",
      })
    }
  }

  const handleEditMaterialType = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMaterialType) return

    try {
      const response = await fetch(`/api/material-types/${selectedMaterialType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update material type")
      }

      toast({
        title: t("app.success"),
        description: t("app.materialTypeUpdated"),
      })

      setIsEditDialogOpen(false)
      setSelectedMaterialType(null)
      fetchMaterialTypes()
    } catch (error) {
      console.error("Error updating material type:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingMaterialType"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteMaterialType = async () => {
    if (!selectedMaterialType) return

    try {
      const response = await fetch(`/api/material-types/${selectedMaterialType.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete material type")
      }

      toast({
        title: t("app.success"),
        description: t("app.materialTypeDeleted"),
      })

      setIsDeleteDialogOpen(false)
      setSelectedMaterialType(null)
      fetchMaterialTypes()
    } catch (error) {
      console.error("Error deleting material type:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorDeletingMaterialType"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("app.manageMaterialTypes")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} className="hover:bg-primary/90 transition-colors">
          <FilePlus className="mr-2 h-4 w-4" />
          {t("app.addMaterialType")}
        </Button>
      </div>

      <Card className="hover:shadow-md transition-all duration-300">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("app.name")}</TableHead>
                  <TableHead>{t("app.description")}</TableHead>
                  <TableHead className="text-right">{t("app.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      {t("app.loading")}
                    </TableCell>
                  </TableRow>
                ) : materialTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      {t("app.noMaterialTypes")}
                    </TableCell>
                  </TableRow>
                ) : (
                  materialTypes.map((materialType) => (
                    <TableRow key={materialType.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{materialType.name}</TableCell>
                      <TableCell>{materialType.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMaterialType(materialType)
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
                              setSelectedMaterialType(materialType)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="hover:bg-destructive/20 transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">{t("app.delete")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Material Type Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.addMaterialType")}</DialogTitle>
            <DialogDescription>{t("app.addMaterialTypeDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMaterialType}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t("app.name")}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right">
                  {t("app.description")}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="hover:bg-primary/90 transition-colors">
                {t("app.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Material Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.editMaterialType")}</DialogTitle>
            <DialogDescription>{t("app.editMaterialTypeDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMaterialType}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  {t("app.name")}
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  {t("app.description")}
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="hover:bg-primary/90 transition-colors">
                {t("app.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Material Type Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.deleteMaterialType")}</DialogTitle>
            <DialogDescription>{t("app.deleteMaterialTypeConfirmation")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{t("app.name")}:</strong> {selectedMaterialType?.name}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMaterialType}
              className="hover:bg-destructive/90 transition-colors"
            >
              {t("app.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
