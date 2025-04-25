"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LibraryInfo {
  id?: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  openingHours: string
}

export default function ManageLibraryInfo() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [libraryInfo, setLibraryInfo] = useState<LibraryInfo>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    openingHours: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN" && session?.user?.role !== "LIBRARIAN") {
        router.push("/")
      } else {
        fetchLibraryInfo()
      }
    }
  }, [status, session, router])

  const fetchLibraryInfo = async () => {
    try {
      const response = await fetch("/api/library-info")
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setLibraryInfo(data)
        }
      }
    } catch (error) {
      console.error("Error fetching library info:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLibraryInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/library-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(libraryInfo),
      })

      if (response.ok) {
        toast({
          title: t("libraryInfo.saved"),
          variant: "success",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving library info:", error)
      toast({
        title: t("libraryInfo.error"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("libraryInfo.title")}</CardTitle>
          <CardDescription>{t("libraryInfo.manage")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("libraryInfo.name")}</Label>
                <Input id="name" name="name" value={libraryInfo.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("libraryInfo.email")}</Label>
                <Input id="email" name="email" type="email" value={libraryInfo.email} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("libraryInfo.phone")}</Label>
                <Input id="phone" name="phone" value={libraryInfo.phone} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t("libraryInfo.website")}</Label>
                <Input id="website" name="website" value={libraryInfo.website} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t("libraryInfo.address")}</Label>
              <Input id="address" name="address" value={libraryInfo.address} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingHours">{t("libraryInfo.openingHours")}</Label>
              <Input id="openingHours" name="openingHours" value={libraryInfo.openingHours} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("libraryInfo.description")}</Label>
              <Textarea
                id="description"
                name="description"
                value={libraryInfo.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("libraryInfo.save")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
