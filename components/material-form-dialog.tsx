"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Book, Plus, Minus, Tag, Search, BookPlus, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type MaterialType = {
  id: string
  name: string
}

type Collection = {
  id: string
  name: string
}

type Subject = {
  id: string
  name: string
}

type OpenLibraryBook = {
  key: string
  title: string
  subtitle?: string
  authors?: { name: string }[]
  covers?: number[]
  isbn_13?: string[]
  isbn_10?: string[]
  number_of_pages?: number
  publishers?: string[]
  publish_places?: string[]
  publish_date?: string
  subjects?: { name: string }[]
  description?: { value?: string }
}

type MaterialFormData = {
  id: string
  title: string
  subtitle: string
  author: string
  isbn: string
  description: string
  quantity: number
  editionInfo: string
  isOpac: boolean
  materialTypeId: string
  collectionId: string
  language: string
  publisher: string
  //Número de entrada
  entry1: string
  entry2: string
  entry3: string
  country: string
  publicationPlace: string
  price: number
  dimensions: string
  pages: number
  registrationNumber: string
  coverImage: string
  [key: string]: any
}

type MaterialFormDialogProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  onSubmit: (e: React.FormEvent) => Promise<void>
  formData: MaterialFormData
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>
  materialTypes: MaterialType[]
  collections: Collection[]
  subjects: Subject[]
  selectedSubjects: Subject[]
  setSelectedSubjects: React.Dispatch<React.SetStateAction<Subject[]>>
  copies: { registrationNumber: string; notes: string }[]
  setCopies: React.Dispatch<React.SetStateAction<{ registrationNumber: string; notes: string }[]>>
  isLoading: boolean
  mode: "add" | "edit"
}

export function MaterialFormDialog({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  formData,
  setFormData,
  materialTypes,
  collections,
  subjects,
  selectedSubjects,
  setSelectedSubjects,
  copies,
  setCopies,
  isLoading,
  mode,
}: MaterialFormDialogProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubjectPopoverOpen, setIsSubjectPopoverOpen] = useState(false)
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("")
  const [nextRegistrationNumber, setNextRegistrationNumber] = useState("")
  const [isOpenLibrarySearchOpen, setIsOpenLibrarySearchOpen] = useState(false)
  const [openLibraryQuery, setOpenLibraryQuery] = useState("")
  const [openLibraryResults, setOpenLibraryResults] = useState<OpenLibraryBook[]>([])
  const [isSearchingOpenLibrary, setIsSearchingOpenLibrary] = useState(false)
  const [isImportingBook, setIsImportingBook] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && mode === "add") {
      fetchNextRegistrationNumber()
    }
  }, [isOpen, mode])

  // Validación en tiempo real
  useEffect(() => {
    const newErrors: Record<string, string> = {}

    // Solo validar si el formulario ha sido tocado
    if (formData.title !== "") {
      if (!formData.title.trim()) {
        newErrors.title = t("app.titleRequired")
      }
    }
    if (formData.author !== "") {
      if (!formData.author.trim()) {
        newErrors.author = t("app.authorRequired")
      }
    }
    if (formData.collectionId !== "") {
      if (!formData.collectionId) {
        newErrors.collectionId = t("app.collectionRequired")
      }
    }
    if (formData.quantity !== 0) {
      if (formData.quantity < 0) {
        newErrors.quantity = t("app.quantityMustBePositive")
      }
    }
    if (formData.price !== 0) {
      if (formData.price < 0) {
        newErrors.price = t("app.priceMustBePositive")
      }
    }
    if (formData.pages !== 0) {
      if (formData.pages < 0) {
        newErrors.pages = t("app.pagesMustBePositive")
      }
    }

    setErrors(newErrors)
  }, [formData, t])

  const isValid = Object.keys(errors).length === 0

  async function fetchNextRegistrationNumber() {
    try {
      const response = await fetch("/api/materials/next-registration-number")
      const data = await response.json()
      setNextRegistrationNumber(data.nextRegistrationNumber)
    } catch (error) {
      console.error("Error fetching next registration number:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingRegistrationNumber"),
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "none" ? "" : value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleAddCopy = async () => {
    try {
      const response = await fetch("/api/materials/next-registration-number")
      const data = await response.json()
      const nextNumber = data.nextRegistrationNumber

      setCopies([...copies, { registrationNumber: nextNumber, notes: "" }])
    } catch (error) {
      console.error("Error fetching next registration number:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorGeneratingRegistrationNumber"),
        variant: "destructive",
      })
    }
  }

  const handleRemoveCopy = (index: number) => {
    setCopies(copies.filter((_, i) => i !== index))
  }

  const handleCopyChange = (index: number, field: string, value: string) => {
    const newCopies = [...copies]
    newCopies[index] = { ...newCopies[index], [field]: value }
    setCopies(newCopies)
  }

  const handleAddSubject = (subject: Subject) => {
    if (!selectedSubjects.find((s) => s.id === subject.id)) {
      setSelectedSubjects([...selectedSubjects, subject])
    }
    setIsSubjectPopoverOpen(false)
    setSubjectSearchQuery("")
  }

  const handleRemoveSubject = (subjectId: string) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subjectId))
  }

  const handleSearchOpenLibrary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!openLibraryQuery.trim()) return

    try {
      setIsSearchingOpenLibrary(true)
      const response = await fetch(`/api/open-library/search?query=${encodeURIComponent(openLibraryQuery)}`)
      const data = await response.json()
      setOpenLibraryResults(data)
    } catch (error) {
      console.error("Error searching OpenLibrary:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorSearchingOpenLibrary"),
        variant: "destructive",
      })
    } finally {
      setIsSearchingOpenLibrary(false)
    }
  }

  const handleSelectOpenLibraryBook = async (key: string) => {
    try {
      setIsImportingBook(true)
      const response = await fetch(`/api/open-library/book/${key}`)
      const data = await response.json()

      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        subtitle: data.subtitle || prev.subtitle,
        author: data.authors?.[0]?.name || prev.author,
        isbn: data.isbn_13?.[0] || data.isbn_10?.[0] || prev.isbn,
        description: data.description?.value || prev.description,
        publisher: data.publishers?.[0] || prev.publisher,
        publicationPlace: data.publish_places?.[0] || prev.publicationPlace,
        pages: data.number_of_pages || prev.pages,
      }))

      // Agregar materias si existen
      if (data.subjects) {
        const newSubjects = data.subjects
          .map((s: { name: string }) => subjects.find((sub) => sub.name.toLowerCase() === s.name.toLowerCase()))
          .filter(Boolean) as Subject[]
        setSelectedSubjects([
          ...selectedSubjects,
          ...newSubjects.filter((s) => !selectedSubjects.find((sub) => sub.id === s.id)),
        ])
      }

      setIsOpenLibrarySearchOpen(false)
      toast({
        title: t("app.success"),
        description: t("app.bookImported"),
      })
    } catch (error) {
      console.error("Error importing book:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorImportingBook"),
        variant: "destructive",
      })
    } finally {
      setIsImportingBook(false)
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      toast({
        title: t("app.error"),
        description: t("app.pleaseFixErrors"),
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmit(e)
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">{t("app.basicInfo")}</TabsTrigger>
              <TabsTrigger value="details">{t("app.details")}</TabsTrigger>
              <TabsTrigger value="copies">{t("app.copies")}</TabsTrigger>
              <TabsTrigger value="subjects">{t("app.subjects")}</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "basic" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="title">{t("app.title")} *</Label>
                          <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={errors.title ? "border-red-500" : ""}
                          />
                          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subtitle">{t("app.subtitle")}</Label>
                          <Input id="subtitle" name="subtitle" value={formData.subtitle} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="entry1">{t("app.entry1")}</Label>
                          <Input id="entry1" name="entry1" value={formData.entry1} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="entry2">{t("app.entry2")}</Label>
                          <Input id="entry2" name="entry2" value={formData.entry2} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="entry3">{t("app.entry3")}</Label>
                          <Input id="entry3" name="entry3" value={formData.entry3} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="author">{t("app.author")} *</Label>
                          <Input
                            id="author"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            className={errors.author ? "border-red-500" : ""}
                          />
                          {errors.author && <p className="text-sm text-red-500">{errors.author}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="isbn">{t("app.isbn")}</Label>
                          <div className="flex gap-2">
                            <Input id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsOpenLibrarySearchOpen(true)}
                              className="whitespace-nowrap"
                            >
                              <BookPlus className="mr-2 h-4 w-4" />
                              {t("app.searchOpenLibrary")}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="collectionId">{t("app.collection")} *</Label>
                          <Select
                            value={formData.collectionId || "none"}
                            onValueChange={(value) => handleSelectChange("collectionId", value)}
                          >
                            <SelectTrigger className={errors.collectionId ? "border-red-500" : ""}>
                              <SelectValue placeholder={t("app.selectCollection")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t("app.selectCollection")}</SelectItem>
                              {collections.map((collection) => (
                                <SelectItem key={collection.id} value={collection.id}>
                                  {collection.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.collectionId && <p className="text-sm text-red-500">{errors.collectionId}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="materialTypeId">{t("app.type")}</Label>
                          <Select
                            value={formData.materialTypeId || "none"}
                            onValueChange={(value) => handleSelectChange("materialTypeId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("app.selectType")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t("app.selectType")}</SelectItem>
                              {materialTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">{t("app.quantity")} *</Label>
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            min="0"
                            value={formData.quantity}
                            onChange={handleNumberChange}
                            className={errors.quantity ? "border-red-500" : ""}
                          />
                          {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="isOpac">{t("app.isOpac")}</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isOpac"
                              checked={formData.isOpac}
                              onCheckedChange={(checked) => handleCheckboxChange("isOpac", checked as boolean)}
                            />
                            <Label htmlFor="isOpac" className="text-sm font-normal">
                              {t("app.isOpacDescription")}
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">{t("app.description")}</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "details" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="editionInfo">{t("app.editionInfo")}</Label>
                          <Input
                            id="editionInfo"
                            name="editionInfo"
                            value={formData.editionInfo}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language">{t("app.language")}</Label>
                          <Input id="language" name="language" value={formData.language} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="publisher">{t("app.publisher")}</Label>
                          <Input id="publisher" name="publisher" value={formData.publisher} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">{t("app.country")}</Label>
                          <Input id="country" name="country" value={formData.country} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="publicationPlace">{t("app.publicationPlace")}</Label>
                          <Input
                            id="publicationPlace"
                            name="publicationPlace"
                            value={formData.publicationPlace}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">{t("app.price")}</Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handlePriceChange}
                            className={errors.price ? "border-red-500" : ""}
                          />
                          {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="dimensions">{t("app.dimensions")}</Label>
                          <Input
                            id="dimensions"
                            name="dimensions"
                            value={formData.dimensions}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pages">{t("app.pages")}</Label>
                          <Input
                            id="pages"
                            name="pages"
                            type="number"
                            min="0"
                            value={formData.pages}
                            onChange={handleNumberChange}
                            className={errors.pages ? "border-red-500" : ""}
                          />
                          {errors.pages && <p className="text-sm text-red-500">{errors.pages}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "copies" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{t("app.copies")}</h3>
                        <Button type="button" onClick={handleAddCopy} className="hover:bg-primary/90 transition-colors">
                          <Plus className="mr-2 h-4 w-4" />
                          {t("app.addCopy")}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {copies.map((copy, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-4 rounded-lg border p-4"
                          >
                            <div className="flex-1 space-y-2">
                              <Label>{t("app.registrationNumber")}</Label>
                              <Input
                                value={copy.registrationNumber}
                                onChange={(e) => handleCopyChange(index, "registrationNumber", e.target.value)}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>{t("app.notes")}</Label>
                              <Input
                                value={copy.notes}
                                onChange={(e) => handleCopyChange(index, "notes", e.target.value)}
                                placeholder={t("app.copyNotesPlaceholder")}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCopy(index)}
                              className="hover:bg-destructive/20 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                              <span className="sr-only">{t("app.removeCopy")}</span>
                            </Button>
                          </motion.div>
                        ))}

                        {copies.length === 0 && (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                            <Book className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t("app.noCopies")}</p>
                            <p className="text-sm text-muted-foreground">{t("app.addCopiesDescription")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "subjects" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{t("app.subjects")}</h3>
                        <Button
                          type="button"
                          onClick={() =>
                            setSelectedSubjects([...selectedSubjects, { id: crypto.randomUUID(), name: "" }])
                          }
                          className="hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("app.addSubject")}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {selectedSubjects.map((subject, index) => (
                          <motion.div
                            key={subject.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-4 rounded-lg border p-4"
                          >
                            <div className="flex-1 space-y-2">
                              <Label>{t("app.subjectName")}</Label>
                              <Input
                                value={subject.name}
                                onChange={(e) => {
                                  const updatedSubjects = [...selectedSubjects]
                                  updatedSubjects[index].name = e.target.value
                                  setSelectedSubjects(updatedSubjects)
                                  console.log("Updated subjects:", updatedSubjects)
                                }}
                                placeholder={t("app.subjectNamePlaceholder")}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index))}
                              className="hover:bg-destructive/20 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                              <span className="sr-only">{t("app.removeSubject")}</span>
                            </Button>
                          </motion.div>
                        ))}

                        {selectedSubjects.length === 0 && (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t("app.noSubjects")}</p>
                            <p className="text-sm text-muted-foreground">{t("app.addSubjectsDescription")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("app.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid || isLoading} className="hover:bg-primary/90 transition-colors">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("app.saving")}
                </>
              ) : (
                t("app.save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* OpenLibrary Search Dialog */}
      <Dialog open={isOpenLibrarySearchOpen} onOpenChange={setIsOpenLibrarySearchOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("app.searchOpenLibrary")}</DialogTitle>
            <DialogDescription>{t("app.searchOpenLibraryDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearchOpenLibrary} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("app.searchByTitleOrAuthor")}
                value={openLibraryQuery}
                onChange={(e) => setOpenLibraryQuery(e.target.value)}
              />
              <Button type="submit" disabled={isSearchingOpenLibrary}>
                {isSearchingOpenLibrary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {openLibraryResults.map((book) => (
                <motion.div
                  key={book.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectOpenLibraryBook(book.key)}
                >
                  {book.covers?.[0] ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.covers[0]}-S.jpg`}
                      alt={book.title}
                      className="h-20 w-14 object-cover rounded"
                    />
                  ) : (
                    <div className="flex h-20 w-14 items-center justify-center rounded bg-muted">
                      <Book className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium">{book.title}</h3>
                    {book.subtitle && <p className="text-sm text-muted-foreground">{book.subtitle}</p>}
                    {book.authors && (
                      <p className="text-sm text-muted-foreground">{book.authors.map((a) => a.name).join(", ")}</p>
                    )}
                    {book.isbn_13?.[0] && <p className="text-xs text-muted-foreground">ISBN: {book.isbn_13[0]}</p>}
                  </div>
                </motion.div>
              ))}

              {openLibraryResults.length === 0 && openLibraryQuery && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t("app.noResults")}</p>
                  <p className="text-sm text-muted-foreground">{t("app.tryDifferentSearch")}</p>
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
