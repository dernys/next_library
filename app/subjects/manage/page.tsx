"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type Subject = {
  id: string
  name: string
  description: string | null
}

export default function ManageSubjectsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("query", searchQuery)
      }

      const response = await fetch(`/api/subjects?${params.toString()}`)
      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingSubjects"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSubjects()
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add subject")
      }

      toast({
        title: t("app.success"),
        description: t("app.subjectAdded"),
      })

      setIsAddDialogOpen(false)
      setFormData({ name: "", description: "" })
      fetchSubjects()
    } catch (error) {
      console.error("Error adding subject:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorAddingSubject"),
        variant: "destructive",
      })
    }
  }

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSubject) return

    try {
      const response = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update subject")
      }

      toast({
        title: t("app.success"),
        description: t("app.subjectUpdated"),
      })

      setIsEditDialogOpen(false)
      setSelectedSubject(null)
      fetchSubjects()
    } catch (error) {
      console.error("Error updating subject:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingSubject"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return

    try {
      const response = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete subject")
      }

      toast({
        title: t("app.success"),
        description: t("app.subjectDeleted"),
      })

      setIsDeleteDialogOpen(false)
      setSelectedSubject(null)
      fetchSubjects()
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorDeletingSubject"),
        variant: "destructive",
      })
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
        <h1 className="text-3xl font-bold">{t("app.manageSubjects")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} className="hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          {t("app.addSubject")}
        </Button>
      </motion.div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <form onSubmit={handleSearch} className="flex gap-4">
          <Input
            placeholder={t("app.searchSubjects")}
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
                    <TableHead>{t("app.name")}</TableHead>
                    <TableHead>{t("app.description")}</TableHead>
                    <TableHead className="text-right">{t("app.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        {t("app.noSubjects")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subject, index) => (
                      <motion.tr
                        key={subject.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>{subject.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubject(subject)
                                setFormData({
                                  name: subject.name,
                                  description: subject.description || "",
                                })
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
                                setSelectedSubject(subject)
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

      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.addSubject")}</DialogTitle>
            <DialogDescription>{t("app.addSubjectDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubject}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("app.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("app.description")}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t("app.cancel")}
              </Button>
              <Button type="submit" className="hover:bg-primary/90 transition-colors">
                {t("app.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.editSubject")}</DialogTitle>
            <DialogDescription>{t("app.editSubjectDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubject}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("app.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("app.description")}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("app.cancel")}
              </Button>
              <Button type="submit" className="hover:bg-primary/90 transition-colors">
                {t("app.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("app.deleteSubject")}</DialogTitle>
            <DialogDescription>{t("app.deleteSubjectConfirmation")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{t("app.name")}:</strong> {selectedSubject?.name}
            </p>
            {selectedSubject?.description && (
              <p>
                <strong>{t("app.description")}:</strong> {selectedSubject.description}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSubject}
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
