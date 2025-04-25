"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { InfoIcon, Book } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Material = {
  id: string
  title: string
  author: string
  quantity: number
  category: {
    id: string
    name: string
  }
}

// Mejorar la experiencia de usuario para préstamos de invitados
export default function RequestLoanPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  )
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchMaterials()
  }, [searchQuery])

  async function fetchMaterials() {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (searchQuery) params.append("query", searchQuery)

      const response = await fetch(`/api/materials?${params.toString()}`)
      const data = await response.json()

      // Filter out materials with quantity 0
      const availableMaterials = data.materials.filter((material: Material) => material.quantity > 0)

      setMaterials(availableMaterials)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMaterials()
  }

  const handleGuestInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGuestInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleRequestLoan = async () => {
    if (!selectedMaterial || !dueDate) return

    // Check if guest info is required and provided
    if (!session && (!guestInfo.name || !guestInfo.email)) {
      toast({
        title: t("app.error"),
        description: t("app.pleaseProvideGuestInfo"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          userId: session?.user.id,
          guestName: !session ? guestInfo.name : undefined,
          guestEmail: !session ? guestInfo.email : undefined,
          dueDate: dueDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to request loan")
      }

      toast({
        title: t("app.success"),
        description: t("app.loanRequestSuccess"),
      })

      setIsDialogOpen(false)

      // Si es un usuario invitado, mostrar un mensaje adicional
      if (!session) {
        toast({
          title: t("app.loanRequestPending"),
          description: t("app.loanRequestPendingDescription"),
          duration: 6000,
        })
        // Redirigir a la página principal después de un préstamo de invitado
        router.push("/")
      } else {
        // Redirigir a la página de préstamos para usuarios autenticados
        router.push("/loans")
      }
    } catch (error) {
      console.error("Error requesting loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorRequestingLoan"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("app.requestLoan")}</h1>

      {!session && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InfoIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">{t("app.guestLoanInfo")}</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>{t("app.guestLoanInfoDescription")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-6 hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle>{t("app.searchMaterials")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t("app.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hover:border-primary focus:border-primary transition-colors"
              />
            </div>
            <Button type="submit" className="hover:bg-primary/90 transition-colors">
              <Search className="mr-2 h-4 w-4" />
              {t("app.search")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-9 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : materials.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Book className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("app.noMaterialsAvailable")}</p>
            <p className="text-sm text-muted-foreground">{t("app.tryDifferentSearch")}</p>
          </div>
        ) : (
          materials.map((material) => (
            <Card
              key={material.id}
              className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 duration-300"
            >
              <CardHeader>
                <CardTitle className="line-clamp-1">{material.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{material.author}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-secondary inline-block px-2 py-1 rounded-full">
                    {material.category.name}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full">
                    {t("app.available")}: {material.quantity}
                  </span>
                </div>
                <Button
                  className="w-full mt-4 hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    setSelectedMaterial(material)
                    setIsDialogOpen(true)
                  }}
                >
                  {t("app.requestLoan")}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("app.confirmLoanRequest")}</DialogTitle>
            <DialogDescription>{t("app.confirmLoanRequestDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMaterial && (
              <>
                <p className="mb-2">
                  <strong>{t("app.title")}:</strong> {selectedMaterial.title}
                </p>
                <p className="mb-2">
                  <strong>{t("app.author")}:</strong> {selectedMaterial.author}
                </p>

                {!session && (
                  <div className="space-y-4 mb-4 p-4 border rounded-md">
                    <h3 className="font-medium">{t("app.guestInformation")}</h3>
                    <div className="space-y-2">
                      <Label htmlFor="guestName">{t("app.name")}</Label>
                      <Input
                        id="guestName"
                        name="name"
                        value={guestInfo.name}
                        onChange={handleGuestInfoChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">{t("app.email")}</Label>
                      <Input
                        id="guestEmail"
                        name="email"
                        type="email"
                        value={guestInfo.email}
                        onChange={handleGuestInfoChange}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <Label htmlFor="dueDate" className="mb-2 block">
                    {t("app.dueDate")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal hover:border-primary transition-colors",
                          !dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>{t("app.selectDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button
              onClick={handleRequestLoan}
              disabled={isSubmitting}
              className="hover:bg-primary/90 transition-colors"
            >
              {isSubmitting ? t("app.processing") : t("app.confirmRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
