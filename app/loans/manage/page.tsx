"use client"
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
import { CalendarIcon, Search, User, Book, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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

type LoanUser = {
  id: string
  name: string
  lastName: string
  email: string
  identityCard: string | null
  phone: string | null
}

export default function ManageLoansPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  // State for materials
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialSearchQuery, setMaterialSearchQuery] = useState("")
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [selectedCopy, setSelectedCopy] = useState<MaterialCopy | null>(null)

  // State for users
  const [users, setUsers] = useState<LoanUser[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<LoanUser | null>(null)

  // State for loan creation
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  )
  const [isCreatingLoan, setIsCreatingLoan] = useState(false)

  // Dialog states
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)

  // Debounced search for materials
  useEffect(() => {
    const timer = setTimeout(() => {
      if (materialSearchQuery.trim()) {
        fetchMaterials()
      } else {
        setMaterials([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [materialSearchQuery])

  // Debounced search for users
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery.trim()) {
        fetchUsers()
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [userSearchQuery])

  async function fetchMaterials() {
    if (!materialSearchQuery.trim()) return

    try {
      setIsMaterialsLoading(true)
      const params = new URLSearchParams()
      params.append("query", materialSearchQuery)
      params.append("limit", "10")

      const response = await fetch(`/api/materials?${params.toString()}`)
      const data = await response.json()

      // Filter out materials with no available copies
      const availableMaterials = data.materials.filter((material: Material) =>
        material.copies.some((copy) => copy.status === "available"),
      )

      setMaterials(availableMaterials)
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingMaterials"),
        variant: "destructive",
      })
    } finally {
      setIsMaterialsLoading(false)
    }
  }

  async function fetchUsers() {
    if (!userSearchQuery.trim()) return

    try {
      setIsUsersLoading(true)
      const params = new URLSearchParams()
      params.append("query", userSearchQuery)
      params.append("role", "member")
      params.append("limit", "10")

      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()

      setUsers(data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingUsers"),
        variant: "destructive",
      })
    } finally {
      setIsUsersLoading(false)
    }
  }

  const handleCreateLoan = async () => {
    if (!selectedMaterial || !selectedUser || !selectedCopy || !dueDate) {
      toast({
        title: t("app.error"),
        description: t("app.pleaseSelectAllFields"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreatingLoan(true)
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialId: selectedMaterial.id,
          copyId: selectedCopy.id,
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

      // Reset form
      setSelectedMaterial(null)
      setSelectedUser(null)
      setSelectedCopy(null)
      setMaterialSearchQuery("")
      setUserSearchQuery("")
      setMaterials([])
      setUsers([])
      setIsConfirmDialogOpen(false)

      // Redirect to loans page
      router.push("/loans")
    } catch (error) {
      console.error("Error creating loan:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorCreatingLoan"),
        variant: "destructive",
      })
    } finally {
      setIsCreatingLoan(false)
    }
  }

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material)
    const availableCopies = material.copies.filter((copy) => copy.status === "available")
    if (availableCopies.length === 1) {
      setSelectedCopy(availableCopies[0])
    } else {
      setIsCopyDialogOpen(true)
    }
  }

  const handleSelectCopy = (copy: MaterialCopy) => {
    setSelectedCopy(copy)
    setIsCopyDialogOpen(false)
  }

  const canCreateLoan = selectedMaterial && selectedUser && selectedCopy && dueDate

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("app.createLoan")}</h1>
        <p className="text-muted-foreground mt-2">{t("app.createLoanDescription")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Material Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              {t("app.selectMaterial")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("app.searchMaterials")}
                  value={materialSearchQuery}
                  onChange={(e) => setMaterialSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedMaterial && (
                <div className="p-3 rounded-lg border bg-primary/5 border-primary">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{selectedMaterial.title}</div>
                      <div className="text-sm text-muted-foreground">{selectedMaterial.author}</div>
                      {selectedCopy && (
                        <Badge variant="secondary" className="mt-2">
                          {t("app.copy")}: {selectedCopy.registrationNumber}
                        </Badge>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isMaterialsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : materialSearchQuery && materials.length === 0 && !isMaterialsLoading ? (
                  <p className="text-center text-muted-foreground py-4">{t("app.noMaterialsFound")}</p>
                ) : (
                  materials.map((material) => {
                    const availableCopies = material.copies.filter((copy) => copy.status === "available")
                    return (
                      <div
                        key={material.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedMaterial?.id === material.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                        onClick={() => handleSelectMaterial(material)}
                      >
                        <div className="font-medium">{material.title}</div>
                        <div className="text-sm opacity-80">{material.author}</div>
                        <div className="text-xs mt-1">
                          <span className="text-green-500">
                            {t("app.availableCopies")}: {availableCopies.length}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("app.selectUser")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("app.searchUsers")}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedUser && (
                <div className="p-3 rounded-lg border bg-primary/5 border-primary">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {selectedUser.name} {selectedUser.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                      {selectedUser.identityCard && (
                        <div className="text-xs text-muted-foreground">
                          {t("app.identityCard")}: {selectedUser.identityCard}
                        </div>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isUsersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : userSearchQuery && users.length === 0 && !isUsersLoading ? (
                  <p className="text-center text-muted-foreground py-4">{t("app.noUsersFound")}</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="font-medium">
                        {user.name} {user.lastName}
                      </div>
                      <div className="text-sm opacity-80">{user.email}</div>
                      {user.identityCard && (
                        <div className="text-xs opacity-70">
                          {t("app.identityCard")}: {user.identityCard}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Details */}
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

            <div className="flex items-end">
              <Button
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={!canCreateLoan || isCreatingLoan}
                className="w-full"
              >
                {isCreatingLoan ? t("app.creating") : t("app.createLoan")}
              </Button>
            </div>
          </div>

          {/* Summary */}
          {(selectedMaterial || selectedUser) && (
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <h3 className="font-medium mb-3">{t("app.summary")}</h3>
              <div className="space-y-2 text-sm">
                {selectedMaterial && (
                  <div>
                    <strong>{t("app.material")}:</strong> {selectedMaterial.title} - {selectedMaterial.author}
                    {selectedCopy && (
                      <span className="ml-2 text-muted-foreground">
                        ({t("app.copy")}: {selectedCopy.registrationNumber})
                      </span>
                    )}
                  </div>
                )}
                {selectedUser && (
                  <div>
                    <strong>{t("app.user")}:</strong> {selectedUser.name} {selectedUser.lastName} - {selectedUser.email}
                  </div>
                )}
                {dueDate && (
                  <div>
                    <strong>{t("app.dueDate")}:</strong> {format(dueDate, "PPP")}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("app.confirmLoan")}</DialogTitle>
            <DialogDescription>{t("app.confirmLoanDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMaterial && selectedUser && selectedCopy && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  <span className="font-medium">{selectedMaterial.title}</span>
                  <span className="text-muted-foreground">- {selectedMaterial.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedUser.name} {selectedUser.lastName}
                  </span>
                  <span className="text-muted-foreground">- {selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">{t("app.dueDate")}:</span>
                  <span>{dueDate ? format(dueDate, "PPP") : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{t("app.copy")}:</span>
                  <span>{selectedCopy.registrationNumber}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              {t("app.cancel")}
            </Button>
            <Button onClick={handleCreateLoan} disabled={isCreatingLoan}>
              {isCreatingLoan ? t("app.creating") : t("app.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Selection Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("app.selectCopy")}</DialogTitle>
            <DialogDescription>{t("app.selectCopyDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {selectedMaterial?.copies
              .filter((copy) => copy.status === "available")
              .map((copy) => (
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
                  <div className="text-sm opacity-80">
                    {t("app.status")}: {t(`app.${copy.status}`)}
                  </div>
                  {copy.notes && (
                    <div className="text-xs opacity-70 mt-1">
                      {t("app.notes")}: {copy.notes}
                    </div>
                  )}
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
