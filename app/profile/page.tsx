"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, User } from "lucide-react"

type UserProfile = {
  id: string
  name: string
  email: string
  role: {
    id: string
    name: string
  }
}

type Loan = {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: string
  material: {
    id: string
    title: string
    author: string
  }
}

export default function ProfilePage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (session?.user.id) {
      fetchProfile()
      fetchLoans()
    }
  }, [session])

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
      })
    }
  }, [profile])

  async function fetchProfile() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${session?.user.id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: t("app.error"),
        description: t("app.errorFetchingProfile"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchLoans() {
    try {
      const params = new URLSearchParams()
      params.append("userId", session?.user.id || "")
      params.append("limit", "50")

      const response = await fetch(`/api/loans?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch loans")
      }

      const data = await response.json()
      setLoans(data.loans || [])
    } catch (error) {
      console.error("Error fetching loans:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsUpdating(true)

      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)

      toast({
        title: t("app.success"),
        description: t("app.profileUpdated"),
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingProfile"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t("app.error"),
        description: t("app.passwordMismatch"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)

      const response = await fetch(`/api/users/${session?.user.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update password")
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: t("app.success"),
        description: t("app.passwordUpdated"),
      })
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: t("app.error"),
        description: error instanceof Error ? error.message : t("app.errorUpdatingPassword"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "returned":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("app.profile")}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("app.userProfile")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-12 w-12" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold">{profile?.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <div className="mt-2">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                      {t(`app.${profile?.role.name}`)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="loans">
            <TabsList className="mb-4">
              <TabsTrigger value="loans">{t("app.loanHistory")}</TabsTrigger>
              <TabsTrigger value="settings">{t("app.settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="loans">
              <Card>
                <CardHeader>
                  <CardTitle>{t("app.loanHistory")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : loans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-lg font-medium">{t("app.noLoans")}</p>
                      <p className="text-sm text-muted-foreground">{t("app.noLoansDescription")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loans.map((loan) => (
                        <div key={loan.id} className="flex flex-col space-y-2 rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{loan.material.title}</h3>
                            <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(loan.status)}`}>
                              {t(`app.${loan.status}`)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{loan.material.author}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                            <span>
                              <strong>{t("app.loanDate")}:</strong> {formatDate(loan.loanDate)}
                            </span>
                            <span>
                              <strong>{t("app.dueDate")}:</strong> {formatDate(loan.dueDate)}
                            </span>
                            {loan.returnDate && (
                              <span>
                                <strong>{t("app.returnDate")}:</strong> {formatDate(loan.returnDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("app.updateProfile")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("app.name")}</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("app.email")}</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? t("app.updating") : t("app.updateProfile")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("app.changePassword")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t("app.currentPassword")}</Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">{t("app.newPassword")}</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t("app.confirmPassword")}</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? t("app.updating") : t("app.changePassword")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
