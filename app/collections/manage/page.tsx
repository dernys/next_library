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
import { Edit, FolderPlus, Trash } from "lucide-react"

type Collection = {
  id: string
  name: string
  description: string | null
}

export default function ManageCollectionsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchCollections()
  }, [])

  useEffect(() => {
    if (selectedCollection && isEditDialogOpen) {
      setFormData({
        name: selectedCollection.name,
        description: selectedCollection.description || "",
      })
    }
  }, [selectedCollection, isEditDialogOpen])

  // Limpiar el formulario cuando se abre el diálogo de añadir
  useEffect(() => {
    if (isAddDialogOpen) {
      resetForm()
    }
  }, [isAddDialogOpen])

  async function fetchCollections() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/collections")
      const data = await response.json()
      setCollections(data)
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingCollections"),
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

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add collection")
      }

      toast({
        title: t("app.success"),
        description: t("app.collectionAdded"),
      })

      setIsAddDialogOpen(false)
      resetForm()
      fetchCollections()
    } catch (error) {
      console.error("Error adding collection:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorAddingCollection"),
        variant: "destructive",
      })
    }
  }

  const handleEditCollection = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCollection) return

    try {
      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update collection")
      }

      toast({
        title: t("app.success"),
        description: t("app.collectionUpdated"),
      })

      setIsEditDialogOpen(false)
      setSelectedCollection(null)
      fetchCollections()
    } catch (error) {
      console.error("Error updating collection:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingCollection"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return

    try {
      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete collection")
      }

      toast({
        title: t("app.success"),
        description: t("app.collectionDeleted"),
      })

      setIsDeleteDialogOpen(false)
      setSelectedCollection(null)
      fetchCollections()
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorDeletingCollection"),
        variant: "destructive",
      })
    }
  }

  const handleAddClick = () => {
    setFormData({
      name: "",
      description: "",
    })
    setIsAddDialogOpen(true)
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("app.manageCollections")}</h1>
        <Button onClick={() => handleAddClick()} className="hover:bg-primary/90 transition-colors">
          <FolderPlus className="mr-2 h-4 w-4" />
          {t("app.addCollection")}
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
                ) : collections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      {t("app.noCollections")}
                    </TableCell>
                  </TableRow>
                ) : (
                  collections.map((collection) => (
                    <TableRow key={collection.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{collection.name}</TableCell>
                      <TableCell>{collection.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCollection(collection)
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
                              setSelectedCollection(collection)
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

      {/* Add Collection Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.addCollection")}</DialogTitle>
            <DialogDescription>{t("app.addCollectionDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCollection}>
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

      {/* Edit Collection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("app.editCollection")}</DialogTitle>
            <DialogDescription>{t("app.editCollectionDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCollection}>
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

      {/* Delete Collection Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.deleteCollection")}</DialogTitle>
            <DialogDescription>{t("app.deleteCollectionConfirmation")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{t("app.name")}:</strong> {selectedCollection?.name}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCollection}
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
