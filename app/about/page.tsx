"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Phone, Globe, Clock, MapPin } from "lucide-react"

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

export default function AboutPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [libraryInfo, setLibraryInfo] = useState<LibraryInfo | null>(null)

  useEffect(() => {
    const fetchLibraryInfo = async () => {
      try {
        const response = await fetch("/api/library-info")
        if (response.ok) {
          const data = await response.json()
          setLibraryInfo(data)
        }
      } catch (error) {
        console.error("Error fetching library info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLibraryInfo()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!libraryInfo || Object.keys(libraryInfo).length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("about.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No hay información disponible sobre la biblioteca.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{libraryInfo.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {libraryInfo.description && (
            <div className="prose max-w-none dark:prose-invert">
              <p>{libraryInfo.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {t("about.location")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{libraryInfo.address || "No disponible"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {t("about.hours")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{libraryInfo.openingHours || "No disponible"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  {t("about.contact")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {libraryInfo.email && (
                  <p className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    <a href={`mailto:${libraryInfo.email}`} className="hover:underline">
                      {libraryInfo.email}
                    </a>
                  </p>
                )}
                {libraryInfo.phone && (
                  <p className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    <a href={`tel:${libraryInfo.phone}`} className="hover:underline">
                      {libraryInfo.phone}
                    </a>
                  </p>
                )}
                {libraryInfo.website && (
                  <p className="flex items-center">
                    <Globe className="mr-2 h-4 w-4" />
                    <a href={libraryInfo.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {libraryInfo.website}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
