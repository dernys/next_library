"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Minus, Upload, RefreshCw, Tag, Copy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function MaterialModal({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  formData,
  setFormData,
  categories,
  materialTypes,
  collections,
  subjects,
  selectedSubjects,
  setSelectedSubjects,
  copies,
  setCopies,
  isLoading,
  mode = "add",
}) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubjectPopoverOpen, setIsSubjectPopoverOpen] = useState(false)
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("")
  const [nextRegistrationNumber, setNextRegistrationNumber] = useState("")

  useEffect(() => {
    if (isOpen && mode === "add") {
      fetchNextRegistrationNumber()
    }
  }, [isOpen, mode])

  const fetchNextRegistrationNumber = async () => {
    try {
      const response = await fetch("/api/materials/next-registration-number")
      const data = await response.json()
      setNextRegistrationNumber(data.nextRegistrationNumber)
    } catch (error) {
      console.error("Error fetching next registration number:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value === "none" ? "" : value }))
  }

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    const numValue = Number.parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleAddCopy = () => {
    setCopies([...copies, { registrationNumber: nextRegistrationNumber, notes: "" }])

    // Incrementar el número de registro para la próxima copia
    const prefix = nextRegistrationNumber.match(/^[A-Za-z]+/)?.[0] || ""
    const number = Number.parseInt(nextRegistrationNumber.replace(prefix, ""), 10)
    if (!isNaN(number)) {
      setNextRegistrationNumber(
        `${prefix}${(number + 1).toString().padStart(nextRegistrationNumber.length - prefix.length, "0")}`,
      )
    }
  }

  const handleRemoveCopy = (index) => {
    setCopies(copies.filter((_, i) => i !== index))
  }

  const handleCopyChange = (index, field, value) => {
    const newCopies = [...copies]
    newCopies[index] = { ...newCopies[index], [field]: value }
    setCopies(newCopies)
  }

  const handleAddSubject = (subject) => {
    if (!selectedSubjects.some((s) => s.id === subject.id)) {
      setSelectedSubjects([...selectedSubjects, subject])
    }
    setIsSubjectPopoverOpen(false)
  }

  const handleRemoveSubject = (subjectId) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subjectId))
  }

  const filteredSubjects = subjectSearchQuery
    ? subjects.filter((subject) => subject.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
    : subjects

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 grid grid-cols-5 w-full">
              <TabsTrigger value="basic" className="transition-all duration-200 hover:bg-primary/10">
                {t("app.basicInfo")}
              </TabsTrigger>
              <TabsTrigger value="details" className="transition-all duration-200 hover:bg-primary/10">
                {t("app.detailedInfo")}
              </TabsTrigger>
              <TabsTrigger value="catalog" className="transition-all duration-200 hover:bg-primary/10">
                {t("app.catalogInfo")}
              </TabsTrigger>
              <TabsTrigger value="copies" className="transition-all duration-200 hover:bg-primary/10">
                {t("app.copies")}
              </TabsTrigger>
              <TabsTrigger value="subjects" className="transition-all duration-200 hover:bg-primary/10">
                {t("app.subjects")}
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="basic" className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      {t("app.title")}
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subtitle" className="text-right">
                      {t("app.subtitle")}
                    </Label>
                    <Input
                      id="subtitle"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="author" className="text-right">
                      {t("app.author")}
                    </Label>
                    <Input
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isbn" className="text-right">
                      {t("app.isbn")}
                    </Label>
                    <Input
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editionInfo" className="text-right">
                      {t("app.editionInfo")}
                    </Label>
                    <Input
                      id="editionInfo"
                      name="editionInfo"
                      value={formData.editionInfo}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      {t("app.category")}
                    </Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => handleSelectChange("categoryId", value)}
                      required
                    >
                      <SelectTrigger className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50">
                        <SelectValue placeholder={t("app.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right">
                      <Label htmlFor="isOpac">{t("app.isOpac")}</Label>
                    </div>
                    <div className="col-span-3 flex items-center space-x-2">
                      <Checkbox
                        id="isOpac"
                        checked={formData.isOpac}
                        onCheckedChange={(checked) => handleCheckboxChange("isOpac", checked === true)}
                        className="transition-all duration-200 data-[state=checked]:bg-primary"
                      />
                      <Label htmlFor="isOpac">{t("app.isOpacDescription")}</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="materialType" className="text-right">
                      {t("app.materialType")}
                    </Label>
                    <Select
                      value={formData.materialTypeId}
                      onValueChange={(value) => handleSelectChange("materialTypeId", value)}
                    >
                      <SelectTrigger className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50">
                        <SelectValue placeholder={t("app.selectMaterialType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {materialTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="collection" className="text-right">
                      {t("app.collection")}
                    </Label>
                    <Select
                      value={formData.collectionId}
                      onValueChange={(value) => handleSelectChange("collectionId", value)}
                    >
                      <SelectTrigger className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50">
                        <SelectValue placeholder={t("app.selectCollection")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="language" className="text-right">
                      {t("app.language")}
                    </Label>
                    <Input
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="publisher" className="text-right">
                      {t("app.publisher")}
                    </Label>
                    <Input
                      id="publisher"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="country" className="text-right">
                      {t("app.country")}
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="publicationPlace" className="text-right">
                      {t("app.publicationPlace")}
                    </Label>
                    <Input
                      id="publicationPlace"
                      name="publicationPlace"
                      value={formData.publicationPlace}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="catalog" className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      {t("app.price")}
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handlePriceChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dimensions" className="text-right">
                      {t("app.dimensions")}
                    </Label>
                    <Input
                      id="dimensions"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 21x29.7 cm"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pages" className="text-right">
                      {t("app.pages")}
                    </Label>
                    <Input
                      id="pages"
                      name="pages"
                      type="number"
                      min="0"
                      value={formData.pages}
                      onChange={handleNumberChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="registrationNumber" className="text-right">
                      {t("app.registrationNumber")}
                    </Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entry1" className="text-right">
                      {t("app.entry1")}
                    </Label>
                    <Input
                      id="entry1"
                      name="entry1"
                      value={formData.entry1}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entry2" className="text-right">
                      {t("app.entry2")}
                    </Label>
                    <Input
                      id="entry2"
                      name="entry2"
                      value={formData.entry2}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="entry3" className="text-right">
                      {t("app.entry3")}
                    </Label>
                    <Input
                      id="entry3"
                      name="entry3"
                      value={formData.entry3}
                      onChange={handleChange}
                      className="col-span-3 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coverImage" className="text-right">
                      {t("app.coverImage")}
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        id="coverImage"
                        name="coverImage"
                        value={formData.coverImage}
                        onChange={handleChange}
                        className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                        placeholder="URL de la imagen"
                      />
                      <Button type="button" variant="outline" className="hover:bg-primary/10 transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        {t("app.upload")}
                      </Button>
                    </div>
                  </div>
                  {formData.coverImage && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="text-right">
                        <Label>{t("app.preview")}</Label>
                      </div>
                      <div className="col-span-3">
                        <div className="w-32 h-48 border rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                          <img
                            src={formData.coverImage || "/placeholder.svg"}
                            alt={formData.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=192&width=128"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="copies" className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{t("app.manageCopies")}</h3>
                    <Button
                      type="button"
                      onClick={handleAddCopy}
                      size="sm"
                      className="hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("app.addCopy")}
                    </Button>
                  </div>

                  {copies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Copy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t("app.noCopies")}</p>
                      <p className="text-sm">{t("app.addCopyDescription")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {copies.map((copy, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-4 p-4 border rounded-md hover:shadow-md transition-all"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`copy-${index}-reg`}>{t("app.registrationNumber")}</Label>
                                <Input
                                  id={`copy-${index}-reg`}
                                  value={copy.registrationNumber}
                                  onChange={(e) => handleCopyChange(index, "registrationNumber", e.target.value)}
                                  className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`copy-${index}-notes`}>{t("app.notes")}</Label>
                                <Input
                                  id={`copy-${index}-notes`}
                                  value={copy.notes}
                                  onChange={(e) => handleCopyChange(index, "notes", e.target.value)}
                                  className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                                  placeholder={t("app.optional")}
                                />
                              </div>
                            </div>
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
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="subjects" className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{t("app.manageSubjects")}</h3>
                    <Popover open={isSubjectPopoverOpen} onOpenChange={setIsSubjectPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" size="sm" className="hover:bg-primary/90 transition-colors">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("app.addSubject")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <Command>
                          <CommandInput
                            placeholder={t("app.searchSubjects")}
                            value={subjectSearchQuery}
                            onValueChange={setSubjectSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>{t("app.noSubjectsFound")}</CommandEmpty>
                            <CommandGroup>
                              {filteredSubjects.map((subject) => (
                                <CommandItem
                                  key={subject.id}
                                  onSelect={() => handleAddSubject(subject)}
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  {subject.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedSubjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t("app.noSubjects")}</p>
                      <p className="text-sm">{t("app.addSubjectDescription")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedSubjects.map((subject) => (
                        <motion.div
                          key={subject.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 hover:shadow-sm">
                            {subject.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubject(subject.id)}
                              className="h-4 w-4 p-0 hover:bg-destructive/20 transition-colors rounded-full"
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">{t("app.removeSubject")}</span>
                            </Button>
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="hover:bg-muted/50 transition-colors">
                {t("app.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading} className="hover:bg-primary/90 transition-colors">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("app.processing")}
                  </>
                ) : (
                  t("app.save")
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  )
}
