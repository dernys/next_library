"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

type MaterialCopy = {
  id: string
  registrationNumber: string
  status: string
  notes: string | null
}

type Material = {
  id: string
  title: string
  author: string
  quantity: number
  copies: MaterialCopy[]
}

type User = {
  id: string
  name: string
  email: string
}

export default function ManageLoansPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  const [materials, setMaterials] = useState<Material[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [materialSearchQuery, setMaterialSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  )
  const [selectedCopy, setSelectedCopy] = useState<MaterialCopy | null>(null)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)

  useEffect(() => {
    fetchMaterials()
    fetchUsers()
  }, [])

  async function fetchMaterials() {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (materialSearchQuery) params.append("query", materialSearchQuery)

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

  async function fetchUsers() {
    try {
      const params = new URLSearchParams()
      if (userSearchQuery) params.append("query", userSearchQuery)

      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()

      setUsers(data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleMaterialSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMaterials()
  }

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleCreateLoan = async () => {
    if (!selectedMaterial || !selectedUser || !dueDate) return

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          userId: selectedUser.id,
          dueDate: dueDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create loan")
      }

      toast({
        title: t("app.success"),
        description: t("app.loanCreated"),
      })

      setIsDialogOpen(false)
      router.push("/loans")
    } catch (error) {
      console.error("Error creating loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorCreatingLoan"),
        variant: "destructive",
      })
    }
  }

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setIsCopyDialogOpen(true)
  }

  const handleSelectCopy = (copy: MaterialCopy) => {
    setSelectedCopy(copy)
    setIsCopyDialogOpen(false)
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("app.createLoan")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("app.selectMaterial")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMaterialSearch} className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder={t("app.searchMaterials")}
                  value={materialSearchQuery}
                  onChange={(e) => setMaterialSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                {t("app.search")}
              </Button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <p>{t("app.loading")}</p>
              ) : materials.length === 0 ? (
                <p>{t("app.noMaterialsAvailable")}</p>
              ) : (
                materials.map((material) => (
                  <div
                    key={material.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMaterial?.id === material.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    } ${material.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => material.quantity > 0 && handleSelectMaterial(material)}
                  >
                    <div className="font-medium">{material.title}</div>
                    <div className="text-sm">{material.author}</div>
                    <div className="text-xs mt-1">
                      {material.quantity === 0 ? (
                        <span className="text-red-500">{t("app.noCopiesAvailable")}</span>
                      ) : (
                        <span className="text-green-500">
                          {t("app.available")}: {material.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("app.selectUser")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUserSearch} className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder={t("app.searchUsers")}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                {t("app.search")}
              </Button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users.length === 0 ? (
                <p>{t("app.noUsersFound")}</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm">{user.email}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("app.loanDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="dueDate" className="mb-2 block">
                {t("app.dueDate")}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
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
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsDialogOpen(true)} disabled={!selectedMaterial || !selectedUser || !dueDate}>
              {t("app.createLoan")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("app.confirmLoan")}</DialogTitle>
            <DialogDescription>{t("app.confirmLoanDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMaterial && selectedUser && (
              <>
                <p className="mb-2">
                  <strong>{t("app.material")}:</strong> {selectedMaterial.title} - {selectedMaterial.author}
                </p>
                <p className="mb-2">
                  <strong>{t("app.user")}:</strong> {selectedUser.name} - {selectedUser.email}
                </p>
                <p className="mb-4">
                  <strong>{t("app.dueDate")}:</strong> {dueDate ? format(dueDate, "PPP") : ""}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button onClick={handleCreateLoan}>{t("app.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("app.selectCopy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {selectedMaterial?.copies.map((copy) => (
              <div
                key={copy.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCopy?.id === copy.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => handleSelectCopy(copy)}
              >
                <div className="font-medium">
                  {t("app.registrationNumber")}: {copy.registrationNumber}
                </div>
                <div className="text-sm">
                  {t("app.notes")}: {copy.notes || t("app.noNotes")}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
